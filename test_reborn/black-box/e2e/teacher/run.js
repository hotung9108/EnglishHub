import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { root, loadConfig, loadLocalEnv } from '../config/env.js';
import { createDriver } from '../common/support/browser-factory.js';
import { LoginPage } from '../common/pages/LoginPage.js';
import { TeacherPage } from './pages/TeacherPage.js';
import { TeacherExtendedPage } from './pages/TeacherExtendedPage.js';
import { prepareExpanded, prepareBase } from './support/expanded-api.js';
import { classifyFailure } from './support/classification.js';
import { sanitize } from '../common/support/reporter.js';
import { teacherData, missingInputs, teacherOptions } from './support/config.js';
import { teacherCases } from './cases/assignment-flow.spec.js';
import { writeTeacherReport } from './support/report.js';
import { cleanupFixtures } from './support/cleanup.js';
import { acquireRunLock } from './support/run-lock.js';

loadLocalEnv();
const options = teacherOptions(process.argv.slice(2));

if (options.list || options.checkOnly) {
  const selected = options.caseId 
    ? teacherCases.filter(c => c.id === options.caseId || c.id === options.caseId.replace(/^TEA-/, 'QA29-'))
    : teacherCases;
  for (const t of selected) console.log(`${t.id} | ${t.title}`);
  if (options.checkOnly) {
    console.log(`[TEACHER] CHECK OK: registry/config verified. ${selected.length} cases registered.`);
    if (process.send) process.send({ type: 'check', status: 'OK', count: selected.length });
    process.exit(0);
  }
} else {
  await run();
}

async function run() {
  const startedAt = new Date().toISOString();
  const directory = path.join(root, 'reports', `teacher-e2e-${startedAt.replace(/[:.]/g, '-')}`);
  const report = {
    suite: { id: 'TEA-E2E', role: 'Teacher', key: 'Teacher.E2E' },
    startedAt,
    mode: 'STAGING UI — Selenium',
    status: 'RUNNING',
    cases: [],
    scope: 'Expanded Teacher UI suite: four-skill creation/preview/grading, editing/schedule, reports/API comparison, AI, permissions, isolated profile/password/settings, logout.'
  };

  let exitCode = 0;
  let config;
  let interrupted = false;
  let activeDriver;
  let activeSetup;
  let release;

  process.on('SIGINT', () => {
    interrupted = true;
    activeDriver?.quit().catch(() => {});
    activeSetup?.kill();
  });

  const safe = value => sanitize(value, config?.users || {});

  try {
    config = loadConfig();
    config.observeMs = options.observeMs;
    if (options.observeMs) config.headless = false;
    const data = teacherData();
    config.dataTimeoutMs = data.dataTimeoutMs;
    report.dataTimeoutMs = data.dataTimeoutMs;
    report.baseUrl = config.baseUrl;
    report.browser = config.browser;
    report.headless = config.headless;
    report.observeMs = config.observeMs;

    const id = options.caseId;
    const selected = id 
      ? teacherCases.filter(item => item.id === id || item.id === id.replace(/^TEA-/, 'QA29-'))
      : teacherCases;
    if (!selected.length) throw new Error(`Unknown test case: ${id}`);
    report.selectedCases = selected.map(test => test.id);

    release = await acquireRunLock();
    report.directory = directory;
  await fs.mkdir(directory, { recursive: true });

    let baseFixtures;
    let expandedFixtures;

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
      console.log(`\n[TEACHER] ${test.id} ${test.title}`);

      try {
        if (!baseFixtures) {
          console.log('[TEACHER] Preparing base teacher fixtures via API...');
          baseFixtures = await prepareBase(config, data);
        }
        if (test.expanded && !expandedFixtures) {
          console.log('[TEACHER] Preparing expanded teacher fixtures via API...');
          expandedFixtures = await prepareExpanded(config, data);
        }

        const fixtureContext = test.expanded ? expandedFixtures : baseFixtures;
        const missing = missingInputs(test.required || [], config, fixtureContext);
        if (missing.length) {
          const err = new Error(`Missing required inputs: ${missing.join(', ')}`);
          err.code = 'TEA_MISSING_INPUTS';
          throw err;
        }

        activeDriver = await createDriver(config);
        result.phase = 'login';
        const loginPage = new LoginPage(activeDriver, config);
        await loginPage.open();
        const loginUser = test.loginAs === 'profile' ? (fixtureContext.profileUser || config.users.profile) : config.users.teacher;
        await loginPage.login(loginUser, 'teacher');
        await loginPage.waitForRole('teacher');

        result.phase = 'scenario';
        const page = test.expanded 
          ? new TeacherExtendedPage(activeDriver, config)
          : new TeacherPage(activeDriver, config);
        page.data = fixtureContext;
        page.selectedClassName = fixtureContext?.className;
        await page.ready?.();

        await test.run(page, fixtureContext, result);
        result.status = 'PASSED';
        result.classification = 'ASSERTIONS_PASSED';
      } catch (error) {
        result.status = interrupted ? 'ABORTED' : ['TEA_BLOCKED', 'QA29_BLOCKED', 'TEA_MISSING_INPUTS'].includes(error.code) ? 'BLOCKED' : 'FAILED';
        result.classification = classifyFailure(error, result.phase);
        result.reason = safe(error.message);
      } finally {
        if (activeDriver) {
          try {
            result.actualUrl = await activeDriver.getCurrentUrl();
            result.screenshot = `${test.id}.png`;
            await fs.writeFile(path.join(directory, result.screenshot), await activeDriver.takeScreenshot(), 'base64');
          } catch (e) {
            result.evidenceError = safe(e.message);
          }
          await activeDriver.quit().catch(() => {});
          activeDriver = undefined;
        }
        result.finishedAt = new Date().toISOString();
        console.log(`[TEACHER] ${result.status} ${result.reason || ''}`);
        await writeTeacherReport(directory, report, config?.users || {});
      }
    }
    report.status = interrupted ? 'INTERRUPTED' : 'COMPLETED';
  } catch (error) {
    report.status = 'BLOCKED';
    report.reason = safe(error.message);
    console.log(`[TEACHER ERROR] ${report.reason}`);
  } finally {
    await activeDriver?.quit().catch(() => {});
    await release?.().catch(() => {});
    report.finishedAt = new Date().toISOString();
    await writeTeacherReport(directory, report, config?.users || {});
    console.log(`[TEACHER REPORT]: ${path.join(directory, 'report.html')}`);
    if (process.send) process.send({ type: 'result', report });
    process.exitCode = report.cases.some(c => c.status === 'FAILED') ? 1 : report.status !== 'COMPLETED' || report.cases.some(c => c.status !== 'PASSED') ? 2 : 0;
  }
}
