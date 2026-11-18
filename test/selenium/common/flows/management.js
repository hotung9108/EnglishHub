import assert from 'node:assert/strict';
import { By, Key } from 'selenium-webdriver';
import { scenario } from "../ui/ui.js";
import { Blocked } from "../runner/core.js";
import { reserve, readUser } from "./support/admin/accounts.js";
import { businessDate } from "../time.js";
async function openPerson(ctx,ui,type,user){
  if(type==='students'){await(await ui.row(user.email)).click();}
  else{
    let card;await ctx.driver.wait(async()=>{for(const e of await ctx.driver.findElements(By.css('.adm-cards-grid .eh-card')))if((await e.getText()).includes(user.email)){card=e;return true;}return false;},10000,'Exact teacher card');
    await(await card.findElement(By.css('button'))).click();
  }
  await ui.path(`/admin/${type}/${user.id}`);await ui.ready();
}
async function createPerson(ctx, ui, type, duplicate = false) {
  const teacher = type === 'teachers';
  const user = duplicate ? ctx.pool.users[teacher ? 'teacher' : 'student'] : await reserve(ctx, teacher ? 'TEACHER' : 'STUDENT');
  await ui.nav(`/admin/${type}`); await ui.button(teacher ? /^(Thêm giáo viên|Thêm giảng viên|Add Teacher)$/i : /^(Thêm học viên|Add Student)$/i);
  await ui.fill('main input[placeholder="Nguyễn Văn A..."]', user.fullName);
  await ui.fill('main input[type=email]', user.email); await ui.fill('main input[type=password]', user.password);
  await ui.button(/^(Tiếp theo|Tiếp tục|Next|Continue)/i);
  if (teacher) await ui.button(/^(Tiếp theo|Tiếp tục|Next|Continue)/i);
  await (await ui.visible('main button[type=submit]')).click();
  if (duplicate) { await ui.error(/trùng|tồn tại|already|exist|sử dụng/i); return; }
  await ui.path(`/admin/${type}`); await ui.fill('main input.adm-search-input', user.email); await ui.has(new RegExp(user.fullName));
  const actual = await readUser(ctx, user); await ctx.evidence('created-person', actual);
  Object.assign(user.resource, { id: actual.id, state: 'CREATED' }); await ctx.pool.journal(); assert.equal(actual.role, teacher ? 'TEACHER' : 'STUDENT');
}
async function classForm(ctx, ui, name, start, end) {
  await ui.nav('/admin/classes'); await ui.button(/^(Tạo lớp học mới|Tạo lớp mới|Create New Class)$/i);
  await ui.fill('main form input[type=text]', name);
  const dates = await ctx.driver.findElements(By.css('main input[type=date]')); assert.equal(dates.length,2);
  await ui.date(dates[0],start); await ui.date(dates[1],end);
  if(end<start){await ui.button(/^(Tiếp theo|Tiếp tục|Next|Continue)/i);return;}
  await ui.button(/^(Tiếp theo|Tiếp tục|Next|Continue)/i);
  await ui.button(/^(Đổi giáo viên|Change|-- Tìm và chọn Giảng viên phụ trách --|-- Search & Select Instructor --)$/i);
  await ui.fill('input[placeholder="Tìm theo tên, email hoặc mã GV..."],input[placeholder="Search by name, email or code..."]', ctx.pool.users.teacher.email);
  const teacher=await ctx.driver.wait(async()=>{for(const e of await ctx.driver.findElements(By.css('main div[role=option],main div.cursor-pointer')))if((await e.getText()).includes(ctx.pool.users.teacher.email))return e;return false;},10000,'Exact teacher option in picker');await teacher.click();
  await ui.button(/^(Tiếp theo|Tiếp tục|Next|Continue)/i);
}
async function reserveClass(ctx) {
  const name=`${ctx.pool.prefix}-UIClass-${Date.now()}`;
  const resource={type:'class',name,teacherId:ctx.pool.users.teacher.id,state:'RESERVED'};ctx.pool.resources.push(resource);await ctx.pool.journal();return resource;
}
async function classRead(ctx, resource) {
  const list=await ctx.pool.get('admin','/classes?limit=100');const matches=list.data.filter(c=>c.name===resource.name);assert.equal(matches.length,1);
  Object.assign(resource,{id:matches[0].id,state:'CREATED'});await ctx.pool.journal();return ctx.pool.get('admin',`/classes/${resource.id}`);
}
async function openClass(ctx,ui,c=ctx.pool.class) {
  if(ctx.test.id==='CLS_007')ctx.registerCleanup('Restore dedicated class ACTIVE status',()=>ctx.pool.request('admin','PUT',`/classes/${c.id}`,{status:'ACTIVE'}));
  await ui.nav('/admin/classes');await ui.fill('main input.adm-search-input',c.name);
  const row=await ui.row(c.name);const button=await row.findElement(By.css('button'));await button.click();await ui.path(`/admin/classes/${c.id}`);await ui.has(new RegExp(c.name));
}
async function members(ctx,ui) {
  if(ctx.test.id==='MEM_001'){
    const before=await ctx.pool.get('admin',`/classes/${ctx.pool.class.id}/members`);assert.ok(!before.data.some(m=>m.studentId===ctx.pool.users.empty.id));
    ctx.registerCleanup('Remove only membership added by MEM_001',async()=>{const roster=await ctx.pool.get('admin',`/classes/${ctx.pool.class.id}/members`);for(const member of roster.data.filter(m=>m.studentId===ctx.pool.users.empty.id))await ctx.pool.request('admin','DELETE',`/classes/${ctx.pool.class.id}/members/${member.memberId}`);});
  }
  await openClass(ctx,ui);await ui.button(/^(Danh sách học viên|Học viên|Thành viên|Student List|Students|Members)(\s*\(?\d*\)?)?$/i);
}
const admin=run=>scenario('admin',run);
const dateCase=(offset,expected)=>admin(async(ctx,ui)=>{
  const resource=await reserveClass(ctx);const today=businessDate(expected?0:10);const end=businessDate(expected?offset:0);
  ctx.result.actualData={className:resource.name,startDate:today,endDate:end,teacherId:ctx.pool.users.teacher.id};
  await ctx.step('Nhập tên, ngày và giáo viên theo ca biên',()=>classForm(ctx,ui,resource.name,today,end));
  await ctx.step('Lưu và kiểm tra dữ liệu tồn tại/không tồn tại',async()=>{
    if(expected)await (await ui.visible('main button[type=submit]')).click();
    if(expected){await ui.path('/admin/classes');const actual=await classRead(ctx,resource);await ctx.evidence('class-readback',actual);assert.equal(actual.startDate,today);assert.equal(actual.endDate,end);assert.equal(actual.teacherId??actual.teacher?.id,ctx.pool.users.teacher.id);await ctx.driver.navigate().refresh();await ui.fill('main input.adm-search-input',resource.name);await ui.row(resource.name);}
    else {await ui.error(/kết thúc.*(sau|bằng)|end date.*after/i);const list=await ctx.pool.get('admin','/classes?limit=100');assert.equal(list.data.filter(c=>c.name===resource.name).length,0);}
  });
});
export { openPerson, createPerson, classForm, reserveClass, classRead, openClass, members, admin, dateCase };
