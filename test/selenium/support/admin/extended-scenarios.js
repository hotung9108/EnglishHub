import assert from 'node:assert/strict';
import {By} from 'selenium-webdriver';
import {blocked,guardUser,readUser,waitApi} from './fixtures.js';
import {assertGradingCells,assertReportClassCells} from './assertions.js';

export function dateWindows(now=new Date()) {
  const day=offset=>new Date(now.getTime()+offset*86400000).toISOString().slice(0,10);
  return {include:{from:day(-2),to:day(2)},exclude:{from:day(30),to:day(31)}};
}

export function assertOverview(actual,expected) {
  for(const key of ['classCount','pendingGradingCount','averageScorePercent','completionRatePercent']) {
    assert.ok(Number.isFinite(expected[key]),`API thiếu metric ${key}`);
    assert.equal(actual[key],`${expected[key]}${key.endsWith('Percent')?'%':''}`,`Reports KPI sai: ${key}`);
  }
}

export async function overviewMetrics(p) {
  const patterns={classCount:/^TỔNG LỚP ĐANG THEO DÕI$|^MONITORED CLASSES$/i,completionRatePercent:/^TỶ LỆ HOÀN THÀNH BÀI TẬP$|^COMPLETION RATE$/i,averageScorePercent:/^ĐIỂM TRUNG BÌNH TOÀN KHÓA$|^AVERAGE SCORE$/i,pendingGradingCount:/^BÀI TẬP CHỜ CHẤM$|^PENDING GRADING$/i};
  const result={};
  for(const card of await p.driver.findElements(By.css('main .metric-card'))) {
    const title=(await card.findElement(By.css('.metric-title')).getText()).trim();
    for(const [key,pattern] of Object.entries(patterns))if(pattern.test(title))result[key]=(await card.findElement(By.css('.metric-value')).getText()).trim();
  }
  assert.equal(Object.keys(result).length,4,'Không nhận diện đủ bốn KPI Reports theo nhãn');return result;
}

export async function setReportDates(p,window) {
  const fields=await p.driver.findElements(By.css('main input[type=date]'));
  assert.equal(fields.length,2,'Reports cần hai trường Từ ngày / Đến ngày');
  await p.fillDate(fields[0],window.from);await p.fillDate(fields[1],window.to);await p.ready();
  assert.equal(await fields[0].getAttribute('value'),window.from);assert.equal(await fields[1].getAttribute('value'),window.to);
}

async function waitOverview(p,expected,r) {
  await p.driver.wait(async()=>{
    r.uiOverview=await overviewMetrics(p);
    return Object.entries(r.uiOverview).every(([key,value])=>value===`${expected[key]}${key.endsWith('Percent')?'%':''}`);
  },p.config.timeout,'Reports KPI không khớp bộ lọc/API sau khi chờ tải',300);
  assertOverview(r.uiOverview,expected);
}

export async function reportDates(p,d,r,which) {
  const window=dateWindows()[which];r.readback={window,fixture:d.audit,classId:d.baseClass.id};
  await p.nav('reports');await p.selectContainingValue(d.teacher.id,/Tất cả giáo viên|Tất cả giảng viên|All Teachers/i);
  await p.selectContainingValue(d.baseClass.id,/Tất cả lớp|All Classes/i);await p.ready();
  await setReportDates(p,window);
  const query=`from=${window.from}&to=${window.to}`;
  const expected=await d.api.get('admin',`/reports/overview?classId=${d.baseClass.id}&${query}`);
  r.readback.overview=expected;
  // Independent business expectation: own graded assignment is 8/10 and submitted now;
  // a future-only window must not count it even if both UI and API share the same bug.
  assert.equal(expected.averageScorePercent,which==='include'?80:0,'API tính điểm bài QA sai khoảng ngày');
  assert.equal(expected.completionRatePercent,which==='include'?100:0,'API tính tỷ lệ bài QA sai khoảng ngày');
  await waitOverview(p,expected,r);
  const list=await d.api.get('admin',`/reports/classes?teacherId=${d.teacher.id}&page=1&limit=100&${query}`);
  const own=list.data?.find(c=>c.classId===d.baseClass.id);assert.ok(own,'API thiếu lớp QA');r.readback.class=own;
  const row=await p.exactRow(d.baseClass.name);
  r.uiCells=await Promise.all((await row.findElements(By.css('td'))).map(async e=>(await e.getText()).trim()));
  assertReportClassCells(r.uiCells,own);
}

export async function resetAllReportFilters(p,d,r) {
  await p.nav('reports');await p.selectContainingValue(d.teacher.id,/Tất cả giáo viên|Tất cả giảng viên|All Teachers/i);
  await p.selectContainingValue(d.baseClass.id,/Tất cả lớp|All Classes/i);await setReportDates(p,dateWindows().include);
  await p.button(/^Xóa bộ lọc$|^Reset Filters$/);await p.ready();
  r.readback={dateValues:[],selectValues:[]};
  for(const e of await p.driver.findElements(By.css('main input[type=date]')))r.readback.dateValues.push(await e.getAttribute('value'));
  for(const e of await p.driver.findElements(By.css('main select')))r.readback.selectValues.push(await e.getAttribute('value'));
  assert.equal(r.readback.dateValues.length,2);assert.ok(r.readback.dateValues.every(v=>v===''),'Reset còn giữ ngày');
  assert.ok(r.readback.selectValues.length>=2&&r.readback.selectValues.every(v=>['','ALL','all'].includes(v)),'Reset còn giữ Teacher/Class');
  r.readback.overview=await d.api.get('admin','/reports/overview');await waitOverview(p,r.readback.overview,r);
}

export async function studentStatus(p,d,r,entry) {
  const user=d.student;r.readback={entry,expectedUser:await readUser(d,user)};await guardUser(d,user);
  if(r.readback.expectedUser.status!=='ACTIVE')throw Object.assign(new Error('Fixture Student không ACTIVE trước case; chưa thử toggle'),{code:'QA31_FIXTURE'});
  let row;
  if(entry==='list') {
    await p.nav('students');await p.search(user.email);
    const matches=[];for(const candidate of await p.rows())if((await candidate.getText()).includes(user.email))matches.push(candidate);
    if(matches.length!==1)throw blocked('Không tìm được đúng Student QA trong danh sách; chưa thử khóa/mở khóa',['QA31-014']);
    row=matches[0];assert.ok((await row.getText()).includes(user.name),'Dòng Student sai tên; không thao tác');
  } else {
    await p.openClass(d.baseClass);await p.rowAction(await p.exactRow(user.name),/^Hồ sơ$|^Profile$/);await p.ready();
    r.readback.actualUrl=await p.driver.getCurrentUrl();
    try {assert.equal(new URL(r.readback.actualUrl).pathname,`/admin/students/${user.id}`);await p.assertIdentity(user);}
    catch(error){if(error.code!=='ERR_ASSERTION')throw error;throw blocked('Hồ sơ không khớp Student QA; dừng trước mọi thay đổi trạng thái',['QA31-020']);}
  }
  let touched=false;
  try {
    await guardUser(d,user);touched=true;
    if(entry==='list')await p.rowAction(row,/^Khóa$|^Lock$/);else await p.button(/^Khóa tài khoản$|^Lock Account$/);
    await p.acceptOptionalConfirm();r.readback.locked=await waitApi(()=>readUser(d,user),x=>x.status==='LOCKED');
    if(entry==='list') {
      row=await p.exactRow(user.email);assert.match(await row.getText(),/Bị khóa|Blocked|Locked/i);
      await guardUser(d,user);await p.rowAction(row,/^Mở khóa$|^Unlock$/);
    } else {await p.assertIdentity(user);await guardUser(d,user);await p.button(/^Mở khóa$|^Unlock$/);}
    await p.acceptOptionalConfirm();r.readback.active=await waitApi(()=>readUser(d,user),x=>x.status==='ACTIVE');
    await p.driver.navigate().refresh();await p.ready();
    if(entry==='list'){await p.search(user.email);assert.match(await (await p.exactRow(user.email)).getText(),/Hoạt động|Active/i);}
    else {await p.assertIdentity(user);await p.button(/^Khóa tài khoản$|^Lock Account$/,'main',false);}
  } finally {
    if(touched){await guardUser(d,user);await d.api.request('admin','PATCH',`/admin/users/${user.id}/status`,{status:'ACTIVE'});r.readback.restored=await readUser(d,user);assert.equal(r.readback.restored.status,'ACTIVE');}
  }
}

export function assertAuditStatusRows(rows,expected,status) {
  assert.ok(rows.length,'Không có dòng để kiểm tra filter, không tính Pass vì bảng rỗng');
  const known=new Map(expected.map(g=>[Number(g.id),g]));
  for(const cells of rows) {
    const id=/^GR-(\d+)$/.exec(cells[0]||'');assert.ok(id,'Dòng Audit không có mã GR hợp lệ');
    const g=known.get(Number(id[1]));assert.ok(g,`Audit hiển thị mã ngoài tập ${status}`);assert.equal(g.status,status);
    assertGradingCells(cells,g);
  }
}

export async function auditStatus(p,d,r,status) {
  const list=await d.api.get('admin','/gradings?limit=100');assert.ok(Array.isArray(list.data));
  const expected=list.data.filter(g=>g.status===status);
  if(!expected.length)throw Object.assign(new Error(`Không có grading ${status} trong tập tải; chưa xác minh được filter`),{code:'QA31_FIXTURE'});
  r.readback={status,expected};
  if(status==='COMPLETED')assert.ok(expected.some(g=>g.id===d.audit.id),'Danh sách thiếu grading QA đã chấm');
  await p.nav('audit/gradings');await p.button(status==='COMPLETED'?/^Đã hoàn tất|^Completed/:/^Chờ duyệt|^Pending/);await p.ready();
  await p.gradingRow(status==='COMPLETED'?d.audit.id:expected[0].id);
  r.uiRows=await Promise.all((await p.rows()).map(async row=>Promise.all((await row.findElements(By.css('td'))).map(async c=>(await c.getText()).trim()))));
  assertAuditStatusRows(r.uiRows,expected,status);
}

export async function systemSettingsForm(p,r,dependent=false) {
  await p.nav('settings');
  try {return await p.field(/Mô hình chấm Writing|Writing Evaluation Model/i);}
  catch(error) {
    r.readback={actualUrl:await p.driver.getCurrentUrl(),expected:'Cấu hình hệ thống FE-23 với Writing model và Lưu/Khôi phục; không phải form hồ sơ cá nhân'};
    if(dependent)throw blocked('Chưa có form cấu hình hệ thống theo FE-23; chưa kiểm tra lưu/reset',['QA31-048']);
    assert.fail(`Không tìm thấy form cấu hình hệ thống FE-23 tại Cài đặt: ${error.message}`);
  }
}

export async function systemSettingsAvailable(p,d,r) {
  const model=await systemSettingsForm(p,r);r.readback={writingModel:await model.getAttribute('value')};
  await p.button(/^Lưu thay đổi cài đặt$|^Save Configuration$/,'main',false);
  await p.button(/^Khôi phục mặc định$|^Reset to Defaults$/,'main',false);
  assert.ok((await model.findElements(By.css('option'))).length>=2,'Không đủ lựa chọn model để kiểm tra cấu hình');
}

export async function systemSettingsPersistence(p,d,r) {
  let model=await systemSettingsForm(p,r,true);const original=await model.getAttribute('value');
  const values=[];for(const option of await model.findElements(By.css('option')))values.push(await option.getAttribute('value'));
  const changed=values.find(v=>v&&v!==original);assert.ok(changed,'Không có lựa chọn model khác để test');
  r.readback={original,changed,scope:'Chỉ đổi model trong browser QA, không điền API key, không sửa tài khoản'};
  try {
    await p.select(model,changed);await p.button(/^Lưu thay đổi cài đặt$|^Save Configuration$/);
    await p.driver.navigate().refresh();await p.ready();model=await p.field(/Mô hình chấm Writing|Writing Evaluation Model/i);
    r.readback.afterRefresh=await model.getAttribute('value');assert.equal(r.readback.afterRefresh,changed,'Model không giữ sau reload');
    await p.button(/^Khôi phục mặc định$|^Reset to Defaults$/);await p.acceptOptionalConfirm();
    await p.driver.navigate().refresh();await p.ready();model=await p.field(/Mô hình chấm Writing|Writing Evaluation Model/i);
    r.readback.afterReset=await model.getAttribute('value');assert.equal(r.readback.afterReset,original,'Reset không trở về mặc định ban đầu của browser QA mới');
  } finally {
    model=await p.field(/Mô hình chấm Writing|Writing Evaluation Model/i);await p.select(model,original);
    await p.button(/^Lưu thay đổi cài đặt$|^Save Configuration$/);
  }
}

export async function contentEntry(p,d,r) {
  const entries=[],observedNavigation=[];
  for(const link of await p.driver.findElements(By.css('aside a[href]'))) {
    const label=(await link.getText()).trim(),href=await link.getAttribute('href');
    const route=new URL(href).pathname;
    if(route.startsWith('/admin/'))observedNavigation.push({label,path:route});
    if(/nội dung|content|ngân hàng|question bank|exam bank|bài tập|assignment|học liệu|materials|library/i.test(label)&&route.startsWith('/admin/'))entries.push({label,path:route});
  }
  r.readback={entries,observedNavigation,scope:'Chỉ khảo sát entry sidebar; nghiệp vụ không bắt buộc có menu riêng, có thể đi qua lớp. Chưa đại diện CRUD.'};
  if(!entries.length)throw Object.assign(new Error('Chưa xác định được luồng/entry quản lý nội dung theo nghiệp vụ; không suy ra thiếu chức năng chỉ từ sidebar. Cần xác định nội dung và đường đi trước khi kiểm thử CRUD.'),{code:'QA31_SCOPE'});
  for(const entry of entries){await p.nav(entry.path.slice('/admin/'.length));assert.doesNotMatch(await p.text(),/404_NOT_FOUND|Bạn không có quyền|Unauthorized|Failed to load/i);}
}
