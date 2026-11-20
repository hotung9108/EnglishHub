import assert from 'node:assert/strict';

import { randomUUID } from 'node:crypto';

import { By, Key, until } from 'selenium-webdriver';

import { Blocked } from "../../../common/runner/core.js";

import { emailField, passwordField, submitButton, errorAlert, invalidCredentials, token, credentials, open, submit, dashboard, successful, rejection, required, loginScreen, logout, afterLogin } from "../../../common/flows/support/common/auth.js";

export const cases = {
LOGIN_001: successful('admin'),
LOGIN_002: {
    data: 'Email admin fixture, mật khẩu sai',
    prepare: () => credentials('admin'),
    async run(ctx, { email, password }) {
      await open(ctx);
      await submit(ctx, email, `${password}x`);
      await rejection(ctx);
    }
  },
LOGIN_003: {
    data: 'Email ngẫu nhiên trên example.invalid và mật khẩu sai',
    prepare: () => credentials('admin'),
    async run(ctx, { email, password }) {
      await open(ctx);
      await submit(ctx, email, `${password}x`);
      const baseline = await rejection(ctx);
      await open(ctx);
      await submit(ctx, `selenium-${randomUUID()}@example.invalid`, 'InvalidLogin123!');
      const unknownEmail = await rejection(ctx);
      await ctx.step('So sánh thông báo giữa email có và không có tài khoản', () => {
        assert.equal(unknownEmail, baseline);
      });
    }
  },
LOGIN_004: {
    data: 'Fixture tài khoản bị khóa, dùng mật khẩu hợp lệ của fixture',
    prepare: () => credentials('locked'),
    async run(ctx, { email, password }) {
      await open(ctx);
      await submit(ctx, email, password);
      await rejection(ctx, /tạm khóa|temporarily locked|account is locked/iu);
    }
  },
LOGIN_005: required('', '', [['login-email', 'valueMissing'], ['login-password', 'valueMissing']]),
LOGIN_006: required('', 'FixtureSample123!', [['login-email', 'valueMissing']]),
LOGIN_007: required('selenium@example.invalid', '', [['login-password', 'valueMissing']]),
LOGIN_008: required('abc', 'FixtureSample123!', [['login-email', 'typeMismatch']]),
LOGIN_009: required('abc@', 'FixtureSample123!', [['login-email', 'typeMismatch']]),
LOGIN_010: {
    data: 'Email fixture có dấu cách bao quanh, mật khẩu đúng',
    prepare: () => credentials('admin'),
    async run(ctx, { email, password }) {
      await open(ctx);
      await submit(ctx, ` ${email} `, password);
      const outcome = await ctx.step('Ghi nhận ứng dụng vào dashboard hay từ chối', () =>
        ctx.driver.wait(async () => {
          if (new URL(await ctx.driver.getCurrentUrl()).pathname === '/admin/dashboard') return 'dashboard';
          const alerts = await ctx.driver.findElements(errorAlert);
          if (alerts.length && await alerts[0].isDisplayed()) return 'rejected';
          return false;
        }, 10000)
      );
      if (outcome === 'dashboard') await dashboard(ctx, 'admin');
      else await rejection(ctx);
    }
  },
LOGIN_011: {
    data: 'Email fixture viết hoa, mật khẩu đúng',
    prepare: () => credentials('admin'),
    async run(ctx, { email, password }) {
      assert.notEqual(email, email.toUpperCase(), 'Fixture phải có chữ thường để kiểm tra');
      await open(ctx);
      await submit(ctx, email.toUpperCase(), password);
      await ctx.step('Ghi nhận quy tắc email phân biệt hoa/thường do người dùng xác nhận', async () => {
        await ctx.evidence('email-case-policy', { email: email.toUpperCase(), currentUrl: await ctx.driver.getCurrentUrl() });
      });
      await rejection(ctx);
    }
  },
LOGIN_012: {
    data: 'Email fixture và mật khẩu đã đảo hoa/thường',
    prepare: () => credentials('admin'),
    async run(ctx, { email, password }) {
      const changed = password.replace(/[a-z]/gi, letter =>
        letter === letter.toLowerCase() ? letter.toUpperCase() : letter.toLowerCase()
      );
      assert.notEqual(changed, password, 'Mật khẩu fixture phải có chữ cái');
      await open(ctx);
      await submit(ctx, email, changed);
      await rejection(ctx);
    }
  },
LOGIN_013: {
    data: 'Email fixture và mật khẩu sai 256 ký tự',
    prepare: () => credentials('admin'),
    async run(ctx, { email }) {
      await open(ctx);
      await submit(ctx, email, 'a'.repeat(256));
      await rejection(ctx);
    }
  },
LOGIN_014: {
    data: 'Email fixture admin và mật khẩu một ký tự',
    prepare: () => credentials('admin'),
    async run(ctx, { email }) {
      await open(ctx);
      await submit(ctx, email, 'x');
      await rejection(ctx);
    }
  },
LOGIN_017: successful('admin', { enter: true }),
LOGIN_018: {
    data: 'Chuỗi mẫu không phải mật khẩu tài khoản',
    async run(ctx) {
      await open(ctx);
      const input = await ctx.driver.findElement(passwordField);
      const toggle = await ctx.driver.findElement(By.css('.login-pwd-toggle'));
      await ctx.step('Kiểm tra mặc định và bật/tắt hiển thị', async () => {
        await input.sendKeys('Sample123!');
        assert.equal(await input.getAttribute('type'), 'password');
        await toggle.click();
        assert.equal(await input.getAttribute('type'), 'text');
        assert.equal(await input.getAttribute('value'), 'Sample123!');
        await toggle.click();
        assert.equal(await input.getAttribute('type'), 'password');
      });
    }
  },
LOGIN_020: {
    data: 'Form đăng nhập chưa nhập dữ liệu',
    async run(ctx) {
      await open(ctx);
      await ctx.step('Kiểm tra nhãn hiển thị, liên kết với input và thuộc tính bắt buộc', async () => {
        for (const [id, labelText] of [['login-email', /^Email$/iu], ['login-password', /^(Mật khẩu|Password)$/iu]]) {
          const label = await ctx.driver.findElement(By.css(`label[for="${id}"]`));
          assert.equal(await label.isDisplayed(), true);
          assert.match((await label.getText()).trim(), labelText);
          const field = await ctx.driver.findElement(By.id(id));
          assert.equal(await ctx.driver.executeScript('return arguments[0].required;', field), true);
        }
      });
    }
  },
LOGIN_021: {
    data: 'Phiên mới, URL dashboard của ba vai trò',
    async run(ctx) {
      for (const role of ['admin', 'teacher', 'student']) {
        await ctx.step(`Truy cập dashboard ${role} khi chưa đăng nhập`, async () => {
          await ctx.driver.get(new URL(`/${role}/dashboard`, ctx.baseUrl).href);
          await ctx.driver.wait(until.urlIs(new URL('/login', ctx.baseUrl).href), 10000);
          await ctx.driver.wait(until.elementLocated(emailField), 10000);
        });
      }
    }
  },
LOGIN_022: successful('admin', { reload: true }),
LOGIN_023: successful('teacher'),
LOGIN_024: successful('student'),
LOGIN_025: successful('admin'),
LOGIN_015: required("' OR '1'='1' --", 'Invalid123!', [['login-email', 'typeMismatch']]),
LOGIN_016: {
  data: { email: '<script>window.__srsXss=true</script>', password: '[invalid sample]' },
  async run(ctx) {
    await open(ctx);
    await ctx.step('Nhập payload XSS qua bàn phím; kiểm tra validation và script không chạy', async () => {
      await submit(ctx, '<script>window.__srsXss=true</script>', 'Invalid123!');
      assert.equal(await ctx.driver.executeScript('return window.__srsXss === true'), false);
      assert.equal(await token(ctx.driver), false);
      const state = await ctx.driver.executeScript("const e=document.getElementById('login-email');return {invalid:e.validity.typeMismatch,message:e.validationMessage}");
      assert.equal(state.invalid, true); assert.ok(state.message);
    });
  }
},
LOGIN_019: {
  data: { role: 'admin', network: 'real response, delayed outbound fetch by 800 ms for observation' },
  prepare: () => credentials('admin'),
  async run(ctx, user) {
    await open(ctx);
    await ctx.step('Quan sát request XHR thật; tăng độ trễ mạng để đo trạng thái đang xử lý', async () => {
      await ctx.driver.sendDevToolsCommand('Network.enable', {});
      await ctx.driver.sendDevToolsCommand('Network.emulateNetworkConditions', { offline: false, latency: 1000, downloadThroughput: -1, uploadThroughput: -1 });
      await ctx.driver.executeScript(`window.__loginRequests=0;const open=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(method,url,...rest){if(String(url).includes('/auth/login'))window.__loginRequests++;return open.call(this,method,url,...rest)}`);
    });
    await submit(ctx, user.email, user.password);
    await ctx.step('Bấm lặp khi đang xử lý; kiểm tra disabled và chỉ một request', async () => {
      const button = await ctx.driver.findElement(submitButton);
      assert.equal(await button.isEnabled(), false, 'Login button must be disabled in flight');
      assert.match(await button.getText(), /Đang|Signing|Logging|Loading/i);
      await button.click();
      assert.equal(await ctx.driver.executeScript('return window.__loginRequests'), 1);
    });
    await dashboard(ctx, 'admin');
  }
}
};