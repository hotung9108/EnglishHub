import assert from 'node:assert/strict';

import { By, Key } from 'selenium-webdriver';

import { scenario } from "../../../common/ui/ui.js";

import { Blocked } from "../../../common/runner/core.js";

import { reserve, readUser } from "../../../common/flows/support/admin/accounts.js";

import { businessDate } from "../../../common/time.js";

import { openPerson, createPerson, classForm, reserveClass, classRead, openClass, members, admin, dateCase } from "../../../common/flows/management.js";



export const cases = {
CLS_001:dateCase(30,true),
CLS_003:admin(async ctx=>{await ctx.step('Xác minh yêu cầu ngày kết thúc ≥ ngày bắt đầu trước khi nghiệm thu',()=>{throw new Blocked('UC008 PDF38 yêu cầu cấu hình thời gian đào tạo nhưng không ghi quy tắc kết thúc ≥ bắt đầu; file đã chốt không bổ sung. Ca Excel tự ghi giả định cần xác nhận. Kết quả từ chối từng quan sát chỉ mô tả hành vi hiện tại, không phải PASS nghiệm thu yêu cầu đã duyệt.');});}),
CLS_004:dateCase(0,true),
CLS_005:dateCase(1,true),
CLS_002:admin(async(ctx,ui)=>{await ctx.step('Để trống tên lớp; thử đi tiếp/lưu và kiểm tra lỗi bắt buộc',async()=>{
    await ui.nav('/admin/classes');await ui.button(/^(Tạo lớp học mới|Create New Class)$/i);
    const field=await ui.visible('main form input[type=text]');
    const dates=await ctx.driver.findElements(By.css('main form input[type=date]'));
    await ui.date(dates[0],businessDate());
    await ctx.driver.executeScript('arguments[0].addEventListener("invalid",()=>{window.__classNameInvalid=(window.__classNameInvalid||0)+1})',field);
    const next=await ui.button(/^(Tiếp theo|Tiếp tục|Next|Continue)/i,'main',false);
    const disabled=!(await next.isEnabled());
    if(disabled)await field.sendKeys(Key.ENTER);else await next.click();
    const validation=await ctx.driver.executeScript('return {missing:arguments[0].validity.valueMissing,message:arguments[0].validationMessage,invalidEvents:window.__classNameInvalid||0}',field);
    await ctx.evidence('required-class-name',{...validation,nextDisabled:disabled});
    assert.equal(validation.missing,true);
    if(validation.invalidEvents>0)assert.ok(validation.message);else await ui.error(/tên lớp|class name|bắt buộc|required/i);
    await ui.path('/admin/classes/create');
  });}),
CLS_006:admin(async(ctx,ui)=>{await ctx.step('Khóa giáo viên fixture rồi thử phân công từ picker',async()=>{await ctx.pool.request('admin','PATCH',`/admin/users/${ctx.pool.users.outsider.id}/status`,{status:'LOCKED'});ctx.registerCleanup('Restore dedicated outsider teacher status',()=>ctx.pool.request('admin','PATCH',`/admin/users/${ctx.pool.users.outsider.id}/status`,{status:'ACTIVE'}));await ui.nav('/admin/classes');await ui.button(/^(Tạo lớp học mới|Create New Class)$/i);await ui.fill('main form input[type=text]',`${ctx.pool.prefix}-BlockedTeacher`);await ui.button(/^(Tiếp theo|Tiếp tục|Next|Continue)/i);await ui.button(/^(Đổi giáo viên|Change)$/i);await ui.fill('input[placeholder="Tìm theo tên, email hoặc mã GV..."],input[placeholder="Search by name, email or code..."]',ctx.pool.users.outsider.email);const candidates=await ctx.driver.findElements(By.xpath(`//button[contains(.,'${ctx.pool.users.outsider.email}')]`));for(const c of candidates)assert.equal(await c.isEnabled(),false,'Locked teacher must be unavailable for assignment');});}),
CLS_007:admin(async(ctx,ui)=>{await ctx.step('Đóng lớp rồi mở lại bằng thao tác UI',async()=>{await openClass(ctx,ui);await ui.button(/^(Đóng lớp|Kết thúc lớp|Close Class|Complete Class)$/i);await ui.confirm();await ctx.driver.wait(async()=>(await ctx.pool.get('admin',`/classes/${ctx.pool.class.id}`)).status==='COMPLETED',10000);await ui.button(/^(Mở lại lớp|Reopen Class)$/i);await ui.confirm();await ctx.driver.wait(async()=>(await ctx.pool.get('admin',`/classes/${ctx.pool.class.id}`)).status==='ACTIVE',10000);});}),
CLS_008:admin(async(ctx,ui)=>{await ctx.step('Sửa tên lớp; lưu và kiểm tra qua F5/API',async()=>{const c=await ctx.pool.createClass('Editable');await openClass(ctx,ui,c);await ui.button(/^(Cài đặt lớp học|Cài đặt|Class Settings|Settings)$/i);const next=c.name+'-Edited';await ui.fill('.adm-settings-section-card input[type=text]',next);await ui.button(/^(Lưu thay đổi lớp học|Save Changes)$/i);await ui.has(/thành công|success/i);const actual=await ctx.pool.get('admin',`/classes/${c.id}`);assert.equal(actual.name,next);ctx.pool.resources.find(r=>r.type==='class'&&r.id===c.id).name=next;await ctx.pool.journal();await ctx.driver.navigate().refresh();await ui.has(new RegExp(next));});})
};