import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { root, loadConfig, loadLocalEnv } from '../config/env.js';
import { createDriver } from '../common/support/browser-factory.js';
import { LoginPage } from '../common/pages/LoginPage.js';
import { StudentPage } from './pages/StudentPage.js';
import { prepareStudent } from './support/fixtures.js';
import { studentCases } from './cases/exam-taking.spec.js';
import { writeSuiteReport } from '../common/support/suite-reporter.js';
import { sanitize } from '../common/support/reporter.js';
import { summarizeNetwork } from './support/network.js';
import { prepareStudentRuntime, checkRuntimeDirectory, probeStudentBrowser } from './support/runtime.js';
import { studentFailure } from './support/failure-policy.js';
import { checkStagingAvailability } from './support/staging-health.js';

loadLocalEnv();
const args = process.argv.slice(2);
const checkOnly = args.includes('--check-only');
const listOnly = args.includes('--list');
const selectedId = args.find(arg => arg.startsWith('--case='))?.slice(7);
const selected = selectedId 
  ? studentCases.filter(test => test.id === selectedId || test.id === selectedId.replace(/^STU-/, 'QA30-'))
  : studentCases;

if (listOnly || checkOnly) {
  for (const t of selected) console.log(`${t.id} | ${t.title}`);
  if (checkOnly) {
    console.log(`[STUDENT] CHECK OK: registry/config verified. ${selected.length} cases registered.`);
    if (process.send) process.send({ type: 'check', status: 'OK', count: selected.length });
    process.exit(0);
  }
} else {
  await run();
}

async function run() {
  const startedAt = new Date().toISOString();
  const directory = path.join(root, 'reports', `student-e2e-${startedAt.replace(/[:.]/g, '-')}`);
  const report = {
    suite: { id: 'STU-E2E', role: 'Student', key: 'Student.E2E' },
    startedAt,
    status: 'RUNNING',
    mode: 'STAGING UI — Selenium + API readback',
    cases: [],
    scope: `${studentCases.length} Student UI cases: enrolled classes, assignments, four-skill submissions, draft/validation, grades, official feedback, periodic evaluations and attempt history.`
  };

  let config, data, driver, release, runtime;
  let interrupted = false;
  const safe = value => sanitize(value, config?.users || {});

  process.on('SIGINT', () => {
    interrupted = true;
    driver?.quit().catch(() => {});
  });

  try {
    config = loadConfig();
    config.fakeMedia = true;
    config.captureNetwork = true;
    config.dataTimeoutMs = Number(process.env.STU_DATA_TIMEOUT_MS || process.env.QA30_DATA_TIMEOUT_MS || 60000);
    
    const pacing = args.find(arg => arg.startsWith('--delay-ms='));
    if (args.includes('--watch')) {
      config.headless = false;
      config.observeMs = pacing ? Number(pacing.slice(11)) : 1200;
    }

    report.selectedCases = selected.map(test => test.id);
    try {
      report.issueLinks = JSON.parse(await fs.readFile(path.join(root, 'black-box/e2e/student/support/issue-links.json'), 'utf8'));
    } catch {
      report.issueLinks = {};
    }

    Object.assign(report, { baseUrl: config.baseUrl, browser: config.browser, headless: config.headless, dataTimeoutMs: config.dataTimeoutMs });
    report.directory = directory;
  await fs.mkdir(directory, { recursive: true });

    const lock = path.join(root, '.cache/student-e2e.lock');
    await fs.mkdir(path.dirname(lock), { recursive: true });
    let handle;
    try {
      handle = await fs.open(lock, 'wx');
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const previous = JSON.parse(await fs.readFile(lock, 'utf8').catch(() => '{}'));
      let active = true;
      try { process.kill(previous.pid, 0); } catch { active = false; }
      if (active) throw new Error('Student runner is already executing.');
      await fs.unlink(lock).catch(() => {});
      handle = await fs.open(lock, 'wx');
    }
    await handle.writeFile(JSON.stringify({ pid: process.pid }));
    await handle.close();
    release = async () => {
      const current = JSON.parse(await fs.readFile(lock, 'utf8').catch(() => '{}'));
      if (current.pid === process.pid) await fs.unlink(lock).catch(() => {});
    };

    report.setupPhase = 'runtime-preflight';
    console.log('[STUDENT] Preflight: kiểm tra staging và Chrome...');
    await checkRuntimeDirectory(root);
    await checkStagingAvailability(config);
    report.browserProbe = await probeStudentBrowser(config);
    runtime = await prepareStudentRuntime(root);

    report.setupPhase = 'fixtures';
    console.log('[STUDENT] Chuẩn bị dữ liệu kiểm thử Student...');
    data = await prepareStudent(config, { fresh: args.includes('--fresh-fixtures'), quick: args.includes('--quick'), targetCase: selectedId }, directory);

    if (args.includes('--prepare-only')) {
      console.log('[STUDENT] Fixtures prepared successfully (--prepare-only).');
      return;
    }

    for (const test of selected) {
      if (interrupted) break;
      const result = {
        id: test.id,
        title: test.title,
        steps: test.steps,
        expected: test.expected,
        startedAt: new Date().toISOString(),
        evidence: []
      };
      report.cases.push(result);
      console.log(`\n[STUDENT] ${test.id} ${test.title}`);

      try {
        result.phase = 'driver';
        driver = await createDriver(config);
        result.phase = 'login';
        const login = new LoginPage(driver, config);
        await login.open();
        await login.login(config.users.student, 'student');
        await login.waitForRole('student');

        result.phase = 'scenario';
        const page = new StudentPage(driver, config, data);
        await test.run(page, data, result);
        result.status = 'PASSED';
        result.classification = 'ASSERTIONS_PASSED';
      } catch (error) {
        result.status = interrupted ? 'ABORTED' : ['STU_BLOCKED', 'QA30_BLOCKED'].includes(error.code) ? 'BLOCKED' : 'FAILED';
        result.classification = studentFailure(error, result.phase);
        result.reason = safe(error.message);
      } finally {
        if (driver) {
          try {
            result.actualUrl = await driver.getCurrentUrl();
            result.screenshot = `${test.id}.png`;
            await fs.writeFile(path.join(directory, result.screenshot), await driver.takeScreenshot(), 'base64');
          } catch (e) {
            result.evidenceError = safe(e.message);
          }
          await driver.quit().catch(() => {});
          driver = undefined;
        }
        result.finishedAt = new Date().toISOString();
        console.log(`[STUDENT] ${result.status} ${result.reason || ''}`);
        await writeSuiteReport(directory, report, config.users);
      }
    }
    report.status = interrupted ? 'INTERRUPTED' : 'COMPLETED';
  } catch (error) {
    report.status = 'BLOCKED';
    report.reason = safe(error.message);
    console.log(`[STUDENT ERROR] ${report.reason}`);
  } finally {
    await driver?.quit().catch(() => {});
    await runtime?.cleanup().catch(() => {});
    await release?.().catch(() => {});
    report.finishedAt = new Date().toISOString();
    await writeSuiteReport(directory, report, config?.users || {});
    console.log(`[STUDENT REPORT]: ${path.join(directory, 'report.html')}`);
    if (process.send) process.send({ type: 'result', report });
    process.exitCode = report.cases.some(c => c.status === 'FAILED') ? 1 : report.status !== 'COMPLETED' || report.cases.some(c => c.status !== 'PASSED') ? 2 : 0;
  }
}
