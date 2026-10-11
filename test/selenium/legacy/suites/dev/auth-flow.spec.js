import { getFrontendUrl, getUsers } from '../utils/env-helper.js';
import { createDriver } from '../utils/browser-factory.js';
import { LoginPage } from '../pages/auth/LoginPage.js';

(async () => {
  let driver;
  try {
    driver = await createDriver();
    const baseUrl = getFrontendUrl();
    const users = getUsers();
    console.log('[DEV][Selenium] Starting auth-flow...');
    const login = new LoginPage(driver);
    await login.navigate(baseUrl).login(users.teacher.email, users.teacher.password);
    await driver.sleep(2000);
    console.log('[DEV][Selenium] auth-flow completed');
  } catch (e) {
    console.error('[DEV][Selenium] Error:', e.message);
  } finally {
    if (driver) await driver.quit();
  }
})();
