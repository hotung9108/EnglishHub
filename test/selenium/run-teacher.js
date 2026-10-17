import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { root, loadConfig, loadLocalEnv } from './config/env.js';
import { createDriver } from './utils/browser-factory.js';
import { LoginPage } from './pages/auth/LoginPage.js';
import { TeacherPage } from './pages/teacher/TeacherPage.js';
import { TeacherExtendedPage } from './pages/teacher/TeacherExtendedPage.js';
import { prepareExpanded, prepareBase } from './support/teacher/expanded-api.js';
import { classifyFailure } from './support/teacher/classification.js';
import { sanitize } from './utils/reporter.js';
import { teacherData, missingInputs, teacherOptions } from './support/teacher/config.js';
import { teacherCases } from './tests/teacher/cases.js';
import { writeTeacherReport } from './support/teacher/report.js';
import { cleanupFixtures } from './support/teacher/cleanup.js';
import { acquireRunLock } from './support/teacher/run-lock.js';

const startedAt = new Date().toISOString();
const directory = path.join(root, 'reports', `qa29-${startedAt.replace(/[:.]/g, '-')}`);
const report = {
  startedAt, mode: 'STAGING UI — Selenium', status: 'RUNNING', cases: [],
  scope: 'Expanded Teacher UI suite: four-skill creation/preview/grading, editing/schedule, reports/API comparison, AI, permissions, isolated profile/password/settings, logout. Unavailable features and prerequisites are explicitly Blocked; no universal coverage claim.',
};
let exitCode = 0;
let config;
let interrupted = false;
let activeDriver;
let activeSetup;
let release;
process.on('SIGINT', () => { interrupted = true; activeDriver?.quit().catch(() => {}); activeSetup?.kill(); });
const safe = value => sanitize(value, config?.users || {});
try {
  loadLocalEnv();
  config = loadConfig();
  const options = teacherOptions(process.argv.slice(2));
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
  const selected = id ? teacherCases.filter(item => item.id === id) : teacherCases;
  if (!selected.length) throw new Error(`Unknown test case: ${id}`);
  report.selectedCases = selected.map(test => test.id);
  release = await acquireRunLock();
  await fs.mkdir(directory, { recursive: true });
  // Preserve the exact runner source for the later offline review.
  const sourcePaths = ['config', 'pages', 'utils', 'support', 'tests/teacher', 'run-teacher.js'];
  for (const relative of sourcePaths) {
    const destination = path.join(directory, 'source-snapshot', relative);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.cp(path.join(root, relative), destination, { recursive: true });
  }
  const fingerprints = {};
  async function fingerprint(folder) {
    for (const item of await fs.readdir(folder, { withFileTypes: true })) {
      const file = path.join(folder, item.name);
      if (item.isDirectory()) await fingerprint(file);
      else fingerprints[path.relative(root, file).replaceAll('\\', '/')] = crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex');
    }
  }
  for (const relative of sourcePaths) {
    const file = path.join(root, relative);
    if ((await fs.stat(file)).isDirectory()) await fingerprint(file);
    else fingerprints[relative] = crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex');
  }
  report.sourceHashes = fingerprints;
  report.setupPhase = 'cleanup-previous-data';
  console.log('Dọn dữ liệu QA29 cũ trước retest; báo cáo và ảnh cũ được giữ nguyên...');
  const cleanup = await cleanupFixtures(config, { apply: true, directory: path.join(directory, 'pre-run-cleanup') });
  report.cleanup = { status: cleanup.status, assignments: cleanup.actions.filter(item => item.type === 'assignment').length, profiles: cleanup.actions.filter(item => item.type === 'user').length, retained: cleanup.retained, details: 'pre-run-cleanup/cleanup.json' };
  if (interrupted) throw new Error('Người chạy dừng sau bước cleanup; chưa tạo fixture mới.');
  report.setupPhase = 'prepare-base-fixture';
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, 'support/teacher/prepare-fixtures.js')], {
      env: { ...process.env, QA29_PARENT_LOCK_PID: String(process.pid) }, stdio: 'inherit', windowsHide: true,
    });
    activeSetup = child;
    child.on('error', reject);
    child.on('close', code => { activeSetup = undefined; code === 0 ? resolve() : reject(new Error(`Chuẩn bị fixture nền thất bại (exit ${code}); chưa chạy Selenium.`)); });
  });
  const baseFixture = JSON.parse(await fs.readFile(path.join(root, 'fixtures/staging.json'), 'utf8'));
  data.className = baseFixture.className; data.studentName = baseFixture.studentName; data.assignmentTitle = baseFixture.assignmentTitle;
  report.baseFixture = { classId: baseFixture.classId, assignmentId: baseFixture.assignmentId, studentId: baseFixture.studentId };
  if (selected.some(test => test.expanded)) {
    try { console.log('Chuẩn bị fixture mở rộng cho bốn kỹ năng và tài khoản profile QA riêng...'); await prepareExpanded(config, data); }
    catch (error) { data.expandedSetupError = safe(error.message); console.log(`Expanded setup: ${data.expandedSetupError}`); }
    report.createdFixtures = data.createdFixtures || [];
    report.setupErrors = data.setupErrors || {};
    await fs.writeFile(path.join(directory, 'fixture-ledger.json'), JSON.stringify(report.createdFixtures, null, 2));
  } else if (selected.some(test => test.needsApi)) {
    try { await prepareBase(config, data); }
    catch (error) { data.expandedSetupError = safe(error.message); }
  }
  report.setupPhase = 'ready';
  for (const test of selected) {
    if (interrupted) break;
    const result = { id: test.id, title: test.title, steps: test.steps, expected: test.expected, startedAt: new Date().toISOString() };
    const missing = missingInputs(test.required, config, data);
    if ((test.expanded || test.needsApi) && data.expandedSetupError) missing.push(`API setup: ${data.expandedSetupError}`);
    if (test.fixtureKey && data.setupErrors?.[test.fixtureKey]) missing.push(`Fixture ${test.fixtureKey}: ${safe(data.setupErrors[test.fixtureKey])}`);
    config.observeCase = test.id;
    config.onStep = label => console.log(`[${test.id}] ${label}`);
    result.evidence = [];
    config.onEvidence = item => result.evidence.push(item);
    const apiStart = data.api?.events.length || 0;
    console.log(`\n${test.id} — ${test.title}\nQuy trình: ${test.steps}\nKỳ vọng: ${test.expected}`);
    let driver;
    try {
      if (missing.length) {
        result.status = 'BLOCKED';
        result.classification = 'BLOCKED';
        result.reason = `Missing configuration: ${missing.join(', ')}`;
        if (!exitCode) exitCode = 2;
      } else {
        config.downloadDir = path.join(directory, 'downloads', test.id);
        await fs.mkdir(config.downloadDir, { recursive: true });
        result.phase = 'driver';
        driver = await createDriver(config);
        activeDriver = driver;
        result.browserVersion = (await driver.getCapabilities()).get('browserVersion');
        const login = new LoginPage(driver, config);
        result.phase = 'login';
        await login.open();
        await login.login(config.users[test.loginAs || 'teacher'], 'teacher');
        await login.waitForRole('teacher');
        await login.step('Đã vào dashboard — xác nhận đúng vai trò Giáo viên');
        result.phase = 'scenario';
        await test.run(new TeacherExtendedPage(driver, config), data, result);
        result.status = 'PASSED';
        result.classification = 'ASSERTIONS_PASSED';
      }
    } catch (error) {
      result.status = error.code === 'QA29_BLOCKED' ? 'BLOCKED' : 'FAILED';
      result.reason = safe(error.message);
      result.classification = classifyFailure(error, result.phase);
      if (error.status) result.httpError = { status: error.status, method: error.method, endpoint: error.endpoint };
      if (error.cleanupError) result.cleanupError = safe(error.cleanupError);
      if (result.status === 'FAILED') exitCode = 1;
      else if (!exitCode) exitCode = 2;
    } finally {
      if (driver) {
        try {
          result.actualUrl = safe(await driver.getCurrentUrl());
          const pageText = await driver.findElement({ css: 'body' }).getText();
          if (/404_NOT_FOUND|This page doesn.t exist/.test(pageText)) {
            result.classification = 'ENVIRONMENT_REVIEW';
            result.evidence.push({ type: 'hosting', message: 'Hosting returned a generic 404 page; feature assertions did not complete.' });
          }
        } catch {}
        if (config.observeMs) {
          try { await new TeacherPage(driver, config).step(`Kết quả: ${result.status}. Giữ trang để quan sát.`); } catch {}
        }
        try {
          // Capture before editing test content; only credential inputs are redacted.
          await driver.executeScript(`document.querySelectorAll('input[type="email"], input[type="password"]').forEach(input => { input.value = ''; });`);
          await driver.executeScript(`
            document.getElementById('qa29-observer')?.remove();
            const highlighted = document.querySelector('[data-qa29-highlight]');
            if (highlighted) { highlighted.style.outline = highlighted.dataset.qa29OldOutline || ''; highlighted.removeAttribute('data-qa29-highlight'); }
          `);
          result.screenshot = `${test.id}.png`;
          await fs.writeFile(path.join(directory, result.screenshot), await driver.takeScreenshot(), 'base64');
        } catch (error) { delete result.screenshot; result.evidenceError = safe(error.message); }
        try { await driver.quit(); } catch (error) {
          result.cleanupError = safe(error.message);
          result.status = 'FAILED';
          result.classification = 'HARNESS_REVIEW';
          result.reason ||= 'WebDriver cleanup failed';
          exitCode = 1;
        }
      }
      activeDriver = undefined;
      result.apiObservations = (data.api?.events || []).slice(apiStart);
      if (interrupted) { result.status = 'ABORTED'; result.classification = 'NOT_COMPLETED'; result.reason = 'Người chạy dừng giữa chừng; case chưa hoàn tất.'; }
      result.finishedAt = new Date().toISOString();
      report.cases.push(result);
      console.log(`${test.id}: ${result.status}${result.reason ? ` — ${result.reason}` : ''}`);
      // Save after every case to retain partial results if the run is interrupted.
      await writeTeacherReport(directory, report, config.users);
    }
  }
  report.status = interrupted ? 'ABORTED' : exitCode === 1 ? 'FAILED' : exitCode === 2 ? 'BLOCKED' : 'PASSED';
} catch (error) {
  exitCode = 1;
  report.status = interrupted ? 'ABORTED' : 'ERROR';
  report.reason = safe(error.message);
  console.error(report.reason);
} finally {
  report.finishedAt = new Date().toISOString();
  if (interrupted) exitCode = 130;
  try {
    await writeTeacherReport(directory, report, config?.users);
    // A second blocked launch must not replace the report of the active run.
    if (release) await fs.writeFile(path.join(root, 'reports/latest-qa29.txt'), path.join(directory, 'report.html'));
    console.log(`Report: ${path.join(directory, 'report.html')}`);
    process.exitCode = exitCode;
  } finally { if (release) await release(); }
}
