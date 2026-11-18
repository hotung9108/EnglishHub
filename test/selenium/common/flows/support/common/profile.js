import assert from 'node:assert/strict';

import { By } from 'selenium-webdriver';

import { Blocked } from "../../../runner/core.js";

import { scenario } from "../../../ui/ui.js";

const name = '.profile-form-card input[type=text]:not([readonly]):not([placeholder])';

const phone = '.profile-form-card input[placeholder="0987 654 321"]';

const save = '.profile-form-card button[type=submit]';

async function fresh(ctx) {
  const user = await ctx.pool.createUser('ADMIN', 'Profile');
  ctx.pool.users.profile = user; await ctx.pool.login('profile');
  return { publicData: { email: user.email, fullName: user.fullName }, user };
}

const personal = run => scenario('profile', async (ctx, ui, data) => {
  await ctx.step('Mở Hồ sơ qua menu cá nhân', async () => {
    await (await ui.visible('button.sidebar-user-card')).click();
    await (await ui.visible('.sidebar-popover-body a[href$="tab=general"]')).click();
    await ui.visible(name);
  });
  await run(ctx, ui, data);
}, fresh);

async function passwordForm(ctx, ui, current, next, confirm = next) {
  await ui.button(/^(Bảo mật & Mật khẩu|Security & Password|Bảo mật|Security|Đổi mật khẩu|Change Password)$/i);
  const inputs = await ctx.driver.findElements(By.css('.profile-password-form input'));
  assert.equal(inputs.length, 3);
  for (const [i, value] of [current, next, confirm].entries()) await inputs[i].sendKeys(value);
  await (await ui.visible('.profile-password-form button[type=submit]')).click();
}

async function assertPassword(ctx, data, password) {
  const response = await ctx.pool.request(null, 'POST', '/auth/login', { email: data.user.email, password }, { allowError: true });
  assert.equal(response.status, 200, 'Expected password must authenticate after UI change');
  assert.equal(response.data.user.id, data.user.id);
}

export { name, phone, save, fresh, personal, passwordForm, assertPassword };
