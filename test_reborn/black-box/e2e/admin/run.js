import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { root, loadConfig, loadLocalEnv } from '../config/env.js';
import { createDriver } from '../common/support/browser-factory.js';
import { LoginPage } from '../common/pages/LoginPage.js';
import { AdminPage } from './pages/AdminPage.js';
import { adminCases } from './cases/account-lifecycle.spec.js';
import { prepareFixtures, assertStaging } from './support/fixtures.js';
import { parseOptions, classify } from './support/options.js';
import { prepareAdminRuntime, probeStudentBrowser } from './support/runtime.js';
import { checkStagingAvailability } from './support/staging-health.js';
import { summarizeNetwork } from './support/network.js';
import { writeSuiteReport } from '../common/support/suite-reporter.js';
import { sanitize } from '../common/support/reporter.js';

loadLocalEnv();
const options = parseOptions(process.argv.slice(2), adminCases);

if (options.list || options.checkOnly) {
  for (const t of options.selected) console.log(`${t.id} | ${t.title}`);
  if (options.checkOnly) {
    console.log('[ADMIN] CHECK OK: registry/config verified. No network, browser, fixture or staging tests executed.');
    if (process.send) process.send({ type: 'check', status: 'OK', count: options.selected.length });
    process.exit(0);
  }
} else {
  await run();
}

async function run() {
  const config = { ...loadConfig(), captureNetwork: true, headless: !options.watch };
  assertStaging(config);
  config.observeMs = options.watch ? options.observeMs : 0;
  const startedAt = new Date().toISOString();
  const directory = path.join(root, 'reports', `admin-e2e-${startedAt.replace(/[:.]/g, '-')}`);
  const report = {
    suite: { id: 'ADM-E2E', role: 'Admin', key: 'Admin.E2E' },
    startedAt,
    status: 'RUNNING',
    mode: 'STAGING Selenium UI',
    baseUrl: config.baseUrl,
    browser: config.browser,
    headless: config.headless,
    observeMs: config.observeMs,
    selectedCases: options.selected.map(t => t.id),
    cases: [],
    scope: 'Admin account role creation/search, classes/roster/content read, Reports date/class/teacher filters, Audit status/history, system settings availability/persistence.'
  };
  const safe = v => sanitize(String(v), config.users);
  let runtime, driver, lock, data, stop = false;
  const lockPath = path.join(root, '.cache/admin-e2e.lock');
  process.once('SIGINT', () => { stop = true; driver?.quit().catch(() => {}); });

  try {
    await fs.mkdir(path.dirname(lockPath), { recursive: true });
    try {
      lock = await fs.open(lockPath, 'wx');
      await lock.writeFile(JSON.stringify({ pid: process.pid, startedAt }));
    } catch (e) {
      if (e.code === 'EEXIST') {
        const prev = JSON.parse(await fs.readFile(lockPath, 'utf8').catch(() => '{}'));
        let active = true;
        try { process.kill(prev.pid, 0); } catch { active = false; }
        if (active) throw new Error('Admin runner is already executing. Close the previous process or remove .cache/admin-e2e.lock.');
        await fs.unlink(lockPath).catch(() => {});
        lock = await fs.open(lockPath, 'wx');
        await lock.writeFile(JSON.stringify({ pid: process.pid, startedAt }));
      } else {
        throw e;
      }
    }

    report.directory = directory;
  await fs.mkdir(directory, { recursive: true });
    runtime = await prepareAdminRuntime(root);
    report.runtime = { storage: runtime.storage };
    report.phase = 'preflight';
    console.log('[ADMIN] Preflight: kiểm tra staging và Chrome...');
    report.health = await checkStagingAvailability(config);
    report.browserProbe = await probeStudentBrowser(config);

    report.phase = 'fixtures';
    console.log('[ADMIN] Chuẩn bị dữ liệu kiểm thử Admin...');
    data = await prepareFixtures(config, options.selected, directory);
    report.fixtureErrors = data.errors;

    for (const test of options.selected) {
      if (stop) break;
      const result = {
        id: test.id,
        title: test.title,
        steps: test.steps,
        expected: test.expected,
        issueRefs: test.issueRefs,
        startedAt: new Date().toISOString(),
        evidence: []
      };
      report.cases.push(result);
      config.observeCase = test.id;
      config.onStep = label => {
        console.log(`[ADMIN][${test.id}] ${label}`);
        result.evidence.push({ at: new Date().toISOString(), step: label });
      };
      console.log(`\n[ADMIN] ${test.id} ${test.title}`);
      const apiStart = data.api.events.length;

      try {
        const missing = (test.resources || []).filter(k => !data[k]);
        if (missing.length) throw Object.assign(new Error(`Fixture chưa sẵn sàng: ${missing.map(k => k + ': ' + (data.errors[k] || 'missing')).join('; ')}`), { code: 'ADM_FIXTURE' });
        result.phase = 'driver';
        driver = await createDriver(config);
        result.browserVersion = (await driver.getCapabilities()).get('browserVersion');
        result.phase = 'login';
        const login = new LoginPage(driver, config);
        await login.open();
        await login.login(config.users.admin, 'admin');
        await login.waitForRole('admin');
        const page = new AdminPage(driver, config);
        await page.ready();

        result.phase = 'scenario';
        await test.run(page, data, result);
        result.status = 'PASSED';
        result.classification = 'ASSERTIONS_PASSED';
      } catch (e) {
        result.status = stop ? 'ABORTED' : ['ADM_BLOCKED', 'ADM_FIXTURE', 'ADM_SCOPE', 'QA31_BLOCKED', 'QA31_FIXTURE', 'QA31_SCOPE'].includes(e.code) ? 'BLOCKED' : 'FAILED';
        result.classification = classify(e, result.phase);
        result.reason = safe(e.message);
        result.dependsOn = e.dependsOn;
        if (e.status) result.httpError = { status: e.status, endpoint: e.endpoint, method: e.method };
        if (result.phase === 'driver' || result.phase === 'login') stop = true;
      } finally {
        if (driver) {
          try {
            result.actualUrl = await driver.getCurrentUrl();
            await driver.executeScript("document.querySelectorAll('input[type=password]').forEach(e=>{e.value='';e.setAttribute('value','');});");
            result.screenshot = `${test.id}.png`;
            await fs.writeFile(path.join(directory, result.screenshot), await driver.takeScreenshot(), 'base64');
            const dom = await driver.executeScript("const c=document.documentElement.cloneNode(true);c.querySelectorAll('script').forEach(e=>e.remove());c.querySelectorAll('input[type=password]').forEach(e=>e.removeAttribute('value'));return c.outerHTML;");
            result.dom = `${test.id}.html`;
            await fs.writeFile(path.join(directory, result.dom), safe(dom));
          } catch (e) {
            result.evidenceError = safe(e.message);
          }
          try { result.browserNetwork = summarizeNetwork(await driver.manage().logs().get('performance')); } catch (e) { result.networkEvidenceError = safe(e.message); }
          try { await driver.quit(); } catch (e) { result.cleanupError = safe(e.message); }
          driver = undefined;
        }
        result.apiObservations = data.api.events.slice(apiStart).filter(e => e.endpoint !== '/auth/login');
        result.finishedAt = new Date().toISOString();
        console.log(`[ADMIN] ${result.status} ${result.reason || ''}`);
        await fs.writeFile(path.join(directory, 'fixture-ledger.json'), JSON.stringify({ resources: data.ledger, errors: data.errors }, null, 2));
        await writeSuiteReport(directory, report, config.users);
      }
    }
    report.status = stop ? 'INTERRUPTED' : 'COMPLETED';
  } catch (e) {
    report.status = 'BLOCKED';
    report.reason = safe(e.message);
    report.classification = classify(e, report.phase);
    report.health = e.healthChecks || report.health;
    console.log(`[ADMIN ERROR] ${report.reason}`);
  } finally {
    await driver?.quit().catch(() => {});
    await runtime?.cleanup().catch(e => { report.runtimeCleanupError = safe(e.message); });
    if (lock) { await lock.close(); await fs.unlink(lockPath).catch(() => {}); }
    report.finishedAt = new Date().toISOString();
    await writeSuiteReport(directory, report, config.users);
    console.log(`[ADMIN REPORT]: ${path.join(directory, 'report.html')}`);
    if (process.send) process.send({ type: 'result', report });
    process.exitCode = report.cases.some(c => c.status === 'FAILED') ? 1 : report.status !== 'COMPLETED' || report.cases.some(c => c.status !== 'PASSED') ? 2 : 0;
  }
}
