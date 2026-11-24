import assert from 'node:assert/strict';

import { randomUUID } from 'node:crypto';

import { By, Key, until } from 'selenium-webdriver';

import { Blocked } from "../../../runner/core.js";

const emailField = By.id('login-email');

const passwordField = By.id('login-password');

const submitButton = By.css('form.login-form button[type=submit]');

const errorAlert = By.css('.login-error-box[role="alert"]');

const invalidCredentials = /^(Tài khoản hoặc mật khẩu không chính xác\.|Invalid email or password credentials\.)$/u;

const token = driver => driver.executeScript("return Boolean(localStorage.getItem('eh_access_token'))");

function credentials(role) {
  const prefix = `SELENIUM_${role.toUpperCase()}`;
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];
  if (!email || !password) throw new Error(`Thiếu email hoặc mật khẩu fixture ${prefix}`);
  return { email, password };
}

async function open({ driver, baseUrl, step }) {
  await step('Mở /login trong phiên trình duyệt mới', async () => {
    await driver.get(new URL('/login', baseUrl).href);
    await driver.wait(until.elementLocated(emailField), 10000);
    assert.equal(await token(driver), false);
  });
}

async function submit(ctx, email, password, enter = false) {
  const { driver, step } = ctx;
  await step('Nhập dữ liệu vào hai trường đăng nhập', async () => {
    if (email) await driver.findElement(emailField).sendKeys(email);
    if (password) await driver.findElement(passwordField).sendKeys(password);
  });
  await step(enter ? 'Nhấn Enter' : 'Nhấn Đăng nhập', async () => {
    if (enter) await driver.findElement(passwordField).sendKeys(Key.ENTER);
    else await driver.findElement(submitButton).click();
  });
}

async function dashboard({ driver, baseUrl, step }, role) {
  await step(`Xác nhận dashboard và phiên ${role}`, async () => {
    await driver.wait(until.urlIs(new URL(`/${role}/dashboard`, baseUrl).href), 10000);
    assert.equal(await token(driver), true, 'Dashboard phải có phiên xác thực');
    const link = await driver.wait(until.elementLocated(By.css(`a[href="/${role}/dashboard"]`)), 10000);
    await driver.wait(until.elementIsVisible(link), 10000);
  });
}

function successful(role, { enter = false, reload = false } = {}) {
  return {
    data: `Tài khoản fixture ${role} đang hoạt động`,
    prepare: () => credentials(role),
    async run(ctx, { email, password }) {
      await open(ctx);
      await submit(ctx, email, password, enter);
      await dashboard(ctx, role);
      if (reload) {
        await ctx.step('Tải lại trang bằng trình duyệt', () => ctx.driver.navigate().refresh());
        await dashboard(ctx, role);
      }
    }
  };
}

async function rejection({ driver, step }, expected = invalidCredentials) {
  return step('Kiểm tra thông báo chung, URL và phiên', async () => {
    const alert = await driver.wait(until.elementLocated(errorAlert), 10000);
    await driver.wait(until.elementIsVisible(alert), 10000);
    const text = (await alert.getText()).trim();
    assert.match(text, expected);
    assert.equal(new URL(await driver.getCurrentUrl()).pathname, '/login');
    assert.equal(await token(driver), false);
    return text;
  });
}

function required(email, password, fields) {
  return {
    data: fields.map(([id, flag]) => `${id} → ${flag}`).join(', '),
    async run(ctx) {
      await open(ctx);
      await ctx.step('Theo dõi sự kiện submit của form', () => ctx.driver.executeScript(
        "window.seleniumSubmitCount = 0; document.querySelector('form.login-form').addEventListener('submit', () => window.seleniumSubmitCount++);"
      ));
      await submit(ctx, email, password);
      await ctx.step('Kiểm tra ràng buộc và thông báo trên từng trường', async () => {
        assert.equal(await ctx.driver.executeScript('return window.seleniumSubmitCount'), 0,
          'Form có dữ liệu không hợp lệ không được submit');
        for (const [id, flag] of fields) {
          const validity = await ctx.driver.executeScript(
            'const field = document.getElementById(arguments[0]); return { invalid: field.validity[arguments[1]], message: field.validationMessage };',
            id, flag
          );
          assert.equal(validity.invalid, true, `${id} phải báo ${flag}`);
          assert.ok(validity.message, `${id} phải có thông báo`);
        }
        assert.equal(await token(ctx.driver), false);
      });
    }
  };
}

async function loginScreen({ driver, baseUrl }) {
  await driver.wait(until.urlIs(new URL('/login', baseUrl).href), 10000);
  const field = await driver.wait(until.elementLocated(emailField), 10000);
  await driver.wait(until.elementIsVisible(field), 10000);
}

async function logout(ctx) {
  await ctx.step('Mở menu cá nhân và chọn Đăng xuất', async () => {
    await ctx.driver.findElement(By.css('button.sidebar-user-card')).click();
    await ctx.driver.findElement(By.css('.sidebar-popover-footer button.danger')).click();
    await loginScreen(ctx);
  });
}

function afterLogin(run) {
  const setup = successful('admin');
  return {
    data: setup.data,
    prepare: setup.prepare,
    async run(ctx, fixture) {
      await setup.run(ctx, fixture);
      await run(ctx, fixture);
    }
  };
}

export { emailField, passwordField, submitButton, errorAlert, invalidCredentials, token, credentials, open, submit, dashboard, successful, rejection, required, loginScreen, logout, afterLogin };
