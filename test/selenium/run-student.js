import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { root, loadConfig, loadLocalEnv } from './config/env.js';
import { createDriver } from './utils/browser-factory.js';
import { LoginPage } from './pages/auth/LoginPage.js';
import { StudentPage } from './pages/student/StudentPage.js';
import { prepareStudent } from './support/student/fixtures.js';
import { studentCases } from './tests/student/cases.js';
import { writeSuiteReport } from './utils/suite-reporter.js';
import { sanitize } from './utils/reporter.js';
import { summarizeNetwork } from './support/student/network.js';
import { prepareStudentRuntime, checkRuntimeDirectory, probeStudentBrowser } from './support/student/runtime.js';
import { studentFailure } from './support/student/failure-policy.js';
import { checkStagingAvailability } from './support/student/staging-health.js';

const directory = path.join(root, 'reports', `qa30-${new Date().toISOString().replace(/[:.]/g, '-')}`);
const report = { suite: { id: 'QA-30', role: 'Học viên', key: 'QA30.Student' }, testRevision: 'v8-independent-checks', referenceCommit: '321ce42', upstreamChecked: '3ced11c', startedAt: new Date().toISOString(), status: 'RUNNING', mode: 'STAGING UI — Selenium + API readback', cases: [], scope: `${studentCases.length} Student UI cases: enrolled classes, assignments, four-skill submissions, draft/validation, grades, official feedback, periodic evaluations and attempt history. API prepares isolated fixtures and verifies persisted results; UI actions use Selenium.` };
let config, data, driver, release, runtime;
let interrupted = false;
const safe = value => sanitize(value, config?.users || {});
process.on('SIGINT', () => { interrupted = true; driver?.quit().catch(() => {}); });
try {
  loadLocalEnv(); config = loadConfig();
  config.fakeMedia = true; // Synthetic browser audio; never request a human microphone grant.
  config.captureNetwork = true;
  config.dataTimeoutMs = Number(process.env.QA30_DATA_TIMEOUT_MS || 60000);
  if (!Number.isInteger(config.dataTimeoutMs) || config.dataTimeoutMs < 1000 || config.dataTimeoutMs > 300000) throw new Error('QA30_DATA_TIMEOUT_MS must be 1000–300000');
  const args = process.argv.slice(2);
  if (args.some(arg => !arg.startsWith('--case=') && !arg.startsWith('--delay-ms=') && !['--fresh-fixtures', '--prepare-only', '--watch', '--quick'].includes(arg))) throw new Error('Usage: node run-student.js [--case=QA30-001] [--fresh-fixtures] [--prepare-only] [--watch] [--quick] [--delay-ms=350]');
  const selectedId = args.find(arg => arg.startsWith('--case='))?.slice(7);
  const selected = selectedId ? studentCases.filter(test => test.id === selectedId) : studentCases;
  if (!selected.length) throw new Error('Unknown QA30 case ID');
  const pacing = args.find(arg => arg.startsWith('--delay-ms='));
  if (pacing && !args.includes('--watch')) throw new Error('--delay-ms requires --watch');
  if (args.includes('--quick') && !selectedId) throw new Error('--quick requires one --case');
  if (args.includes('--watch')) {
    config.headless = false; config.observeMs = pacing ? Number(pacing.slice(11)) : 1200;
    if (!Number.isInteger(config.observeMs) || config.observeMs < 250 || config.observeMs > 5000) throw new Error('Watch delay must be 250–5000 ms');
  }
  report.selectedCases = selected.map(test => test.id);
  try { report.issueLinks = JSON.parse(await fs.readFile(path.join(root,'support/student/issue-links.json'),'utf8')); }
  catch(error) { if(error.code!=='ENOENT')throw error; report.issueLinks={}; }
  Object.assign(report, { baseUrl: config.baseUrl, browser: config.browser, headless: config.headless, dataTimeoutMs: config.dataTimeoutMs });
  await fs.mkdir(directory, { recursive: true });
  const lock = path.join(root, '.cache/qa30-run.lock');
  await fs.mkdir(path.dirname(lock), { recursive: true });
  let handle;
  try { handle = await fs.open(lock, 'wx'); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const previous = JSON.parse(await fs.readFile(lock, 'utf8'));
    let active = true;
    try { process.kill(previous.pid, 0); } catch (error) { if (error.code === 'ESRCH') active = false; }
    if (active) throw new Error('QA30 is already running; do not reuse its fixtures concurrently');
    await fs.unlink(lock); handle = await fs.open(lock, 'wx');
  }
  await handle.writeFile(JSON.stringify({ pid: process.pid })); await handle.close();
  release = async () => { const current = JSON.parse(await fs.readFile(lock, 'utf8')); if (current.pid === process.pid) await fs.unlink(lock); };
  report.setupPhase = 'runtime-preflight';
  console.log('QA30 preflight: checking workspace temp space and write access...');
  runtime = await prepareStudentRuntime(root);
  report.runtime = { tempDirectory: path.relative(root, runtime.directory), ...runtime.storage };
  console.log(`QA30 temp/profile files: ${runtime.directory}`);
  report.setupPhase = 'staging-connectivity-preflight';
  console.log('QA30 preflight: checking frontend and API availability (no login)...');
  report.stagingHealth = await checkStagingAvailability(config);
  if (!args.includes('--prepare-only')) {
    report.setupPhase = 'browser-preflight';
    console.log('QA30 preflight: opening and closing a blank browser before creating staging data...');
    report.browserPreflight = await probeStudentBrowser(config);
  }
  report.sourceHashes = {};
  async function snapshot(relative) {
    const file = path.join(root, relative);
    if ((await fs.stat(file)).isDirectory()) { for (const name of await fs.readdir(file)) await snapshot(path.join(relative, name)); }
    else {
      const destination = path.join(directory, 'source-snapshot', relative);
      await fs.mkdir(path.dirname(destination), { recursive: true }); await fs.copyFile(file, destination);
      report.sourceHashes[relative.replaceAll('\\', '/')] = crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex');
    }
  }
  for (const item of ['config', 'utils', 'pages', 'support', 'tests/student', 'run-student.js']) await snapshot(item);
  report.setupPhase = 'prepare-isolated-student-fixtures';
  console.log('QA30: preparing isolated student, class, assignments, grading and periodic evaluation.');
  report.freshFixtures = args.includes('--fresh-fixtures') || !selectedId;
  const setupStarted = Date.now();
  data = await prepareStudent(config, {
    fresh: report.freshFixtures, quick: args.includes('--quick'), caseId: selectedId,
    progress: message => console.log(`[Setup ${((Date.now() - setupStarted) / 1000).toFixed(1)}s] ${message}`),
    check: () => { if (interrupted) throw new Error('QA30 stopped by user during setup.'); },
  });
  const { api, ...ledger } = data;
  await fs.writeFile(path.join(directory, 'fixture-ledger.json'), JSON.stringify(ledger, null, 2));
  report.setupPhase = 'ready';
  if (!args.includes('--prepare-only')) for (const test of selected) {
    if (interrupted) break;
    const result = { id: test.id, title: test.title, steps: test.steps, expected: test.expected, startedAt: new Date().toISOString(), evidence: [], issueRefs:report.issueLinks[test.id]||[] };
    const eventStart = api.events.length;
    config.observeCase = test.id;
    config.onEvidence = event => result.evidence.push(event);
    try {
      console.log(`${test.id}: starting browser and login...`);
      result.phase = 'driver';
      await checkRuntimeDirectory(runtime.directory);
      driver = await createDriver(config);
      result.browserVersion = (await driver.getCapabilities()).get('browserVersion');
      result.phase = 'login'; const login = new LoginPage(driver, config);
      await login.open(); await login.login(config.users.student, 'student'); await login.waitForRole('student');
      result.phase = 'scenario'; await test.run(new StudentPage(driver, config, data), data, result);
      result.status = 'PASSED'; result.classification = 'ASSERTIONS_PASSED';
    } catch (error) {
      Object.assign(result, studentFailure(error, result.phase, interrupted));
      result.reason = safe(error.message);
      if (error.dependsOn) result.dependsOn = error.dependsOn;
      if (error.status) result.httpError = { status: error.status, method: error.method, endpoint: error.endpoint };
    } finally {
      if (driver) {
        if (config.browser === 'chrome') {
          try { result.browserNetwork = summarizeNetwork(await driver.manage().logs().get('performance')); }
          catch (error) { result.networkEvidenceError = safe(error.message); }
        }
        try {
          result.actualUrl = await driver.getCurrentUrl();
          const main = await driver.findElement({ css: 'body' }).getText();
          if (/404_NOT_FOUND|This page doesn.t exist/.test(main)) result.classification = 'ENVIRONMENT_REVIEW';
          await fs.writeFile(path.join(directory, `${test.id}.txt`), safe(main));
          await driver.executeScript(`document.querySelectorAll('input[type="email"],input[type="password"]').forEach(el => { el.value = ''; }); document.getElementById('qa29-observer')?.remove();`);
          const dom = await driver.executeScript(`
            const main = document.querySelector('main');
            if (!main) return '';
            const clone = main.cloneNode(true);
            clone.querySelectorAll('script,input[type="email"],input[type="password"]').forEach(el => el.remove());
            return clone.outerHTML;
          `);
          result.dom = `${test.id}.html`;
          await fs.writeFile(path.join(directory, result.dom), safe(dom));
          result.screenshot = `${test.id}.png`;
          await fs.writeFile(path.join(directory, result.screenshot), await driver.takeScreenshot(), 'base64');
        } catch (error) { result.evidenceError = safe(error.message); delete result.screenshot; }
        try { await driver.quit(); } catch (error) {
          result.cleanupError = safe(error.message);
          result.stopSuite = true;
          if (result.status === 'PASSED') { result.status = 'BLOCKED'; result.classification = 'ENVIRONMENT_REVIEW'; }
        }
      }
      driver = undefined; result.finishedAt = new Date().toISOString();
      result.apiObservations = api.events.slice(eventStart);
      report.cases.push(result); await writeSuiteReport(directory, report, config.users);
      console.log(`${result.id}: ${result.status}${result.reason ? ' — ' + result.reason.split('\n')[0] : ''}`);
    }
    if (result.stopSuite) {
      report.executionStopped = true;
      report.reason = `Stopped at ${result.id}: ${result.cleanupError || result.reason}. Remaining cases were not run.`;
      console.error(report.reason);
      break;
    }
  }
  report.status = interrupted ? 'ABORTED' : report.executionStopped ? 'BLOCKED' : args.includes('--prepare-only') ? 'PREPARED' : report.cases.some(test => test.status === 'FAILED') ? 'FAILED' : report.cases.some(test => test.status === 'BLOCKED') ? 'BLOCKED' : 'PASSED';
} catch (error) {
  const verdict = studentFailure(error, report.setupPhase, interrupted);
  report.status = interrupted ? 'ABORTED' : verdict.classification === 'ENVIRONMENT_REVIEW' ? 'BLOCKED' : 'ERROR';
  report.classification = verdict.classification;
  if (error.healthChecks) report.stagingHealth = error.healthChecks;
  report.reason = safe(error.message); console.error(report.reason);
}
finally {
  if (runtime) {
    try { await runtime.cleanup(); }
    catch (error) { report.runtimeCleanupWarning = safe(error.message); }
  }
  report.finishedAt = new Date().toISOString();
  await writeSuiteReport(directory, report, config?.users);
  if (release) {
    await fs.writeFile(path.join(root, 'reports/latest-qa30.txt'), path.join(directory, 'report.html'));
    await release();
  }
  console.log(`REPORT: ${path.join(directory, 'report.html')}`);
  process.exitCode = interrupted ? 130 : ['PASSED', 'PREPARED'].includes(report.status) ? 0 : report.status === 'BLOCKED' ? 2 : 1;
}
