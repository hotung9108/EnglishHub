import assert from 'node:assert/strict';
import {detailedAdminSteps} from './procedures.js';
import {adminIssueRefs} from '../../support/admin/issue-registry.js';
import {By} from 'selenium-webdriver';
import {blocked,guardUser,guardClass,readUser,waitApi} from '../../support/admin/fixtures.js';
import {assertAccountRejected,assertProgressMetrics,assertGradingCells,assertAuditLogs,assertReportClassCells} from '../../support/admin/assertions.js';
import {studentStatus,reportDates,resetAllReportFilters,auditStatus,systemSettingsAvailable,systemSettingsPersistence,contentEntry} from '../../support/admin/extended-scenarios.js';

const cases=[];
function test(title,summary,expected,resources,run) {
  const id=`QA31-${String(cases.length+1).padStart(3,'0')}`;
  cases.push({id,title,summary,steps:detailedAdminSteps(id),expected,resources,issueRefs:adminIssueRefs[id]||[],run});
}
const requireRows=rows=>assert.ok(rows.length,'Không có dòng dữ liệu để xác minh bộ lọc');
async function account(p,d,dependent=false) {
  await p.nav('accounts'); await p.search(d.teacher.email);
  const rows=await p.rows();
  const found=[];for(const row of rows)if((await row.getText()).includes(d.teacher.email))found.push(row);
  if(!found.length&&dependent) throw blocked('Không tìm thấy tài khoản QA trong Accounts; chưa kiểm tra được sửa/khóa. Không thao tác tài khoản thay thế.',['QA31-003']);
  assert.equal(found.length,1,'Tài khoản QA tồn tại trên API nhưng Accounts không tìm thấy');return found[0];
}
async function drawer(p,d) {
  await guardUser(d,d.teacher);await p.rowAction(await account(p,d,true),/^Sửa$|^Edit$/);
  await p.visible(By.css('.adm-drawer'));
  const email=await (await p.visible(By.css('.adm-drawer input[type=email]'))).getAttribute('value');
  assert.equal(email,d.teacher.email,'Không sửa drawer của tài khoản khác');
}
async function createPerson(p,d,section) {
  await p.createForm(section);
  await p.fill(await p.field(/Họ và tên|Full Name/i),section==='teachers'?d.uiNames.teacher:d.uiNames.student);
  const email=`qa31-${d.tag}-${section}-ui@example.invalid`;
  await p.fill(await p.visible(By.css('main input[type=email]')),email);
  await p.fill(await p.visible(By.css('main input[type=password]')),d.password,'Nhập mật khẩu QA (không ghi giá trị)');
  // Support observed staging wizard and current source wizard; never jump steps by JS.
  for(let step=0;step<4;step++) {
    const submit=await p.driver.findElements(By.css('main button[type=submit]'));
    let final;
    for(const b of submit)if(await b.isDisplayed())final=b;
    if(final){await p.clickElement(final,'Hoàn tất tạo tài khoản QA');break;}
    assert.ok(step<3,'Wizard exceeds surveyed steps');await p.next();
  }
  await p.driver.wait(async()=>new URL(await p.driver.getCurrentUrl()).pathname===`/admin/${section}`,p.config.timeout,'UI did not finish account creation');
  const result=await waitApi(()=>d.api.get('admin',`/admin/users?q=${encodeURIComponent(email)}&limit=100`),x=>x.data?.some(u=>u.email===email));
  const user=result.data.find(u=>u.email===email);assert.equal(user.role,section==='teachers'?'TEACHER':'STUDENT');
  assert.equal(user.fullName,section==='teachers'?d.uiNames.teacher:d.uiNames.student);
  d.ledger.push({kind:'ui-user',id:user.id,email,role:user.role});
  return {id:user.id,email,role:user.role,fullName:user.fullName};
}

test('Đăng nhập đúng vai trò Admin','Đăng nhập qua form, chờ dashboard và xác minh role trong session.','URL /admin/dashboard; vai trò ADMIN; có các liên kết quản trị.',[],async(p)=>{
  assert.equal(new URL(await p.driver.getCurrentUrl()).pathname,'/admin/dashboard');
  for(const s of ['accounts','classes','teachers','students','reports','audit/gradings'])assert.equal((await p.driver.findElements(By.css(`aside a[href="/admin/${s}"]`))).length,1);
  assert.doesNotMatch(await p.text(),/Bạn không có quyền|Unauthorized/i);
});
test('Điều hướng các màn Admin qua sidebar','Lần lượt bấm Accounts, Classes, Teachers, Students, Reports, Audit.','Mỗi link mở đúng URL, tải xong và không báo lỗi quyền.',[],async(p)=>{
  for(const s of ['accounts','classes','teachers','students','reports','audit/gradings']){await p.nav(s);assert.doesNotMatch(await p.text(),/Bạn không có quyền|Không thể tải|Failed to load/i);}
});
test('Accounts tìm tài khoản QA vừa tạo','Tìm email chính xác của Teacher QA tạo qua API.','Một dòng đúng email và TEACHER, đối chiếu API.', ['teacher'],async(p,d,r)=>{
  r.readback=await readUser(d,d.teacher);const row=await account(p,d);assert.match(await row.getText(),/TEACHER|Teacher/);
});
test('Accounts tìm không có kết quả','Tìm chuỗi email ngẫu nhiên chắc chắn không tồn tại.','Không có dòng tài khoản và có thông báo rỗng.',[],async(p)=>{
  await p.nav('accounts');await p.search(`missing-qa31-${Date.now()}@example.invalid`);assert.equal((await p.rows()).filter(Boolean).length<=1,true);assert.match(await p.text(),/Không tìm thấy|Không có tài khoản|No .*found/i);
});
test('Accounts lọc Teacher','Bấm pill Teacher và đọc role mọi dòng đang hiển thị.','Có dữ liệu; mọi role là TEACHER.',[],async(p)=>{
  await p.nav('accounts');await p.button(/^Teacher/);await p.ready();const rows=await p.rows();requireRows(rows);for(const row of rows){const cells=await row.findElements(By.css('td'));assert.equal((await cells[2].getText()).trim(),'TEACHER');}
});
test('Accounts hủy chỉnh sửa không lưu','Mở đúng tài khoản QA, đổi tên trong drawer rồi Hủy.','API fullname không thay đổi.', ['teacher'],async(p,d,r)=>{
  const before=await readUser(d,d.teacher);await drawer(p,d);await p.fill(await p.field(/HỌ VÀ TÊN|Họ và tên|Full Name/i),'QA Cancelled Name');await p.button(/^Hủy$|^Cancel$/,'.adm-drawer');await p.ready();const after=await readUser(d,d.teacher);assert.equal(after.fullName,before.fullName);r.readback={before,after};
});
test('Accounts sửa họ tên và lưu','Mở đúng QA Teacher; sửa họ tên; lưu và mở lại drawer.','API và input sau mở lại cùng là tên QA mới.', ['teacher'],async(p,d,r)=>{
  const name=d.teacher.name+' Updated';await drawer(p,d);await p.fill(await p.field(/HỌ VÀ TÊN|Họ và tên|Full Name/i),name);await p.button(/^Lưu tài khoản$|^Lưu thay đổi$|^Save Changes$/,'.adm-drawer');await p.ready();r.readback=await waitApi(()=>readUser(d,d.teacher),u=>u.fullName===name);d.teacher.name=name;await drawer(p,d);assert.equal(await (await p.field(/HỌ VÀ TÊN|Họ và tên|Full Name/i)).getAttribute('value'),name);
});
test('Accounts khóa rồi mở lại tài khoản QA','Trên đúng dòng QA Teacher, khóa; xác minh API LOCKED; mở khóa; xác minh ACTIVE.','Hai thay đổi lưu thật; finally khôi phục ACTIVE chỉ trên QA đã xác minh.', ['teacher'],async(p,d,r)=>{
  await guardUser(d,d.teacher);await account(p,d,true);
  try {
    let row=await account(p,d,true);await p.rowAction(row,/^Khóa$|^Lock$/);await p.acceptOptionalConfirm();
    const locked=await waitApi(()=>readUser(d,d.teacher),x=>x.status==='LOCKED');
    row=await account(p,d,true);await guardUser(d,d.teacher);await p.rowAction(row,/Mở khóa|Unlock/);await p.acceptOptionalConfirm();
    const active=await waitApi(()=>readUser(d,d.teacher),x=>x.status==='ACTIVE');r.readback={locked,active};
  } finally {await guardUser(d,d.teacher);await d.api.request('admin','PATCH',`/admin/users/${d.teacher.id}/status`,{status:'ACTIVE'});}
});
test('Teacher form chặn thiếu dữ liệu','Mở form Teacher để trống họ tên/email.','Nút tiếp theo bị khóa; không gửi tạo user.',[],async(p)=>{await p.createForm('teachers');assert.equal(await (await p.button(/^Tiếp theo|^Next/,'main',false)).isEnabled(),false);});
test('Teacher tạo tài khoản qua wizard','Điền dữ liệu QA riêng, qua từng bước và hoàn tất.','API có tài khoản đúng email, họ tên và role TEACHER.',[],async(p,d,r)=>{r.readback=await createPerson(p,d,'teachers');});
test('Teachers tìm và mở hồ sơ QA','Tìm email Teacher QA và bấm Xem chi tiết đúng thẻ.','URL đúng ID; hồ sơ đúng email và họ tên.', ['teacher'],async(p,d)=>{
  await p.nav('teachers');await p.search(d.teacher.email);await p.button(/^Xem chi tiết$|^View Details$/);await p.ready();assert.equal(new URL(await p.driver.getCurrentUrl()).pathname,`/admin/teachers/${d.teacher.id}`);await p.assertIdentity(d.teacher);
});
test('Student form chặn thiếu dữ liệu','Mở form Student để trống tên/email.','Nút tiếp theo bị khóa.',[],async(p)=>{await p.createForm('students');assert.equal(await (await p.button(/^Tiếp theo|^Next/,'main',false)).isEnabled(),false);});
test('Student tạo tài khoản qua wizard','Điền tài khoản QA mới; qua các bước staging; hoàn tất không chọn lớp.','API có STUDENT đúng email/họ tên.',[],async(p,d,r)=>{r.readback=await createPerson(p,d,'students');});
test('Students tìm học viên QA mới','Tìm email Student QA được tạo trong setup.','Một dòng chính xác; không nhầm học viên khác.', ['student'],async(p,d,r)=>{r.readback=await readUser(d,d.student);await p.nav('students');await p.search(d.student.email);await p.exactRow(d.student.email);});
test('Classes tìm và mở đúng lớp QA','Tìm theo tên đầy đủ rồi bấm Quản lý lớp.','Đúng ID, tên lớp, teacher/member từ API.', ['baseClass'],async(p,d,r)=>{await p.openClass(d.baseClass);r.readback=await d.api.get('admin',`/classes/${d.baseClass.id}`);assert.ok((await p.text()).includes(d.teacher.name));});
test('Classes tìm không tồn tại','Tìm tên lớp ngẫu nhiên.','Hiện trạng thái không có lớp; không có nút quản lý lớp.',[],async(p)=>{await p.nav('classes');await p.search('QA31-Missing-'+Date.now());assert.match(await p.text(),/Không tìm thấy|Không có lớp|No .*found/i);assert.doesNotMatch(await p.text(),/^Quản lý lớp$/m);});
test('Tạo lớp chặn thiếu tên','Mở tạo lớp, để tên trống.','Không thể hoàn tất tạo lớp khi thiếu tên.',[],async(p)=>{
  await p.createForm('classes');const name=await p.field(/Tên lớp học đầy đủ|Full Class Title/);assert.equal(await name.getAttribute('value'),'');
  // Some builds allow moving between steps, but the final submit must be disabled.
  for(let n=0;n<3;n++){const submits=await p.driver.findElements(By.css('main button[type=submit]'));for(const b of submits)if(await b.isDisplayed()){assert.equal(await b.isEnabled(),false);return;}const next=await p.button(/^Tiếp theo|^Next/,'main',false);if(!await next.isEnabled())return;await p.clickElement(next,'Đi tiếp với tên trống');await p.ready();}assert.fail('Không xác minh được chặn tạo lớp');
});
test('Tạo lớp qua đủ các bước','Nhập tên QA, ngày khai giảng, chọn Teacher QA, hoàn tất wizard.','API lưu đúng tên, level và teacherId; mở được lớp mới.', ['teacher'],async(p,d,r)=>{
  await p.createForm('classes');const name=`QA31-UI-Class-${d.tag}`;await p.fill(await p.field(/Tên lớp học đầy đủ|Full Class Title/),name);const level='Trung cấp (B1-B2)';await p.select(await p.field(/Trình độ|Course Level/),level);
  const start=await p.field(/Ngày bắt đầu|Start Date/);assert.ok(await start.getAttribute('value'),'Ngày bắt đầu mặc định chưa được khởi tạo');
  await p.next();await p.select(await p.field(/Giáo viên phụ trách chính|Primary Instructor/),d.teacher.id);await p.next();await p.clickElement(await p.visible(By.css('main button[type=submit]')),'Tạo lớp QA');
  await p.driver.wait(async()=>new URL(await p.driver.getCurrentUrl()).pathname==='/admin/classes',p.config.timeout);
  const result=await waitApi(()=>d.api.get('admin','/classes?limit=100'),x=>x.data?.some(c=>c.name===name));const c=result.data.find(c=>c.name===name);d.ledger.push({kind:'class',id:c.id,name});r.readback=await d.api.get('admin',`/classes/${c.id}`);assert.equal(r.readback.level,level);assert.equal(r.readback.teacherId??r.readback.teacher?.id,d.teacher.id);await p.openClass({id:c.id,name});
});
test('Danh sách học viên trong lớp đối chiếu API','Mở lớp QA đã ghi danh một Student QA.','UI hiển thị đúng tên; API membership đúng studentId.', ['baseClass'],async(p,d,r)=>{
  await p.openClass(d.baseClass);await p.exactRow(d.student.name);r.readback=await d.api.get('admin',`/classes/${d.baseClass.id}/members`);assert.ok(r.readback.data.some(x=>x.studentId===d.student.id));
});
test('Mở hồ sơ từ học viên trong lớp','Trên đúng dòng roster QA, bấm Hồ sơ.','URL đúng Student ID; hồ sơ đúng email/họ tên, không fallback người khác.', ['baseClass'],async(p,d,r)=>{
  r.readback=await readUser(d,d.student);
  await p.openClass(d.baseClass);await p.rowAction(await p.exactRow(d.student.name),/^Hồ sơ$|^Profile$/);await p.ready();assert.equal(new URL(await p.driver.getCurrentUrl()).pathname,`/admin/students/${d.student.id}`);await p.assertIdentity(d.student);
});
test('Admin xem nội dung bài tập trong lớp','Mở lớp QA, tab Bài tập & Điểm số; kiểm tra bài đã PUBLISHED.','Bài PUBLISHED QA xuất hiện đúng tiêu đề; nếu Admin API trả 403 cần review contract quyền.', ['content'],async(p,d,r)=>{
  r.readback={fixture:d.content};
  await p.openClass(d.baseClass);await p.button(/^Bài tập & Điểm số|Assignments/);await p.ready();
  r.readback.adminAssignments=await d.api.get('admin',`/classes/${d.baseClass.id}/assignments`);
  assert.ok(r.readback.adminAssignments.data?.some(a=>a.id===d.content.id),'API class assignments mismatch');
  assert.ok((await p.text()).includes(d.content.title),'Không thấy nội dung QA đã publish');
});
test('Lưu cài đặt lớp và kiểm tra bền vững','Mở lớp QA riêng, đổi mô tả; lưu, rời trang và mở lại.','API và textarea sau mở lại cùng chứa mô tả mới.', ['editClass'],async(p,d,r)=>{
  await guardClass(d,d.editClass);await p.openClass(d.editClass);await p.button(/^Cài đặt lớp học|Class Settings/);const description=`QA31 updated description ${d.tag}`;await p.fill(await p.field(/Mô tả|Description/),description);await p.button(/^Lưu|^Save/);r.readback=await waitApi(()=>d.api.get('admin',`/classes/${d.editClass.id}`),x=>x.description===description);await p.openClass(d.editClass);await p.button(/^Cài đặt lớp học|Class Settings/);assert.equal(await (await p.field(/Mô tả|Description/)).getAttribute('value'),description);
});
test('Kho lưu trữ tìm lớp COMPLETED','Mở kho qua nút UI, tìm đúng lớp QA hoàn thành.','Lớp QA xuất hiện, trạng thái API COMPLETED.', ['archiveClass'],async(p,d,r)=>{
  await p.nav('classes');await p.button(/Kho Lưu Trữ|Archive/);await p.ready();await p.search(d.archiveClass.name);await p.exactRow(d.archiveClass.name);r.readback=await d.api.get('admin',`/classes/${d.archiveClass.id}`);assert.equal(r.readback.status,'COMPLETED');
});
test('Mở lại lớp đã hoàn thành qua UI','Trên dòng đúng lớp QA archive, bấm mở lại và xác nhận.','API ACTIVE; lớp tìm được ở danh sách lớp.', ['archiveClass'],async(p,d,r)=>{
  await guardClass(d,d.archiveClass);await p.nav('classes');await p.button(/Kho Lưu Trữ|Archive/);await p.ready();await p.search(d.archiveClass.name);await p.rowAction(await p.exactRow(d.archiveClass.name),/^Mở lại(?: lớp học)?$|^Restore$|Reopen Class/);await p.acceptOptionalConfirm();r.readback=await waitApi(()=>d.api.get('admin',`/classes/${d.archiveClass.id}`),x=>x.status==='ACTIVE');await p.openClass(d.archiveClass);
});
test('Reports lọc chính xác lớp QA, đối chiếu số liệu','Chọn classId QA trong bộ lọc; đối chiếu đúng dòng với /reports/classes.','Tên, số bài, điểm trung bình và tỷ lệ nộp khớp API.', ['baseClass'],async(p,d,r)=>{
  await p.nav('reports');await p.selectContainingValue(d.baseClass.id,/Tất cả lớp|All Classes/i);await p.ready();
  const row=await p.exactRow(d.baseClass.name);const list=await d.api.get('admin','/reports/classes?page=1&limit=100');const c=list.data.find(x=>x.classId===d.baseClass.id);assert.ok(c);
  r.readback=c;r.uiCells=await Promise.all((await row.findElements(By.css('td'))).map(async cell=>(await cell.getText()).trim()));
  r.filteredRowCount=(await p.rows()).length;
  assertReportClassCells(r.uiCells,c);
  assert.equal(r.filteredRowCount,1,'Class filter must show only the selected class');
});
test('Reports lọc giáo viên QA','Chọn đúng teacherId QA.','Chỉ hiển thị các lớp từ API reports/classes của giáo viên đó.', ['baseClass'],async(p,d,r)=>{
  await p.nav('reports');await p.selectContainingValue(d.teacher.id,/Tất cả giáo viên|Tất cả giảng viên|All Teachers/i);await p.ready();const list=await d.api.get('admin',`/reports/classes?teacherId=${d.teacher.id}&page=1&limit=100`);assert.ok(list.data.some(c=>c.classId===d.baseClass.id));const rows=await p.rows();requireRows(rows);for(const row of rows){const text=await row.getText();assert.ok(list.data.some(c=>text.includes(c.className)),'Report row outside selected teacher');}r.readback=list;
});
test('Reports mở chi tiết tiến độ lớp QA','Lọc lớp, bấm Chi tiết đúng dòng; đọc bốn ô số liệu theo nhãn.','Sĩ số, đã có điểm, tỷ lệ hoàn thành và dưới trung bình khớp từng trường API.', ['baseClass'],async(p,d,r)=>{
  await p.nav('reports');await p.selectContainingValue(d.baseClass.id,/Tất cả lớp|All Classes/i);await p.ready();await p.rowAction(await p.exactRow(d.baseClass.name),/^Chi tiết$|^Details$/);await p.drawerReady();
  r.readback=await d.api.get('admin',`/reports/classes/${d.baseClass.id}/progress`);
  assert.doesNotMatch(await p.text('.adm-drawer'),/không có quyền|Không thể tải|Failed/i);
  r.uiMetrics={totalStudentCount:await p.metric(/^Sĩ số$|^Cohort Size$/),scoredStudentCount:await p.metric(/^Đã có điểm$|^Graded$/),completionRatePercent:await p.metric(/^Tỷ lệ hoàn thành$|^Completion$/),belowAverageCount:await p.metric(/^Dưới trung bình$|^Below Avg$/)};
  assertProgressMetrics(r.uiMetrics,r.readback);
});
test('Reports xóa bộ lọc','Chọn lớp QA rồi Xóa bộ lọc.','Class và Teacher select trở về giá trị rỗng/ALL.', ['baseClass'],async(p,d)=>{
  await p.nav('reports');await p.selectContainingValue(d.baseClass.id,/Tất cả lớp|All Classes/i);await p.ready();await p.button(/^Xóa bộ lọc$|^Reset Filters$/);await p.ready();for(const s of await p.driver.findElements(By.css('main select')))assert.ok(['','ALL','all'].includes(await s.getAttribute('value')));
});
test('Audit tìm mã chấm điểm và đối chiếu API','Tìm grading QA đã chấm 8 điểm; kiểm tra ID, status và điểm đúng ô.','Một dòng đúng ID, finalScore/status khớp API; Admin không sửa grading.',['audit'],async(p,d,r)=>{
  const list=await d.api.get('admin','/gradings?limit=100');const g=list.data?.find(x=>x.id===d.audit.id);r.readback={fixture:d.audit,grading:g};assert.ok(g,'Admin list thiếu grading QA');
  await p.nav('audit/gradings');await p.search(`GR-${g.id}`);const row=await p.gradingRow(g.id);const cells=await row.findElements(By.css('td'));assertGradingCells(await Promise.all(cells.map(async c=>(await c.getText()).trim())),g);
});
test('Audit tìm mã không tồn tại','Tìm GR-999999999999.','Không có dòng grading; trạng thái rỗng rõ ràng.',[],async(p)=>{
  await p.nav('audit/gradings');await p.search('GR-999999999999');assert.match(await p.text(),/Không tìm thấy|Không có.*(bản ghi|kết quả|dữ liệu)|No .*found/i);
});
test('Audit chi tiết và lịch sử sửa điểm','Mở grading QA có lịch sử sửa 7.5 thành 8; đối chiếu điểm và từng dòng log.','Admin đọc được detail/logs; lịch sử không rỗng, đúng điểm cũ/mới/ghi chú trên cùng dòng.',['audit'],async(p,d,r)=>{
  const g=d.audit;r.readback={fixture:g};await p.nav('audit/gradings');await p.search(`GR-${g.id}`);await p.rowAction(await p.gradingRow(g.id),/Xem lịch sử sửa điểm|Audit Logs/);await p.drawerReady();
  // Read both endpoints independently: detail 403 must not hide a successful logs response.
  const results=await Promise.allSettled([d.api.get('admin',`/gradings/${g.id}`),d.api.get('admin',`/gradings/${g.id}/change-logs`)]);
  for(const [i,key] of ['detail','logs'].entries())r.readback[key]=results[i].status==='fulfilled'?results[i].value:{error:results[i].reason.message,status:results[i].reason.status};
  for(const result of results)if(result.status==='rejected')throw result.reason;
  const {detail,logs}=r.readback;assert.equal(detail.id,g.id);assert.equal(detail.finalScore,g.newScore);
  assert.equal(await p.metric(/^Điểm chốt hiện tại$|^Final Score$/),String(detail.finalScore));
  assert.ok((await p.text('.adm-drawer')).includes(`GR-${g.id}`));
  const rows=await p.rows('.adm-drawer');const cells=await Promise.all(rows.map(async row=>Promise.all((await row.findElements(By.css('td'))).map(async c=>(await c.getText()).trim()))));
  assertAuditLogs(cells,Array.isArray(logs)?logs:logs.data,g);
});
test('Settings hồ sơ Admin chỉ đọc','Mở settings; kiểm tra email của Admin đăng nhập.','Email hiển thị đúng; không lưu hồ sơ hoặc đổi mật khẩu.',[],async(p,d)=>{
  await p.nav('settings');const mail=await p.visible(By.css('main input[type=email]'));assert.equal(await mail.getAttribute('value'),d.api.config.users.admin.email);
});
test('Settings bảo mật có trường mật khẩu','Bấm tab Bảo mật tài khoản, không điền/gửi.','Có input password được che; không gửi đổi mật khẩu.',[],async(p)=>{
  await p.nav('settings');await p.button(/^Bảo mật tài khoản$|^Account Security$/);await p.ready();const fields=await p.driver.findElements(By.css('main input[type=password]'));assert.ok(fields.length>=2);for(const f of fields)assert.equal(await f.getAttribute('value'),'');
});

test('Teacher từ chối tên chứa chữ số','Nhập tên QA Invalid 123 và email QA hợp lệ; bấm Tiếp theo.','Giữ bước thông tin và báo lỗi họ tên; không tạo tài khoản.',[],async(p,d)=>{
  await p.createForm('teachers');await p.fill(await p.field(/Họ và tên|Full Name/i),'QA Invalid 123');await p.fill(await p.visible(By.css('main input[type=email]')),`qa31-${d.tag}-invalid@example.invalid`);await p.next();
  assert.ok((await p.driver.findElements(By.css('main input[type=email]'))).length,'Tên không hợp lệ vẫn được qua bước');assert.match(await p.text(),/chữ cái|không.*(số|hợp lệ)|letters|invalid.*name/i);
});
test('Student từ chối email sai định dạng','Nhập tên QA hợp lệ và email sai định dạng; bấm Tiếp theo.','Không tạo được tài khoản; lỗi email hoặc native validity được ghi nhận.',[],async(p,d,r)=>{
  const email=`qa31-${d.tag}-bad-address`;
  await p.createForm('students');await p.fill(await p.field(/Họ và tên|Full Name/i),d.names.student);const mail=await p.visible(By.css('main input[type=email]'));await p.fill(mail,email);
  await p.fill(await p.visible(By.css('main input[type=password]')),d.password,'Nhập mật khẩu QA hợp lệ để cô lập lỗi email');
  const invalid=await p.driver.executeScript('return !arguments[0].validity.valid',mail);assert.equal(invalid,true,'Input không phát hiện email sai định dạng');
  const assertRejected=async(nativeMessage='')=>{
    const formError=await p.validationErrors();
    const result=await d.api.get('admin',`/admin/users?q=${encodeURIComponent(email)}&limit=100`);
    assertAccountRejected({email,pathname:new URL(await p.driver.getCurrentUrl()).pathname,formError,nativeMessage,users:result.data});
    r.readback={email,formError,nativeMessage,matchingAccounts:result.data.filter(u=>u.email===email)};
  };
  await p.next();
  // Wizard may postpone email validation until final submit; use native validation there.
  for(let step=0;step<3;step++) {
    const fields=await p.driver.findElements(By.css('main input[type=email]'));
    if(fields.length){await assertRejected(await fields[0].getAttribute('validationMessage'));return;}
    const final=await p.driver.findElements(By.css('main button[type=submit]'));
    if(final.length){await p.clickElement(final[0],'Kiểm tra từ chối email sai');await p.ready();await assertRejected();return;}
    await p.next();
  }
  assert.fail('Không xác minh được chặn email sai');
});
async function createAccountInAccounts(p,d,r,role) {
  const email=`qa31-${d.tag}-${role.toLowerCase()}-accounts-ui@example.invalid`,name=`QA Accounts ${role} `+d.names.teacher.replace('QA Admin Teacher ','');
  r.readback={requested:{email,fullName:name,role}};
  await p.nav('accounts');await p.button(/Thêm tài khoản mới|Add new account/i);
  await p.visible(By.css('.adm-drawer'));
  await p.fill(await p.field(/HỌ VÀ TÊN|Họ và tên|Full Name/i),name);
  await p.fill(await p.visible(By.css('.adm-drawer input[type=email]')),email);
  await p.fill(await p.visible(By.css('.adm-drawer input[type=password]')),d.password,'Nhập mật khẩu QA, không ghi giá trị');
  const roles=[];
  for(const s of await p.driver.findElements(By.css('.adm-drawer select')))for(const o of await s.findElements(By.css('option')))if(await o.getAttribute('value')===role){roles.push(s);break;}
  assert.equal(roles.length,1,`Form tạo tài khoản không cung cấp đúng lựa chọn ${role}`);
  await p.select(roles[0],role);assert.equal(await roles[0].getAttribute('value'),role);
  await p.clickElement(await p.visible(By.css('.adm-drawer button[type=submit]')),`Lưu tài khoản đã chọn ${role}`);
  const observed=await waitApi(async()=>{
    const list=await d.api.get('admin',`/admin/users?q=${encodeURIComponent(email)}&limit=100`);
    const alerts=[];for(const e of await p.driver.findElements(By.css('.adm-drawer .adm-alert-error,.adm-drawer [role=alert]')))if(await e.isDisplayed())alerts.push(await e.getText());
    return {user:list.data?.find(u=>u.email===email),error:alerts.join('\n')};
  },x=>!!x.user||!!x.error);
  r.readback.actual=observed;
  if(observed.user)d.ledger.push({kind:'ui-user',id:observed.user.id,email,role:observed.user.role});
  assert.ok(observed.user,`Không tạo được tài khoản đã chọn ${role}: ${observed.error}`);
  assert.equal(observed.user.fullName,name);assert.equal(observed.user.email,email);
  assert.equal(observed.user.role,role,`Chọn ${role} nhưng tài khoản được tạo mang vai trò khác`);
}
test('Accounts tạo Admin phải lưu đúng vai trò ADMIN','Tạo qua drawer Accounts, chọn ADMIN và đối chiếu role bằng API.','Có tài khoản đúng email/họ tên với role ADMIN; không âm thầm tạo STUDENT.',[],async(p,d,r)=>createAccountInAccounts(p,d,r,'ADMIN'));
test('Accounts tạo Teacher phải lưu đúng vai trò TEACHER','Tạo Teacher qua drawer Accounts và đối chiếu API.','Có tài khoản đúng email/họ tên, role TEACHER; không chỉ kiểm tra toast.',[],async(p,d,r)=>createAccountInAccounts(p,d,r,'TEACHER'));
test('Accounts tạo Student phải lưu đúng vai trò STUDENT','Tạo Student qua drawer Accounts và đối chiếu API.','Có tài khoản đúng email/họ tên, role STUDENT; không chỉ kiểm tra toast.',[],async(p,d,r)=>createAccountInAccounts(p,d,r,'STUDENT'));
async function searchExistingAccount(p,d,r,section) {
  const role=section==='students'?'&role=STUDENT':'';
  const list=await d.api.get('admin',`/admin/users?page=1&limit=100${role}`);
  const created=new Set(d.ledger.filter(x=>['user','ui-user'].includes(x.kind)).map(x=>Number(x.id)));
  const user=list.data?.find(u=>u.email&&u.fullName&&['TEACHER','STUDENT'].includes(u.role)&&!created.has(Number(u.id)));
  if(!user)throw Object.assign(new Error('Không có tài khoản có sẵn phù hợp; case này không tạo dữ liệu thay thế'),{code:'QA31_FIXTURE'});
  r.readback={selection:'Tài khoản có sẵn trong tập dữ liệu trang đầu, không do run hiện tại tạo; chỉ kiểm tra search cơ bản, không chứng minh search toàn bộ DB',user};
  await p.nav(section);
  for(const keyword of [user.email,user.fullName]) {
    await p.search(keyword);
    const row=await p.exactRow(user.email),text=await row.getText();
    assert.ok(text.includes(user.email)&&text.includes(user.fullName),'Kết quả search không khớp tài khoản có sẵn');
  }
}
test('Accounts tìm tài khoản có sẵn độc lập bước tạo','Chọn tài khoản không thuộc ledger run rồi tìm email và họ tên bằng UI.','Tìm được đúng tài khoản có sẵn; không tạo/sửa/khóa tài khoản.',[],async(p,d,r)=>searchExistingAccount(p,d,r,'accounts'));
test('Students tìm học viên có sẵn độc lập bước tạo','Chọn Student không thuộc ledger run rồi tìm email và họ tên bằng UI.','Tìm được đúng Student có sẵn; không phụ thuộc wizard hoặc API tạo tài khoản.',[],async(p,d,r)=>searchExistingAccount(p,d,r,'students'));
test('Students khóa rồi mở khóa QA từ danh sách','Tìm đúng Student QA, khóa/mở khóa và đối chiếu API/UI sau reload.','Đúng user chuyển LOCKED rồi ACTIVE; không tìm thấy QA thì Blocked, không dùng người khác.',['student'],async(p,d,r)=>studentStatus(p,d,r,'list'));
test('Student profile khóa rồi mở khóa đúng danh tính QA','Mở hồ sơ từ roster, xác minh URL/email/tên trước mọi thao tác.','Đúng QA chuyển LOCKED/ACTIVE; hồ sơ sai người thì Blocked trước mutation.',['baseClass'],async(p,d,r)=>studentStatus(p,d,r,'profile'));
test('Reports lọc ngày có chứa bài QA đã chấm','Chọn Teacher/lớp QA, đặt khoảng ngày chứa bài đã nộp, so API và UI.','Bài 8/10 được tính 80%/100%, KPI và dòng lớp khớp API có from/to.',['audit'],async(p,d,r)=>reportDates(p,d,r,'include'));
test('Reports lọc ngày tương lai loại bài QA hiện tại','Đặt khoảng ngày tương lai trên lớp có bài QA đã chấm hôm nay.','Không tính bài hiện tại: điểm/tỷ lệ 0; UI khớp API theo khoảng ngày.',['audit'],async(p,d,r)=>reportDates(p,d,r,'exclude'));
test('Reports reset cả ngày Teacher và lớp','Đặt hai ngày và hai select, bấm Xóa bộ lọc, đối chiếu KPI không lọc.','Hai ngày rỗng, select mặc định; KPI theo API overview không filter.',['baseClass'],resetAllReportFilters);
test('Audit lọc trạng thái COMPLETED','Bấm Đã hoàn tất, xác minh grading QA và mọi dòng đang hiển thị.','Có GR QA; mọi dòng đúng COMPLETED/điểm/API, không Pass vì bảng rỗng.',['audit'],async(p,d,r)=>auditStatus(p,d,r,'COMPLETED'));
test('Audit lọc trạng thái PENDING','Đọc tập PENDING có sẵn rồi bấm Chờ duyệt và đối chiếu ID/status/score.','Có dữ liệu đúng PENDING; không có dữ liệu tiền điều kiện thì Blocked.',[],async(p,d,r)=>auditStatus(p,d,r,'PENDING'));
test('Admin truy cập được cấu hình hệ thống FE23','Vào Cài đặt, kiểm tra Writing model và nút lưu/khôi phục cấu hình.','Có form cấu hình hệ thống; form hồ sơ cá nhân không thay thế yêu cầu FE23.',[],systemSettingsAvailable);
test('Cấu hình hệ thống lưu sau reload và reset','Trong browser QA đổi model, lưu, reload, reset và khôi phục ban đầu.','Model giữ sau reload; Reset về mặc định. Thiếu form thì Blocked phụ thuộc 048.',[],systemSettingsPersistence);
test('Xác định điểm vào quản lý nội dung Admin','Khảo sát entry nội dung Admin, phân biệt thiếu đặc tả với lỗi chức năng.','Entry đã nhận diện tải đúng role; chưa xác định luồng thì Blocked/SCOPE_REVIEW, không kết luận thiếu chức năng từ sidebar.',[],contentEntry);
export const adminCases=cases;
