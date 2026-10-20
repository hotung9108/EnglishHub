// Read-only UI inventory. Does not prepare fixtures, start attempts, or submit work.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { By } from 'selenium-webdriver';
import { root, loadConfig, loadLocalEnv } from '../config/env.js';
import { createDriver } from '../utils/browser-factory.js';
import { LoginPage } from '../pages/auth/LoginPage.js';
import { StudentPage } from '../pages/student/StudentPage.js';
import { StagingApi } from '../support/teacher/expanded-api.js';
import { sanitize } from '../utils/reporter.js';
import { prepareStudentRuntime } from '../support/student/runtime.js';

loadLocalEnv();
const config = { ...loadConfig(), headless: true };
const publicOnly = process.argv.includes('--public-only');
if (!publicOnly) config.users.student = JSON.parse(await fs.readFile(path.join(root, '.cache/qa30-account.json'), 'utf8'));
const data = publicOnly ? {} : JSON.parse(await fs.readFile(path.join(root, 'fixtures/qa30.json'), 'utf8'));
const api = new StagingApi(config);
const originalRequest = api.request.bind(api);
api.request = (role, method, endpoint, ...args) => {
  if (method !== 'GET' && endpoint !== '/auth/login') throw new Error('UI inventory forbids mutations');
  return originalRequest(role, method, endpoint, ...args);
};
data.api = api;
const dir = path.join(root, '.cache', `qa30-ui-map-${new Date().toISOString().replace(/[:.]/g, '-')}`);
await fs.mkdir(dir, { recursive: true });
const pages = publicOnly ? [] : [
  ['dashboard', '/student/dashboard'], ['classes', '/student/classes'],
  ['class-detail', `/student/classes/${data.classId}`], ['assignments', '/student/assignments'],
  ['overview', `/student/assignments/${data.assignments.writing.id}/overview`],
  ['history', `/student/assignments/${data.assignments.graded.id}/overview`],
  ['grades', '/student/grades'], ['feedback', '/student/feedback'],
  ['result', `/student/submissions/${data.assignments.graded.submissionId}`],
  ['profile', '/student/profile'], ['settings', '/student/settings'],
];
const result = { capturedAt: new Date().toISOString(), pages: [], apiChecks: {} };
let driver, runtime;
try {
  runtime = await prepareStudentRuntime(root);
  driver = await createDriver(config);
  const login = new LoginPage(driver, config);
  await login.open(); await login.assertReady();
  result.publicLogin = { pathname: new URL(await driver.getCurrentUrl()).pathname, ready: true };
  await fs.writeFile(path.join(dir, 'login.png'), await driver.takeScreenshot(), 'base64');
  result.frontendBundles = [];
  const scripts = await driver.executeScript('return [...document.scripts].map(s => s.src).filter(Boolean)');
  for (const url of scripts) {
    if (new URL(url).origin !== config.baseUrl) continue;
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) continue;
    const bytes = Buffer.from(await response.arrayBuffer());
    const filename = path.basename(new URL(url).pathname);
    await fs.writeFile(path.join(dir, filename), bytes);
    result.frontendBundles.push({ filename, sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
  }
  if (!publicOnly) {
    await api.login('student');
    for (const [key, item] of Object.entries(data.assignments)) {
      const assignment = await api.get('student', `/assignments/${item.id}`);
      result.apiChecks[key] = { id: assignment.id, title: assignment.title, maxSubmissions: assignment.maxSubmissions, modules: assignment.modules };
    }
    await login.login(config.users.student, 'student'); await login.waitForRole('student');
  }
  const student = new StudentPage(driver, config, data);
  const focus = process.argv.find(arg => arg.startsWith('--focus='))?.slice(8).split(',');
  for (const [name, route] of pages.filter(([name]) => !focus || focus.includes(name))) {
    console.log(`Inventory: ${name}`);
    try {
      if (name === 'class-detail') await student.classDetail(data);
      else if (name === 'assignments') await student.assignmentList(data.assignments.navigation || data.assignments.writing);
      else if (name === 'overview') await student.overview(data.assignments.writing, { entry: 'class' });
      else if (name === 'history') await student.overview(data.assignments.graded, { entry: 'class' });
      else if (name === 'result') {
        await student.historyResult(data);
      } else await student.nav(route);
    } catch (error) {
      result.pages.push({ name: name + '-navigation', route, navigationError: sanitize(error.message, config.users) });
      console.log(`Inventory navigation stopped for ${name}`);
    }
    await driver.wait(async () => (await driver.findElements(By.css('main'))).length, config.timeout);
    // React pages replace their loading skeletons when the requests settle.
    let previous = '', same = 0;
    await driver.wait(async () => {
      const text = await driver.findElement(By.css('main')).getText();
      const skeletons = await driver.findElements(By.css('main .eh-skeleton, main .animate-pulse'));
      same = !skeletons.length && text === previous && text.length > 80 && !/Đang tải|Loading/.test(text) ? same + 1 : 0;
      previous = text; return same >= 3;
    }, 20000, `UI inventory readiness: ${name}`, 500).catch(() => {});
    const snapshot = await driver.executeScript(`
      const main = document.querySelector('main');
      const selector = el => {
        if (el.id) return '#' + CSS.escape(el.id);
        return el.tagName.toLowerCase() + [...el.classList].map(c => '.' + CSS.escape(c)).join('');
      };
      const clone = main.cloneNode(true);
      clone.querySelectorAll('script,input[type="password"]').forEach(el => el.remove());
      return { text: main.innerText, html: clone.outerHTML,
        controls: [...main.querySelectorAll('button,a,input,textarea,select,audio,[role="button"]')].map(el => ({
          selector: selector(el), tag: el.tagName, label: el.innerText || el.getAttribute('aria-label') || el.title || '',
          type: el.type, placeholder: el.getAttribute('placeholder'), href: el.getAttribute('href'),
          disabled: el.disabled, visible: !!(el.getClientRects().length),
          options: el.tagName === 'SELECT' ? [...el.options].map(o => ({value:o.value,label:o.text})) : undefined
        })) };
    `);
    await fs.writeFile(path.join(dir, `${name}.html`), snapshot.html);
    await fs.writeFile(path.join(dir, `${name}.txt`), snapshot.text);
    await fs.writeFile(path.join(dir, `${name}.png`), await driver.takeScreenshot(), 'base64');
    result.pages.push({ name, route, actualRoute: new URL(await driver.getCurrentUrl()).pathname, controls: snapshot.controls });
  }
} catch (error) { result.error = sanitize(error.message, config.users); process.exitCode = 1; }
finally {
  if (driver) await driver.quit();
  if (runtime) await runtime.cleanup();
  await fs.writeFile(path.join(dir, 'inventory.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ pages: result.pages.filter(p => p.controls).length, navigationErrors: result.pages.filter(p => p.navigationError).map(p => ({name:p.name,reason:p.navigationError})), error: result.error, saved: path.relative(root, path.join(dir,'inventory.json')) }));
}
