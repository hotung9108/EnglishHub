import assert from 'node:assert/strict';

import { randomBytes } from 'node:crypto';

import { By } from 'selenium-webdriver';

import { scenario, UI } from "../../../common/ui/ui.js";

import { search, drawerName, drawerEmail, drawerSubmit, roleSelect, accounts, find, openCreate, fillAccount, readUser, freshUser, account, reserve, confirmCreated } from "../../../common/flows/support/admin/accounts.js";

export const cases = {
RBAC_001: account(async (ctx, ui, { user }) => {
    await ctx.step('Đổi vai trò fixture Student sang Teacher qua UI', async () => {
      await find(ui,user.email); await ui.rowAction(user.email,/Sửa|Edit/i); await ui.select(roleSelect,'TEACHER'); await (await ui.visible(drawerSubmit)).click();
      await ctx.driver.wait(async()=>(await readUser(ctx,user)).role==='TEACHER',10000);
    });
    await ctx.step('Đăng nhập lại; phải vào menu và dashboard Teacher',async()=> {
      await ctx.driver.executeScript('localStorage.clear();sessionStorage.clear()'); ctx.pool.users.changed={...user,role:'TEACHER'}; await ui.login('changed'); await ui.visible('aside a[href="/teacher/assignments"]');
    });
  }),
RBAC_002: scenario('profile', async (ctx,ui)=> {
    await ctx.step('Mở chính tài khoản admin fixture; tự tước quyền phải bị ngăn',async()=> {
      await accounts(ctx,ui); const user=ctx.pool.users.profile; await find(ui,user.email); await ui.rowAction(user.email,/Sửa|Edit/i);
      const role=await ui.visible(roleSelect); assert.equal(await role.isEnabled(),false); assert.match(await ui.text('.adm-drawer'),/Không thể tự thay đổi vai trò|Cannot change your own role/i);
    });
  }),
RBAC_003: scenario('teacher',async(ctx,ui)=>{
    await ctx.step('Truy cập thẳng URL quản trị bằng Teacher',async()=>{ await ctx.driver.get(new URL('/admin/accounts',ctx.baseUrl).href); await ctx.driver.wait(async()=>!new URL(await ctx.driver.getCurrentUrl()).pathname.startsWith('/admin'),10000); assert.equal((await ctx.driver.findElements(By.css('.adm-table-card tbody tr'))).length,0); });
  }),
RBAC_004: scenario('student',async(ctx,ui)=>{
    await ctx.step('Truy cập thẳng trang tạo bài bằng Student',async()=>{await ctx.driver.get(new URL('/teacher/assignments/create',ctx.baseUrl).href);await ctx.driver.wait(async()=>!new URL(await ctx.driver.getCurrentUrl()).pathname.startsWith('/teacher'),10000); assert.equal((await ctx.driver.findElements(By.css('.assignment-edit-title-input'))).length,0);});
  }),
RBAC_006: scenario('student',async(ctx)=>{
    await ctx.step('Gọi API từ trình duyệt không token và token giả; phải trả 401/403',async()=>{
      const result=await ctx.driver.executeAsyncScript(`const done=arguments[arguments.length-1];Promise.all([{}, {Authorization:'Bearer invalid.srs.token'}].map(headers=>fetch(arguments[0]+'/users/me',{headers}).then(async r=>({status:r.status,body:await r.text()})))).then(done).catch(e=>done({error:String(e)}));`,ctx.pool.base);
      await ctx.evidence('unauthorized-api',result); assert.ok(Array.isArray(result),'Browser must reach API; CORS/network error is not an authorization assertion'); for(const r of result){assert.ok([401,403].includes(r.status));assert.doesNotMatch(r.body,/fullName|hoang\.thanh/i);}
    });
  })
};