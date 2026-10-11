import assert from 'node:assert/strict';
import { By, until } from 'selenium-webdriver';
import { BasePage } from '../BasePage.js';

// Locators are centralized here; tests describe behavior, not DOM structure.
const email = By.css('form input[type="email"]');
const password = By.css('form input[type="password"]');
const submit = By.css('form button[type="submit"]');
const roleLabels = {
  admin: ['Admin'],
  teacher: ['Giáo viên', 'Teacher'],
  student: ['Học viên', 'Student'],
};

export class LoginPage extends BasePage {
  async open() {
    // Enter through the deployed root; the SPA may navigate to login itself.
    await this.driver.get(`${this.config.baseUrl}/`);
    await this.visible(email);
    return this;
  }

  async assertReady() {
    const current = new URL(await this.driver.getCurrentUrl());
    assert.equal(current.origin, this.config.baseUrl, 'Login must remain on the configured frontend');
    const mail = await this.visible(email);
    const pass = await this.visible(password);
    const button = await this.visible(submit);
    assert.equal(await mail.isEnabled(), true, 'Email must be editable');
    assert.equal(await pass.isEnabled(), true, 'Password must be editable');
    assert.equal(await pass.getAttribute('type'), 'password', 'Password must be masked');
    assert.equal(await button.isEnabled(), true, 'Submit must be enabled');
    assert.ok((await button.getText()).trim(), 'Login button must have a visible label');
  }

  async selectRole(role) {
    assert.ok(Object.hasOwn(roleLabels, role), 'Login role must be admin, teacher or student');
    const labels = roleLabels[role].map(label => `normalize-space(.)="${label}"`).join(' or ');
    const locator = By.xpath(`//div[contains(concat(' ', normalize-space(@class), ' '), ' login-role-tabs ')]//button[${labels}]`);
    const tab = await this.visible(locator);
    await this.driver.wait(until.elementIsEnabled(tab), this.config.timeout);
    await tab.click();
    await this.driver.wait(async () => {
      const selected = await this.driver.findElement(locator);
      const classes = (await selected.getAttribute('class') || '').split(/\s+/);
      return classes.includes('active') || await selected.getAttribute('aria-selected') === 'true';
    }, this.config.timeout, `Expected ${role} login tab to be selected`);
  }

  async login(user, role) {
    // Selecting a role resets the form, so always select it before entering credentials.
    await this.selectRole(role);
    const mail = await this.visible(email);
    const pass = await this.visible(password);
    await mail.clear(); await mail.sendKeys(user.email);
    await pass.clear(); await pass.sendKeys(user.password);
    await (await this.visible(submit)).click();
  }

  async waitForRole(role) {
    await this.driver.wait(async () => {
      const url = new URL(await this.driver.getCurrentUrl());
      return url.origin === this.config.baseUrl && url.pathname === `/${role}/dashboard`;
    }, this.config.timeout, `Expected ${role} dashboard after login`);
    await this.driver.wait(until.elementLocated(By.css('main')), this.config.timeout);
    // Matches frontend/src/config/{staging,production,development}.ts: auth.userKey.
    // Profile enrichment can finish after navigation; wait for the stored role.
    const result = await this.driver.wait(async () => {
      return await this.driver.executeScript(`
        const raw = localStorage.getItem('eh_user');
        if (!raw) return null;
        try {
          const user = JSON.parse(raw);
          return typeof user?.role === 'string' && user.role.trim()
            ? {role: user.role.trim()} : null;
        } catch { return null; }
      `);
    }, this.config.timeout, 'Expected authenticated user role in localStorage eh_user');
    assert.equal(String(result.role).toLowerCase(), role, 'Authenticated role must match the requested role');
  }

  async redactInputs() {
    await this.driver.executeScript(`document.querySelectorAll('input').forEach(input => { input.value = ''; });`);
  }
}
