import assert from 'node:assert/strict';

import { By } from 'selenium-webdriver';

import { Blocked } from "../../../common/runner/core.js";

import { scenario } from "../../../common/ui/ui.js";

import { name, phone, save, fresh, personal, passwordForm, assertPassword } from "../../../common/flows/support/common/profile.js";

export const cases = {
PROF_001: personal(async (ctx, ui, data) => {
    await ctx.step('Đối chiếu chính xác tên, email, điện thoại với API', async () => {
      const expected = await ctx.pool.get('profile', '/users/me');
      await ctx.evidence('profile', expected);
      for (const [field, value] of [[name, expected.fullName], ['.profile-form-card input[type=email]', expected.email], [phone, expected.phone ?? '']]) {
        await ctx.driver.wait(async () => await (await ui.visible(field)).getAttribute('value') === value, 10000);
      }
      assert.equal(expected.id, data.user.id);
    });
  }),
PROF_002: personal(async (ctx, ui) => {
    const next = 'Selenium Updated Profile';
    await ctx.step('Sửa họ tên và lưu', async () => { await ui.fill(name, next); await (await ui.visible(save)).click(); await ui.has(/thành công|success/i); });
    await ctx.step('F5 và đọc lại API; họ tên phải giữ đúng', async () => {
      await ctx.driver.navigate().refresh();
      await ctx.driver.wait(async () => await (await ui.visible(name)).getAttribute('value') === next, 10000);
      const saved = await ctx.pool.get('profile', '/users/me'); await ctx.evidence('saved-profile', saved); assert.equal(saved.fullName, next);
    });
  }),
PROF_003: personal(async (ctx, ui, data) => {
    await ctx.step('Xóa tên rồi lưu; phải báo bắt buộc và giữ dữ liệu cũ', async () => {
      await ui.fill(name, ''); await (await ui.visible(save)).click();
      const input = await ui.visible(name);
      const native = await ctx.driver.executeScript('return {missing:arguments[0].validity.valueMissing,message:arguments[0].validationMessage}', input);
      if (native.missing) assert.ok(native.message); else await ui.error(/họ.*tên|full name|required|bắt buộc/i);
      assert.equal((await ctx.pool.get('profile', '/users/me')).fullName, data.user.fullName);
    });
  }),
PROF_004: personal(async ctx => { await ctx.step('Kiểm tra căn cứ giới hạn tên', () => { throw new Blocked('Excel giả định 100 ký tự; UC003 không quy định max 100. Cần chốt giới hạn trước khi khẳng định 99/100 pass, 101 fail.'); }); }),
PROF_005: personal(async (ctx, ui) => {
    const before = await ctx.pool.get('profile', '/users/me');
    await ctx.step('Nhập số điện thoại chứa chữ và lưu', async () => {
      await ui.fill(phone, 'abcxyz'); await (await ui.visible(save)).click(); await ui.error(/điện thoại|phone|định dạng|invalid/i);
      assert.equal((await ctx.pool.get('profile', '/users/me')).phone ?? '', before.phone ?? '');
    });
  }),
PROF_006: personal(async (ctx, ui) => {
    const payload = '<img src=x onerror="window.__srsXss=true">';
    await ctx.step('Nhập XSS vào tên, lưu và reload; script không được chạy', async () => {
      await ui.fill(name, payload); await (await ui.visible(save)).click();
      await ctx.driver.navigate().refresh(); await ui.visible(name);
      assert.equal(await ctx.driver.executeScript('return window.__srsXss === true'), false);
      const saved = await ctx.pool.get('profile', '/users/me'); await ctx.evidence('xss-readback', saved);
      assert.equal(await ctx.driver.executeScript('return !!document.querySelector("main img[onerror],main script")'), false);
    });
  }),
PROF_007: personal(async (ctx, ui, data) => {
    const next = 'SrsNewPassword123!'; ctx.secrets.push(next);
    await ctx.step('Đổi mật khẩu với mật khẩu cũ đúng', async () => { await passwordForm(ctx, ui, data.user.password, next); await ui.has(/thành công|success/i); });
    await ctx.step('Đăng nhập API bằng mật khẩu mới; cũ phải bị từ chối', async () => {
      await assertPassword(ctx, data, next);
      const old = await ctx.pool.request(null, 'POST', '/auth/login', { email: data.user.email, password: data.user.password }, { allowError: true }); assert.ok([400, 401, 403].includes(old.status));
      await ctx.pool.request('profile', 'PATCH', '/users/me/password', { currentPassword: next, newPassword: data.user.password });
      await assertPassword(ctx, data, data.user.password);
    });
  }),
PROF_008: personal(async (ctx, ui, data) => {
    await ctx.step('Đổi mật khẩu với mật khẩu cũ sai; không được cập nhật', async () => {
      await passwordForm(ctx, ui, data.user.password + 'x', 'SrsNewPassword123!'); await ui.error(/mật khẩu.*(sai|không)|incorrect|invalid|current password/i);
      assert.equal(await (await ui.visible('.profile-password-form')).isDisplayed(), true); await assertPassword(ctx, data, data.user.password);
    });
  }),
PROF_009: personal(async ctx => { await ctx.step('Đối chiếu quy tắc mật khẩu', () => { throw new Blocked('Excel giả định tối thiểu 8 ký tự, UC003 không chốt độ dài/chính sách độ mạnh. Abc1234 không đủ làm oracle từ SRS.'); }); }),
PROF_010: personal(async ctx => { await ctx.step('Đối chiếu quy tắc mật khẩu', () => { throw new Blocked('Excel giả định mật khẩu 8 ký tự Abc12345 hợp lệ; SRS không chốt chính sách độ mạnh. Cần xác nhận trước khi đổi expected.'); }); }),
PROF_011: personal(async (ctx, ui, data) => {
    await ctx.step('Mật khẩu mới và xác nhận khác nhau; phải giữ mật khẩu cũ', async () => {
      await passwordForm(ctx, ui, data.user.password, 'SrsNewPassword123!', 'Different123!'); await ui.error(/khớp|match/i); await assertPassword(ctx, data, data.user.password);
    });
  }),
PROF_012: personal(async ctx => { await ctx.step('Kiểm tra căn cứ cấm dùng lại mật khẩu', () => { throw new Blocked('Excel cho phép từ chối hoặc ghi nhận; SRS không quy định cấm trùng mật khẩu cũ. Chưa có Expected Result xác định.'); }); })
};