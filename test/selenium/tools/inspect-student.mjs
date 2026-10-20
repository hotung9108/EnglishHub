import fs from 'node:fs/promises';
import path from 'node:path';
import { root, loadConfig, loadLocalEnv } from '../config/env.js';
import { createDriver } from '../utils/browser-factory.js';
import { LoginPage } from '../pages/auth/LoginPage.js';
import { StagingApi } from '../support/teacher/expanded-api.js';
import { sanitize } from '../utils/reporter.js';

loadLocalEnv();
const config = loadConfig();
const api = new StagingApi(config);
const observations = {};
let driver;
try {
  for (const role of ['admin', 'teacher', 'student']) {
    const user = await api.login(role);
    observations[role] = { id: user.id, role: user.role };
  }
  observations.classes = await api.get('student', '/classes?limit=100');
  driver = await createDriver(config);
  const login = new LoginPage(driver, config);
  await login.open(); await login.login(config.users.student, 'student'); await login.waitForRole('student');
  observations.dashboardUrl = await driver.getCurrentUrl();
  observations.main = await driver.findElement({ css: 'main' }).getText();
  const dir = path.join(root, '.cache/qa30'); await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'inspection.json'), JSON.stringify(observations, null, 2));
  await fs.writeFile(path.join(dir, 'dashboard.png'), await driver.takeScreenshot(), 'base64');
  console.log(JSON.stringify({ login: 'OK', roles: Object.keys(api.sessions), browser: (await driver.getCapabilities()).get('browserVersion'), classCount: observations.classes.data?.length, saved: '.cache/qa30/inspection.json' }));
} catch (error) { console.error(sanitize(error.message, config.users)); process.exitCode = 1; }
finally { if (driver) await driver.quit(); }
