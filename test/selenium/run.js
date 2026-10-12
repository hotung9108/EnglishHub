import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { root, loadConfig, loadLocalEnv } from './config/env.js';
import { createDriver } from './utils/browser-factory.js';
import { LoginPage } from './pages/auth/LoginPage.js';
import { sanitize, writeReport } from './utils/reporter.js';
import { loginFormCase, loginCase } from './tests/auth/login.test.js';

loadLocalEnv();
const selfTest = process.argv.includes('--self-test');
const roles = process.argv.includes('--roles');
const roleArgument = process.argv.find(arg => arg.startsWith('--role='));
const selectedRole = roleArgument?.slice('--role='.length);
let fixture;
let config;
let exitCode = 0;
const startedAt = new Date().toISOString();
const directory = path.join(root, 'reports', `run-${startedAt.replace(/[:.]/g, '-')}`);
const report = {
  startedAt, mode: selfTest ? 'LOCAL FIXTURE — framework verification only' : 'LIVE FRONTEND',
  scope: roles || roleArgument ? 'Login form and authenticated dashboard for requested roles; no full usability/maintainability acceptance verdict.' : 'Login form smoke only; no authenticated flow or usability/maintainability acceptance verdict.',
  status: 'RUNNING', cases: [],
};

async function execute({ id, title, run: action }) {
  const result = { id, title, status: 'RUNNING' };
  let driver;
  try {
    driver = await createDriver(config);
    const capabilities = await driver.getCapabilities();
    report.browserVersion = capabilities.get('browserVersion');
    const page = new LoginPage(driver, config);
    await page.open();
    await action(page);
    result.status = 'PASSED';
  } catch (error) {
    result.status = 'FAILED';
    result.reason = sanitize(error.message, config.users);
    exitCode = 1;
  } finally {
    if (driver) {
      try {
        // Clear credential fields before capturing; do not dump DOM, storage or network tokens.
        await new LoginPage(driver, config).redactInputs();
        const screenshot = `${id}.png`;
        await fs.writeFile(path.join(directory, screenshot), await driver.takeScreenshot(), 'base64');
        result.screenshot = screenshot;
      } catch (error) { result.evidenceError = sanitize(error.message, config.users); }
      try { await driver.quit(); } catch { result.cleanupError = 'WebDriver quit failed'; exitCode = 1; }
    }
    report.cases.push(result);
    console.log(`${id}: ${result.status}${result.reason ? ` — ${result.reason}` : ''}`);
  }
}

try {
  await fs.mkdir(directory, { recursive: true });
  if (roleArgument && !['admin', 'teacher', 'student'].includes(selectedRole)) throw new Error('--role must be admin, teacher or student');
  if (roles && roleArgument) throw new Error('Use either --roles or --role, not both');
  if (selfTest && (roles || roleArgument)) throw new Error('--self-test cannot be combined with role login');
  if (selfTest) {
    fixture = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<!doctype html><title>QA-28 local fixture</title><main><h1>Framework fixture</h1><form><label>Email <input type="email" required></label><label>Password <input type="password" required></label><button type="submit">Login</button></form></main>');
    });
    await new Promise(resolve => fixture.listen(0, '127.0.0.1', resolve));
  }
  config = loadConfig(selfTest ? { ...process.env, SELENIUM_BASE_URL: `http://127.0.0.1:${fixture.address().port}` } : process.env);
  report.baseUrl = config.baseUrl;
  report.browser = config.browser;
  report.headless = config.headless;
  await execute(loginFormCase);
  if (roles || roleArgument) {
    for (const role of roles ? ['admin', 'teacher', 'student'] : [selectedRole]) {
      const user = config.users[role];
      if (!user.email || !user.password) {
        report.cases.push({ id: `QA28-LOGIN-${role.toUpperCase()}`, title: `Login as ${role}`, status: 'BLOCKED', reason: `Set SELENIUM_${role.toUpperCase()}_EMAIL and SELENIUM_${role.toUpperCase()}_PASSWORD` });
        if (!exitCode) exitCode = 2;
        continue;
      }
      await execute(loginCase(user, role));
    }
  }
  report.status = exitCode === 1 ? 'FAILED' : exitCode === 2 ? 'BLOCKED' : 'PASSED';
} catch (error) {
  report.status = 'ERROR';
  report.cases.push({ id: 'SETUP', title: 'Framework setup', status: 'ERROR', reason: sanitize(error.message, config?.users || {}) });
  exitCode = 1;
} finally {
  if (fixture) await new Promise(resolve => fixture.close(resolve));
  report.endedAt = new Date().toISOString();
  await writeReport(directory, report);
  console.log(`Report: ${path.join(directory, 'report.html')}`);
  process.exitCode = exitCode;
}
