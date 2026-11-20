import assert from 'node:assert/strict';

import { randomBytes } from 'node:crypto';

import { By } from 'selenium-webdriver';

import { scenario, UI } from "../../../common/ui/ui.js";

import { search, drawerName, drawerEmail, drawerSubmit, roleSelect, accounts, find, openCreate, fillAccount, readUser, freshUser, account, reserve, confirmCreated } from "../../../common/flows/support/admin/accounts.js";

export const cases = {
USER_001: account(async (ctx, ui) => {
    await ctx.step('Kiểm tra bảng, ô tìm kiếm và đủ bộ lọc vai trò', async () => {
      await ui.visible('main tbody'); assert.equal(await (await ui.visible(search)).isDisplayed(), true);
      for (const label of ['Student', 'Teacher', 'Admin']) await ui.button(new RegExp(`^${label}\\s*\\(?\\d*\\)?$`), 'main', false);
    });
  }),
USER_002: account(async (ctx, ui, { user }) => {
    await ctx.step('Tìm email fixture; chỉ đúng một tài khoản khớp', async () => {
      await find(ui, user.email);
      await ctx.driver.wait(async () => {
        const emails = await ctx.driver.executeScript('return Array.from(document.querySelectorAll("main tbody tr td:nth-child(2)"),e=>e.innerText.trim())');
        return emails.length === 1 && emails[0] === user.email;
      }, 10000);
    });
  }),
USER_003: account(async (ctx, ui, { user }) => {
    await ctx.step('Tìm zzzzz và xác nhận thông báo rỗng', async () => { await ui.fill(search, 'zzzzz'); await ui.has(/Không tìm thấy tài khoản|No accounts found/i); assert.equal((await ctx.driver.findElements(By.css('main tbody tr'))).length, 0); });
    await ctx.step('Xóa điều kiện trong ô tìm kiếm bằng bàn phím; tài khoản fixture lại xuất hiện khi tìm', async () => { await ui.clearSearch(search); await find(ui, user.email); });
  }),
USER_004: account(async (ctx, ui) => {
    for (const [label, role] of [['Student', 'STUDENT'], ['Teacher', 'TEACHER'], ['Admin', 'ADMIN']]) await ctx.step(`Lọc vai trò ${role}; kiểm tra toàn bộ dòng`, async () => {
      await ui.button(new RegExp(`^${label}\\s*\\(?\\d*\\)?$`));
      await ctx.driver.wait(async () => { const roles = await ctx.driver.executeScript('return Array.from(document.querySelectorAll("main tbody tr td:nth-child(3)"),e=>e.innerText.trim())'); return roles.length && roles.every(r => r === role); }, 10000);
    });
  }),
USER_005: account(async (ctx, ui) => {
    const user = await reserve(ctx, 'STUDENT'); ctx.result.actualData = { email: user.email, fullName: user.fullName, role: user.role };
    await ctx.step('Mở tạo mới và nhập đủ dữ liệu', async () => { await openCreate(ui); await fillAccount(ui, user); });
    await ctx.step('Lưu; đối chiếu danh sách và API sau reload', async () => { await (await ui.visible(drawerSubmit)).click(); await confirmCreated(ctx, ui, user); await ctx.driver.navigate().refresh(); await find(ui, user.email); });
  }),
USER_006: account(async (ctx, ui, { user }) => {
    const before = await readUser(ctx, user);
    await ctx.step('Tạo mới bằng email đã tồn tại; phải báo trùng và không tạo thêm', async () => {
      await openCreate(ui); await fillAccount(ui, user); await (await ui.visible(drawerSubmit)).click(); await ui.error(/tồn tại|trùng|already|exist|sử dụng/i);
      assert.deepEqual(await readUser(ctx, user), before);
    });
  }),
USER_007: account(async (ctx, ui, { user }) => {
    for (const field of [drawerName, drawerEmail]) await ctx.step(`Bỏ trống trường bắt buộc ${field}`, async () => {
      await openCreate(ui); await fillAccount(ui, user); await ui.fill(field, ''); await (await ui.visible(drawerSubmit)).click();
      const input = await ui.visible(field); const valid = await ctx.driver.executeScript('return {missing:arguments[0].validity.valueMissing,message:arguments[0].validationMessage}', input);
      assert.equal(valid.missing, true); assert.ok(valid.message); await ui.button(/^(Hủy|Cancel)$/i, '.adm-drawer');
    });
    await ctx.step('Vai trò có giá trị mặc định hợp lệ; không có lựa chọn rỗng', async () => {
      await openCreate(ui); const role = await ui.visible(roleSelect); assert.ok(['STUDENT','TEACHER','ADMIN'].includes(await role.getAttribute('value')));
      assert.equal((await role.findElements(By.css('option[value=""]'))).length, 0);
    });
  }),
USER_008: account(async (ctx, ui, { user }) => {
    await ctx.step('Nhập email abc; phải bị validation ngăn gửi', async () => {
      await openCreate(ui); await fillAccount(ui, { ...user, email: 'abc' }); await (await ui.visible(drawerSubmit)).click();
      const state = await ctx.driver.executeScript('return {invalid:arguments[0].validity.typeMismatch,message:arguments[0].validationMessage}', await ui.visible(drawerEmail)); assert.equal(state.invalid, true); assert.ok(state.message);
    });
  }),
USER_009: account(async (ctx, ui, { user }) => {
    await ctx.step('Sửa tên đúng tài khoản fixture rồi lưu', async () => {
      await find(ui, user.email); await ui.rowAction(user.email, /Sửa|Edit/i); await ui.fill(drawerName, 'Selenium Edited Account'); await (await ui.visible(drawerSubmit)).click();
      await ctx.driver.wait(async () => (await readUser(ctx, user)).fullName === 'Selenium Edited Account', 10000);
      await ctx.driver.navigate().refresh(); assert.match(await (await find(ui, user.email)).getText(), /Selenium Edited Account/);
    });
  }),
USER_010: account(async (ctx, ui, { user }) => {
    const before = await readUser(ctx, user); const proposed = await reserve(ctx, 'STUDENT');
    await ctx.step('Nhập tạo mới rồi Hủy; email chưa được tạo', async () => {
      await openCreate(ui); await fillAccount(ui, proposed); await ui.button(/^(Hủy|Cancel)$/i, '.adm-drawer');
      assert.equal((await ctx.pool.get('admin', `/admin/users?q=${encodeURIComponent(proposed.email)}&limit=100`)).data.filter(u=>u.email===proposed.email).length, 0);
    });
    await ctx.step('Sửa rồi Hủy; API phải không thay đổi', async () => {
      await find(ui, user.email); await ui.rowAction(user.email, /Sửa|Edit/i); await ui.fill(drawerName, 'Selenium Cancelled'); await ui.button(/^(Hủy|Cancel)$/i, '.adm-drawer'); assert.deepEqual(await readUser(ctx, user), before);
    });
  }),
USER_011: account(async (ctx, ui, { user }) => {
    await ctx.step('Khóa tài khoản riêng qua UI; kiểm tra trạng thái và đăng nhập bị từ chối', async () => {
      await find(ui, user.email); await ui.rowAction(user.email, /^(Khóa|Lock)/i); await ui.confirm();
      await ctx.driver.wait(async () => (await readUser(ctx, user)).status === 'LOCKED', 10000);
      assert.match(await (await ui.row(user.email)).getText(), /khóa|blocked|locked/i);
      const auth = await ctx.pool.request(null,'POST','/auth/login',{ email:user.email,password:user.password },{allowError:true}); assert.ok([400,401,403].includes(auth.status)); assert.equal(auth.data.accessToken, undefined);
    });
  }),
USER_012: account(async (ctx, ui, { user }) => {
    await ctx.step('Chuẩn bị tài khoản đã khóa', async () => { await ctx.pool.request('admin','PATCH',`/admin/users/${user.id}/status`,{status:'LOCKED'}); await ctx.driver.navigate().refresh(); });
    await ctx.step('Mở khóa qua UI; đăng nhập lại phải thành công', async () => {
      await find(ui,user.email); await ui.rowAction(user.email,/^(Mở|Mở khóa|Unlock)$/i); await ui.confirm();
      await ctx.driver.wait(async () => (await readUser(ctx,user)).status==='ACTIVE',10000);
      const auth=await ctx.pool.request(null,'POST','/auth/login',{email:user.email,password:user.password}); assert.equal(auth.user.id,user.id);
    });
  }),
USER_013: account(async (ctx, ui) => {
    await ctx.step('Chuyển trang; ID/email không được trùng giữa hai trang', async () => {
      const values = () => ctx.driver.executeScript('return Array.from(document.querySelectorAll("main tbody tr td:nth-child(2)"),e=>e.innerText.trim())');
      const first = await values(); assert.ok(first.length);
      const next = await ui.visible('button[aria-label="Next page"],button[title="Trang sau"],button[aria-label="Trang tiếp"]');
      assert.equal(await next.isEnabled(),true,'Pagination needs more than one page of fixtures'); await next.click();
      await ctx.driver.wait(async()=>{const current=await values();return current.length&&JSON.stringify(current)!==JSON.stringify(first);},10000);
      const second=await values(); assert.ok(second.length); assert.equal(second.filter(e=>first.includes(e)).length,0);
      await ui.select('select.eh-pagination-select','20');
      await ctx.driver.wait(async()=>(await values()).length===20,10000,'Changing page size must show 20 rows');
      const enlarged=await values();assert.equal(new Set(enlarged).size,20);await ctx.evidence('pagination',{first,second,enlarged});
    });
  })
};