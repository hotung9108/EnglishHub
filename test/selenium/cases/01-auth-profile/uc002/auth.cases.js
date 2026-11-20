import assert from 'node:assert/strict';

import { randomUUID } from 'node:crypto';

import { By, Key, until } from 'selenium-webdriver';

import { Blocked } from "../../../common/runner/core.js";

import { emailField, passwordField, submitButton, errorAlert, invalidCredentials, token, credentials, open, submit, dashboard, successful, rejection, required, loginScreen, logout, afterLogin } from "../../../common/flows/support/common/auth.js";

export const cases = {
LOGOUT_001: afterLogin(async ctx => {
    await logout(ctx);
    await ctx.step('Về màn đăng nhập và kết thúc quyền truy cập; thông báo không bắt buộc theo đặc tả đã chốt', async () => {
      await loginScreen(ctx);assert.equal(await token(ctx.driver),false);
      await ctx.driver.get(new URL('/admin/dashboard',ctx.baseUrl).href);
      await loginScreen(ctx);assert.equal(await token(ctx.driver),false);
    });
  }),
LOGOUT_002: afterLogin(async ctx => {
    await logout(ctx);
    await ctx.step('Kiểm tra dữ liệu xác thực đã bị xóa', async () => {
      const keys = ['eh_access_token', 'eh_refresh_token', 'eh_user'];
      const remaining = await ctx.driver.executeScript(
        'return arguments[0].filter(key => localStorage.getItem(key) !== null || sessionStorage.getItem(key) !== null);',
        keys
      );
      assert.deepEqual(remaining, []);
      const cookies = await ctx.driver.manage().getCookies();
      assert.deepEqual(cookies.filter(cookie => keys.includes(cookie.name)).map(cookie => cookie.name), []);
    });
  }),
LOGOUT_003: afterLogin(async ctx => {
    await ctx.step('Tạo mục dashboard đã xác thực trong lịch sử trình duyệt', async () => {
      await ctx.driver.findElement(By.css('a[href="/admin/classes"]')).click();
      await ctx.driver.wait(until.urlIs(new URL('/admin/classes', ctx.baseUrl).href), 10000);
    });
    await logout(ctx);
    await ctx.step('Nhấn Back và kiểm tra màn hình đăng nhập', async () => {
      await ctx.driver.navigate().back();
      await loginScreen(ctx);
      assert.equal(await token(ctx.driver), false);
    });
  }),
LOGOUT_004: afterLogin(async ctx => {
    await ctx.step('Xóa token cục bộ rồi truy cập trang cần xác thực', async () => {
      await ctx.driver.executeScript("localStorage.removeItem('eh_access_token'); localStorage.removeItem('eh_refresh_token');");
      await ctx.driver.get(new URL('/admin/dashboard', ctx.baseUrl).href);
      await loginScreen(ctx);
    });
  }),
LOGOUT_005: afterLogin(async ctx => {
    const original = await ctx.driver.getWindowHandle();
    const second = await ctx.step('Mở tab thứ hai với phiên hiện tại', async () => {
      await ctx.driver.switchTo().newWindow('tab');
      await ctx.driver.get(new URL('/admin/dashboard', ctx.baseUrl).href);
      return ctx.driver.getWindowHandle();
    });
    await dashboard(ctx, 'admin');
    await ctx.driver.switchTo().window(original);
    await logout(ctx);
    await ctx.step('Thao tác trên tab thứ hai sau khi đăng xuất', async () => {
      await ctx.driver.switchTo().window(second);
      await ctx.driver.navigate().refresh();
      await loginScreen(ctx);
      assert.equal(await token(ctx.driver), false);
    });
  })
};