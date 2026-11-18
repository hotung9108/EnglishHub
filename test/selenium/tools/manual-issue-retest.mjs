import assert from 'node:assert/strict';
import { mkdir,writeFile,readFile,readdir } from 'node:fs/promises';
import { join,resolve } from 'node:path';
import { randomBytes,createHash } from 'node:crypto';
import { Builder,By } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import '../config/runtime.js';
import { FixturePool } from '../common/fixtures/pool.js';
import { UI } from '../common/ui/ui.js';
import { redact } from '../common/runner/core.js';
import { observerScript } from '../common/runner/browser-observer.js';
import { start,answer,submit,attempts } from '../common/flows/support/student/attempts.js';
import { openAssignment } from '../common/flows/support/teacher/assignments.js';

const out=resolve(process.env.MANUAL_PROBES_OUTPUT||'reports/manual-probes-20261116');
const selected=new Set(process.argv.slice(2));
await mkdir(out,{recursive:true});
const secrets=Object.entries(process.env).filter(([k])=>/PASSWORD|TOKEN|SECRET/.test(k)).map(([,v])=>v);
const pool=new FixturePool({apiBase:'https://api-staging.hotung9108.me/api/v1',admin:{email:process.env.SELENIUM_ADMIN_EMAIL,password:process.env.SELENIUM_ADMIN_PASSWORD},output:out,secrets});
const run={startedAt:new Date().toISOString(),baseUrl:'https://staging.hotung9108.me',apiBase:pool.base,results:[],scope:'Manual BUG-01..27; BUG-28 excluded by user',suiteSha256:createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex')};
let driver,ui,current;
const ctx={pool,baseUrl:run.baseUrl,test:{id:'MANUAL'},evidence:async(name,value)=>save(name,value),step:async(name,fn)=>{current.steps.push(name);return fn();}};
const safe=value=>redact(value,secrets);
async function save(name,value){const file=join(current.dir,`${name}.json`);await writeFile(file,JSON.stringify(safe(value),null,2));return file;}
async function flush(){await writeFile(join(out,'summary.json'),JSON.stringify(safe(run),null,2));}
async function capture(name='screen'){
  if(!driver)return;
  try{
    current.url=await driver.getCurrentUrl();
    const snapshot=await driver.executeScript(`return {text:document.body.innerText,actions:Array.from(document.querySelectorAll('main button,main a')).filter(e=>e.getClientRects().length).map(e=>({text:e.innerText,title:e.title,disabled:e.disabled,href:e.getAttribute('href')})),fields:Array.from(document.querySelectorAll('main input,main select,main textarea')).filter(e=>e.getClientRects().length).map(e=>({tag:e.tagName,type:e.type,placeholder:e.placeholder,readOnly:e.readOnly,min:e.min,max:e.max,maxLength:e.maxLength})),network:window.__srsNetwork||[],errors:window.__srsErrors||[]}`);
    await save(name,snapshot);
    await writeFile(join(current.dir,`${name}.png`),await driver.takeScreenshot(),'base64');
  }catch(e){current.captureError=e.name;}
}
async function probe(id,bugs,steps,fn){
  if(selected.size&&!selected.has(id))return;
  current={id,bugs,startedAt:new Date().toISOString(),steps,dir:join(out,id),status:'RUNNING'};
  await mkdir(current.dir,{recursive:true});
  const startIndex=pool.events.length;
  try{const result=await fn();Object.assign(current,result);if(!current.status||current.status==='RUNNING')current.status='OBSERVED';}
  catch(e){current.status='BLOCKED';current.error=safe(String(e.message));}
  await capture();
  current.apiEvents=pool.events.slice(startIndex);
  await save('result',current);
  current.finishedAt=new Date().toISOString();run.results.push(current);await flush();
  console.log(`${id} ${current.status}: ${current.conclusion||current.error||''}`);
}
async function login(role){await ui.login(role);await ui.ready();}
async function page(route){await ui.open(route);await ui.ready();}
async function detail(user,type){await page(`/admin/${type}/${user.id}`);await ui.has(new RegExp(user.fullName));}
async function controls(){return driver.executeScript(`return Array.from(document.querySelectorAll('main button,main a')).filter(e=>e.getClientRects().length).map(e=>({text:e.innerText.trim(),title:e.title,href:e.getAttribute('href')}))`);}
async function clickIf(pattern,scope='main'){
  for(const el of await driver.findElements(By.css(`${scope} button,${scope} a`)))if(await el.isDisplayed()&&pattern.test((await el.getText()).trim()||await el.getAttribute('title')||'')){await el.click();return true;}
  return false;
}
async function waitNetwork(path,method){await driver.wait(async()=>await driver.executeScript('return (window.__srsNetwork||[]).some(x=>x.path.endsWith(arguments[0])&&x.method===arguments[1])',path,method),10000);}
async function getUser(id){return pool.get('admin',`/admin/users/${id}`);}
async function registerCreated(response,payload,type='user'){
  const id=type==='user'?response.data.user?.id:response.data.id;
  if(response.status>=200&&response.status<300&&id){pool.resources.push({type,id,...(type==='user'?{email:payload.email,fullName:payload.fullName,role:payload.role}:{name:payload.name,teacherId:payload.teacherId}),state:'CREATED'});await pool.journal();}
}
try{
  await pool.init();
  const options=new chrome.Options().addArguments('--headless=new','--window-size=1440,1000','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream');
  driver=await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  ctx.driver=driver;ui=new UI(ctx);ui.timeout=10000;
  await driver.manage().setTimeouts({implicit:0,pageLoad:25000,script:30000});
  await driver.sendDevToolsCommand('Page.addScriptToEvaluateOnNewDocument',{source:observerScript});
  await driver.get(run.baseUrl);
  run.frontend=await driver.executeScript('return Array.from(document.scripts).map(x=>x.src).filter(Boolean)');
  for(const src of run.frontend.filter(x=>x.startsWith(run.baseUrl)))try{const r=await fetch(src);run.bundleHashes??=[];run.bundleHashes.push({url:src,status:r.status,sha256:createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex')});}catch{}
  await probe('reset-student',['BUG-01'],['Admin mở hồ sơ học viên fixture → Bảo mật → Đặt lại mật khẩu.','Nhập mật khẩu mới hợp lệ, bấm Xác nhận.','Đọc request cập nhật; thử đăng nhập API bằng mật khẩu mới và mật khẩu cũ.'],async()=>{
    const target=await pool.createUser('STUDENT','ResetTarget');const newPass=`NewQa${randomBytes(8).toString('hex')}9A!`;secrets.push(newPass);
    await login('admin');await detail(target,'students');await clickIf(/Bảo mật|Security/i);await ui.button(/Cấp lại mật khẩu|Đặt lại mật khẩu|Reset Password/i);await ui.fill('input[type=password]',newPass);await ui.button(/^Xác nhận$|^Confirm$/i,'form');
    await waitNetwork(`/admin/users/${target.id}`,'PUT');
    await capture('reset-success');
    const fresh=await pool.request(null,'POST','/auth/login',{email:target.email,password:newPass},{allowError:true});
    const old=await pool.request(null,'POST','/auth/login',{email:target.email,password:target.password},{allowError:true});
    return{status:fresh.status===200?'NOT_REPRODUCED':'REPRODUCED',actual:{targetId:target.id,email:target.email,newCredentialStatus:fresh.status,oldCredentialStatus:old.status,uiText:await ui.text()},conclusion:`Đã bấm reset và ghi phản hồi UI/API; đăng nhập mật khẩu mới HTTP ${fresh.status}, mật khẩu cũ HTTP ${old.status}. Không mặc định UI báo thành công.`};
  });
  await probe('reset-teacher',['BUG-01'],['Admin mở hồ sơ giáo viên fixture → Bảo mật.','Nhập mật khẩu mới hợp lệ, bấm Lưu mật khẩu mới.','Thử đăng nhập bằng mật khẩu mới và cũ.'],async()=>{
    const target=await pool.createUser('TEACHER','ResetTeacher');const pass=`NewQa${randomBytes(8).toString('hex')}9A!`;secrets.push(pass);
    await login('admin');await detail(target,'teachers');await clickIf(/Bảo mật|Security/i);await ui.fill('input[type=password]',pass);await ui.button(/Lưu mật khẩu mới|Update Password/i);await waitNetwork(`/admin/users/${target.id}`,'PUT');await capture('reset-response');
    const fresh=await pool.request(null,'POST','/auth/login',{email:target.email,password:pass},{allowError:true});const old=await pool.request(null,'POST','/auth/login',{email:target.email,password:target.password},{allowError:true});
    return{status:fresh.status===200?'NOT_REPRODUCED':'REPRODUCED',actual:{targetId:target.id,email:target.email,newCredentialStatus:fresh.status,oldCredentialStatus:old.status},conclusion:`Mật khẩu mới HTTP ${fresh.status}; cũ HTTP ${old.status}.`};
  });
  await probe('teacher-specialization',['BUG-02'],['Admin đặt specialization khác TESOL/IELTS cho giáo viên fixture qua API.','Mở danh sách Giáo viên, tìm đúng email fixture, đối chiếu chuyên môn hiển thị với API.','Mở hồ sơ cá nhân của Giáo viên, xem trường chuyên môn có sửa được không.'],async()=>{
    const value=`Business English ${pool.prefix}`;await pool.request('admin','PUT',`/admin/users/${pool.users.teacher.id}`,{specialization:value});const actual=await getUser(pool.users.teacher.id);
    await login('admin');await page('/admin/teachers');await ui.fill('main input.adm-search-input',pool.users.teacher.email);await ui.has(new RegExp(pool.users.teacher.fullName));const text=await ui.text();await capture('teacher-list');
    await login('teacher');await page('/teacher/profile');const fields=await driver.executeScript('return Array.from(document.querySelectorAll("main input")).filter(x=>x.value===arguments[0]).map(x=>({readOnly:x.readOnly,disabled:x.disabled}))',value);
    return{status:text.includes(value)?'NOT_REPRODUCED':'REPRODUCED',actual:{teacherId:pool.users.teacher.id,api:actual,uiContainsActualSpecialization:text.includes(value),uiContainsTesol:text.includes('TESOL'),uiContainsIelts:text.includes('IELTS 8.0+'),profileFields:fields},conclusion:text.includes(value)?'Danh sách hiển thị chuyên môn thật.':'Danh sách không hiển thị chuyên môn fixture; kiểm ảnh/badge TESOL/IELTS. Quyền GV tự sửa là yêu cầu riêng.'};
  });
  await probe('edit-profile-controls',['BUG-03'],['Admin mở đúng hồ sơ học viên và giáo viên fixture.','Ghi toàn bộ nút/link thao tác hiển thị để xác định đường chỉnh sửa.'],async()=>{
    await login('admin');const results=[];
    for(const [type,user] of [['students',pool.users.student],['teachers',pool.users.teacher]]){await detail(user,type);const actions=await controls();results.push({type,id:user.id,actions,edit:actions.filter(x=>/Chỉnh sửa|Sửa thông tin|Edit Profile|^Edit$/i.test(x.text||x.title))});await capture(type);}
    return{status:results.every(x=>x.edit.length)?'NOT_REPRODUCED':'REPRODUCED',actual:results,conclusion:'Đã ghi nút ở hai hồ sơ; thiếu đường sửa được xác nhận trong phạm vi màn chi tiết đã mở, chưa khẳng định mọi đường toàn hệ thống.'};
  });
  await probe('username-contract',['BUG-04'],['Admin tạo hai tài khoản fixture có email khác nhau và cùng trường username bổ sung.','Đọc lại tài khoản, kiểm trường username có thực sự được hỗ trợ/lưu hay không.'],async()=>{
    const results=[];const username=`qa${Date.now()}`;
    for(let i=0;i<2;i++){const password=`QaA9!${randomBytes(10).toString('hex')}`;secrets.push(password);const payload={fullName:'Manual Username Tester',email:`${pool.prefix}-uname${i}@example.invalid`.toLowerCase(),password,role:'STUDENT',username};const r=await pool.request('admin','POST','/admin/users',payload,{allowError:true});await registerCreated(r,payload);results.push({status:r.status,id:r.data.user?.id,detail:r.data.user?.id?await getUser(r.data.user.id):r.data});}
    return{status:'NEEDS_SPEC',actual:{username,results},conclusion:'Kiểm hợp đồng username riêng: nếu response không lưu username thì hai POST 2xx không chứng minh có hai username trùng. Cần chốt định danh độc lập.'};
  });
  await probe('student-code',['BUG-05'],['Admin mở form thêm học viên, xem mã có cho nhập tay.','Đặt cùng studentCode cho hai học viên fixture khác email; đọc lại dữ liệu.'],async()=>{
    await login('admin');await page('/admin/students/create');await capture('student-create');
    const code=`QA${Date.now()}`;const a=await pool.createUser('STUDENT','CodeOne');const b=await pool.createUser('STUDENT','CodeTwo');const one=await pool.request('admin','PUT',`/admin/users/${a.id}`,{studentCode:code},{allowError:true});const two=await pool.request('admin','PUT',`/admin/users/${b.id}`,{studentCode:code},{allowError:true});
    return{status:two.status>=400?'NOT_REPRODUCED':'OBSERVED',actual:{code,firstStatus:one.status,secondStatus:two.status,first:await getUser(a.id),second:await getUser(b.id)},conclusion:`Mã nhập tay chưa tự là lỗi. Gán mã trùng: lần đầu HTTP ${one.status}, lần hai HTTP ${two.status}; đối chiếu dữ liệu đọc lại trước kết luận.`};
  });
  await probe('teacher-locked-badge',['BUG-06'],['Admin khóa giáo viên fixture; xác nhận status LOCKED bằng API.','Tìm đúng email tại danh sách giáo viên, ghi nhãn trạng thái.','Mở khóa fixture sau khi kiểm tra.'],async()=>{
    const id=pool.users.outsider.id;try{await pool.request('admin','PATCH',`/admin/users/${id}/status`,{status:'LOCKED'});const api=await getUser(id);await login('admin');await page('/admin/teachers');await ui.fill('main input.adm-search-input',pool.users.outsider.email);await ui.has(new RegExp(pool.users.outsider.fullName));const text=await ui.text();await capture('locked-list');return{status:/Nghỉ phép|On Leave/i.test(text)?'REPRODUCED':'NOT_REPRODUCED',actual:{id,api,text},conclusion:/Nghỉ phép|On Leave/i.test(text)?'API LOCKED nhưng danh sách ghi Nghỉ phép/On Leave.':'Không gặp nhãn Nghỉ phép trong tình huống đã thử.'};}finally{await pool.request('admin','PATCH',`/admin/users/${id}/status`,{status:'ACTIVE'});}
  });
  await probe('assign-locked-teacher',['BUG-07'],['Admin khóa giáo viên fixture.','Gửi POST tạo lớp với teacherId giáo viên LOCKED; đọc lại lớp nếu được tạo.','Gửi PUT đổi teacherId của lớp fixture sang giáo viên LOCKED; đọc lại rồi khôi phục.'],async()=>{
    const id=pool.users.outsider.id;let created;
    try{await pool.request('admin','PATCH',`/admin/users/${id}/status`,{status:'LOCKED'});const payload={name:`${pool.prefix}-LockedClass`,level:'B1',teacherId:id,startDate:'2026-11-16',endDate:'2027-11-16'};const post=await pool.request('admin','POST','/classes',payload,{allowError:true});await registerCreated(post,payload,'class');if(post.data.id)created=await pool.get('admin',`/classes/${post.data.id}`);const put=await pool.request('admin','PUT',`/classes/${pool.class.id}`,{teacherId:id},{allowError:true});const after=await pool.get('admin',`/classes/${pool.class.id}`);return{status:post.status<300||put.status<300?'REPRODUCED':'NOT_REPRODUCED',actual:{teacherId:id,lockedUser:await getUser(id),createStatus:post.status,created,updateStatus:put.status,after},conclusion:`Giáo viên LOCKED: tạo lớp HTTP ${post.status}, đổi phụ trách HTTP ${put.status}; có dữ liệu đọc lại.`};}finally{await pool.request('admin','PATCH',`/admin/users/${id}/status`,{status:'ACTIVE'});await pool.request('admin','PUT',`/classes/${pool.class.id}`,{teacherId:pool.users.teacher.id});}
  });
  await probe('class-code-and-schedule',['BUG-08','BUG-10'],['Admin mở form tạo lớp, ghi ô Mã lớp có cho nhập.','Điền tên fixture, sang bước lịch/giáo viên; ghi bộ chọn lịch, ngày và lỗi trình duyệt.','Không lưu lớp nếu chỉ khảo sát giao diện.'],async()=>{
    await login('admin');await page('/admin/classes/create');await capture('class-step-one');await ui.fill('main form input[type=text]',`${pool.prefix}-Schedule`);await ui.button(/^(Tiếp theo|Tiếp tục|Next|Continue)/i);await ui.ready();await capture('class-step-two');return{status:'OBSERVED',actual:{actions:await controls()},conclusion:'Đã khảo sát form và lịch thật. Cho nhập mã/lưu lịch dạng text không tự là lỗi; thiếu quy tắc mã tự sinh và bước gây crash cụ thể.'};
  });
  await probe('change-class-teacher',['BUG-09'],['Admin mở lớp fixture đã có giáo viên A.','Xem tab Cài đặt và các nút để tìm thao tác đổi giáo viên.','Kiểm tra API PUT đổi sang GV B rồi khôi phục A.'],async()=>{
    await login('admin');await page(`/admin/classes/${pool.class.id}`);await clickIf(/Cài đặt|Settings/i);await ui.ready();const actions=await controls();await capture('class-settings');const put=await pool.request('admin','PUT',`/classes/${pool.class.id}`,{teacherId:pool.users.outsider.id},{allowError:true});const after=await pool.get('admin',`/classes/${pool.class.id}`);await pool.request('admin','PUT',`/classes/${pool.class.id}`,{teacherId:pool.users.teacher.id});return{status:actions.some(x=>/Đổi giáo viên|Change.*(Teacher|Instructor)/i.test(x.text))?'OBSERVED':'REPRODUCED',actual:{classId:pool.class.id,actions,apiStatus:put.status,after},conclusion:'Đã ghi đường UI và kiểm API đổi giáo viên; kết luận thiếu UI chỉ trong màn Cài đặt đã khảo sát.'};
  });
  await probe('teacher-add-student',['BUG-11'],['Giáo viên chủ lớp mở chi tiết lớp của mình.','Chọn Thêm học viên/Chọn học viên có sẵn.','Đọc network tải danh sách ứng viên và nội dung lỗi trên modal.'],async()=>{
    await login('teacher');await page(`/teacher/classes/${pool.class.id}`);await clickIf(/^Quản lý thành viên|Manage Members/i);await ui.ready();await capture('teacher-members');await ui.button(/^(Chọn học viên có sẵn|Thêm học viên(?: vào lớp)?|Thêm học viên có sẵn|Add Student|Select Existing Students)$/i);await driver.wait(async()=>await driver.executeScript('return (window.__srsNetwork||[]).some(x=>x.path.includes("/admin/users"))'),10000);await capture('teacher-picker');const network=await driver.executeScript('return window.__srsNetwork||[]');const req=network.filter(x=>x.path.includes('/admin/users'));return{status:req.some(x=>x.status===403)?'REPRODUCED':'OBSERVED',actual:{teacherId:pool.users.teacher.id,classId:pool.class.id,requests:req},conclusion:req.some(x=>x.status===403)?'Giáo viên chủ lớp gọi /admin/users và nhận 403 khi mở chọn học viên.':'Đã ghi phản hồi thực tế của modal; chưa gặp 403 theo điều kiện đã thử.'};
  });
  await probe('student-picker-pagination',['BUG-12','BUG-13'],['Admin mở chọn học viên trong lớp fixture.','Đọc request tải ứng viên, pagination và ô tìm kiếm; tìm email fixture chưa có trong lớp.','Khảo sát đường chuyển lớp và sức chứa; không tạo hàng trăm tài khoản để giả lập.'],async()=>{
    await login('admin');await page(`/admin/classes/${pool.class.id}`);await ui.button(/^(Chọn học viên có sẵn|Thêm học viên|Thêm học viên có sẵn|Add Student|Select Existing Students)$/i);await driver.wait(async()=>await driver.executeScript('return (window.__srsNetwork||[]).some(x=>x.path.includes("/admin/users"))'),10000);const n=await driver.executeScript('return (window.__srsNetwork||[]).filter(x=>x.path.includes("/admin/users"))');await capture('picker-first-page');const search=await ui.visible('input[placeholder^="Tìm kiếm học viên theo tên"],input[placeholder^="Search by name, email, student ID"]');await search.sendKeys(pool.users.empty.email);await capture('picker-search');return{status:'PARTIAL',actual:{requests:n,totalReported:n.at(-1)?.response?.pagination,searchTarget:pool.users.empty.email,actions:await controls()},conclusion:'Đã kiểm request/pagination và tìm fixture trên UI. Chỉ kết luận không tìm được ngoài 100 nếu total>100 và xác minh mục tiêu nằm ngoài trang; giới hạn lớp150 không phải tổng tài khoản.'};
  });
  await probe('assignment-update-attempts',['BUG-17','BUG-23'],['Tạo bài DRAFT maxSubmissions=3.','PUT cập nhật thành 4, GET đọc lại; sau xuất bản cập nhật lại 3.','Cho học viên nộp một lượt rồi giảm max xuống1; đọc số lượt và bài cũ.'],async()=>{
    const item=await pool.assignment('READING',{status:'DRAFT',maxSubmissions:3});const draft=await pool.request('teacher','PUT',`/assignments/${item.id}`,{maxSubmissions:4},{allowError:true});const draftRead=await pool.get('teacher',`/assignments/${item.id}`);await pool.request('teacher','PATCH',`/assignments/${item.id}/status`,{status:'PUBLISHED'});const published=await pool.request('teacher','PUT',`/assignments/${item.id}`,{maxSubmissions:3},{allowError:true});const submitted=await pool.submitted(item);const decrease=await pool.request('teacher','PUT',`/assignments/${item.id}`,{maxSubmissions:1},{allowError:true});const final=await pool.get('teacher',`/assignments/${item.id}`);const history=await pool.get('student',`/submissions?assignmentId=${item.id}&limit=100`);return{status:draft.status<300&&draftRead.maxSubmissions===4?'NOT_REPRODUCED':'OBSERVED',actual:{assignmentId:item.id,draftStatus:draft.status,draftRead,publishedStatus:published.status,decreaseStatus:decrease.status,final,history,submitted},conclusion:'Kiểm chứng riêng khả năng sửa max và tình huống giảm sau một lượt; việc còn0 lượt khi max=1 chưa tự là lỗi.'};
  });
  await probe('reopen-assignment-api',['BUG-15'],['Giáo viên tạo và xuất bản bài fixture có hạn ở tương lai.','PATCH status=CLOSED rồi thử PUT gia hạn và PATCH status=PUBLISHED.','GET đọc trạng thái/hạn thực tế sau mỗi thao tác.'],async()=>{
    const item=await pool.assignment('WRITING');await pool.request('teacher','PATCH',`/assignments/${item.id}/status`,{status:'CLOSED'});const update=await pool.request('teacher','PUT',`/assignments/${item.id}`,{closeAt:new Date(Date.now()+10*86400000).toISOString()},{allowError:true});const reopen=await pool.request('teacher','PATCH',`/assignments/${item.id}/status`,{status:'PUBLISHED'},{allowError:true});const read=await pool.get('teacher',`/assignments/${item.id}`);return{status:reopen.status>=400?'REPRODUCED':'NOT_REPRODUCED',actual:{assignmentId:item.id,update,reopen,read},conclusion:`Bài CLOSED còn hạn: gia hạn HTTP ${update.status}; mở lại HTTP ${reopen.status}; trạng thái đọc lại ${read.status}.`};
  });
  await probe('profile-name-boundaries',['BUG-03'],['Admin tạo học viên fixture riêng.','PUT họ tên lần lượt dài1,2,50,51 ký tự và GET đọc lại.','Đối chiếu quy tắc2–50 ký tự đã chốt; không suy từ API thành validationUI.'],async()=>{
    const user=await pool.createUser('STUDENT','NameBoundary');const rows=[];for(const n of [1,2,50,51]){const fullName='A'.padEnd(n,'n');const r=await pool.request('admin','PUT',`/admin/users/${user.id}`,{fullName},{allowError:true});const read=await getUser(user.id);rows.push({inputLength:n,status:r.status,savedLength:read.fullName?.length,error:r.status>=400?r.data:undefined});}return{status:rows.some(x=>[1,51].includes(x.inputLength)&&x.status<300)?'REPRODUCED':'NOT_REPRODUCED',actual:{userId:user.id,rows},conclusion:'Đã kiểm biên tên trực tiếp vớiAPI theo giới hạn2–50; ghi kết quả riêng với việc thiếu nút sửaUI.'};
  });
  await probe('pre-submit-review',['BUG-24'],['Tạo bài Reading+Writing và bắt đầu phần Reading.','Nhập đáp án nhưng chưa nộp; bấm Xem lại trước khi nộp.','Ghi trạng thái từng phần và kiểm submission còn IN_PROGRESS; thử quay lại chỉnh sửa nếu có nút.'],async()=>{
    const item=await pool.assignment('READING',{status:'DRAFT'});await pool.request('teacher','POST',`/assignments/${item.id}/modules`,{skill:'WRITING',taskType:'ESSAY',instructions:'Review fixture writing',orderIndex:2,maxScore:10});await pool.request('teacher','PATCH',`/assignments/${item.id}/status`,{status:'PUBLISHED'});await login('student');const sub=await start(ctx,ui,item);await answer(ctx,ui,item);await ui.button(/^Xem lại trước khi nộp|Review before/i);await ui.ready();const text=await ui.text();await capture('review-opened');const data=await pool.get('student',`/submissions/${sub.id}`);return{status:'NOT_REPRODUCED',actual:{assignmentId:item.id,submissionId:sub.id,text,actions:await controls(),parentStatus:data.status},conclusion:'Có thao tác Xem lại trước khi nộp và đã mở được trên staging; parent còn IN_PROGRESS. Chưa nộp cuối từ màn này.'};
  });
  await probe('assignment-title-boundary',['BUG-19'],['Tạo bài fixture nháp.','Cập nhật tiêu đề có đúng199,200,201 ký tự qua API và đọc lại.','Khôi phục tiêu đề fixture sau kiểm tra để cleanup đúng danh tính.'],async()=>{
    const item=await pool.assignment('WRITING',{status:'DRAFT'});const rows=[];
    try{for(const length of [199,200,201]){const title=`${pool.prefix}-`.padEnd(length,'X');const r=await pool.request('teacher','PUT',`/assignments/${item.id}`,{title},{allowError:true});const read=await pool.get('teacher',`/assignments/${item.id}`);const res=pool.resources.find(x=>x.type==='assignment'&&x.id===item.id);res.title=read.title;await pool.journal();rows.push({length,status:r.status,savedLength:read.title.length});}return{status:rows.find(x=>x.length===201).status<300?'REPRODUCED':'NOT_REPRODUCED',actual:{assignmentId:item.id,rows},conclusion:'Đối chiếu giới hạn tiêu đề200 đã chốt bằng API, không suy ra UI cũng giống API.'};}finally{await pool.request('teacher','PUT',`/assignments/${item.id}`,{title:item.title});pool.resources.find(x=>x.type==='assignment'&&x.id===item.id).title=item.title;await pool.journal();}
  });
  await probe('multi-module-reading-writing',['BUG-20'],['Tạo bài Reading+Writing, mở bài, học viên bắt đầu Reading.','Trả lời câu Reading rồi bấm Hoàn thành & Nộp.','Đọc submission: Reading đã nộp nhưng Writing còn làm được; kiểm parent chưa hoàn tất.'],async()=>{
    const item=await pool.assignment('READING',{status:'DRAFT'});await pool.request('teacher','POST',`/assignments/${item.id}/modules`,{skill:'WRITING',taskType:'ESSAY',instructions:'Write about daily learning.',orderIndex:2,maxScore:10});await pool.request('teacher','PATCH',`/assignments/${item.id}/status`,{status:'PUBLISHED'});await login('student');const begun=await start(ctx,ui,item);await answer(ctx,ui,item);await ui.button(/^Hoàn thành & Nộp/i);await driver.wait(async()=>new URL(await driver.getCurrentUrl()).pathname.includes('/writing/')||/submissions/.test(new URL(await driver.getCurrentUrl()).pathname),20000);const data=await pool.get('student',`/submissions/${begun.id}`);return{status:data.status==='IN_PROGRESS'&&data.modules.some(m=>m.skill==='WRITING'&&m.status==='IN_PROGRESS')?'NOT_REPRODUCED':'REPRODUCED',actual:{assignmentId:item.id,submissionId:begun.id,detail:data,url:await driver.getCurrentUrl()},conclusion:'Đã nộp Reading trên bài hai kỹ năng và đọc trạng thái thật của parent/các module.'};
  });
  await probe('empty-writing-speaking',['BUG-21'],['Tạo bài Writing và Speaking riêng; học viên bắt đầu, không nhập/ghi âm.','Bấm Nộp, ghi cảnh báo/modal và network; không xác nhận nộp rỗng nếu đã có cảnh báo.'],async()=>{
    const observations=[];for(const skill of ['WRITING','SPEAKING']){const item=await pool.assignment(skill);await login('student');await start(ctx,ui,item);const btn=await ui.button(skill==='WRITING'?/^Nộp bài \(Submit Writing\)$|^Nộp bài$/i:/^Nộp bài|Submit Speaking/i,'main',false);const enabled=await btn.isEnabled();if(enabled){await btn.click();await driver.wait(async()=>/Vui lòng|chưa.*(ghi|bài)|chưa có|empty|record|trống/i.test(await ui.text()),10000).catch(()=>{});}const text=await ui.text();const network=await driver.executeScript('return (window.__srsNetwork||[]).filter(x=>x.method==="POST"&&x.path.endsWith("/submit"))');observations.push({skill,assignmentId:item.id,submitEnabled:enabled,text,submitRequests:network});await capture(`empty-${skill}`);}return{status:'NOT_REPRODUCED',actual:observations,conclusion:'Writing/Speaking rỗng đã có guard/cảnh báo hoặc nút disabled trong ca thử; giữ bằng chứng để phân biệt với Reading còn câu trống.'};
  });
  await probe('picker-beyond-first-100',['BUG-12'],['Tạo đủ tài khoản fixture để tổng ứng viên vượt100 và một học viên fixture không thuộc trang đầu100.','Admin mở modal chọn học viên, tìm đúng email mục tiêu; so sánh request/tổng số và kết quả UI.','Đọc API tìm chính xác email làm đối chứng; chỉ cleanup tài khoản do lượt chạy tạo.'],async()=>{
    let target=pool.users.empty;let list=await pool.get('admin','/admin/users?role=STUDENT&page=1&limit=100');let created=0;
    while(list.data.some(u=>u.id===target.id)&&created<105){for(let i=0;i<10&&created<105;i++){await pool.createUser('STUDENT',`Page${created++}`);}list=await pool.get('admin','/admin/users?role=STUDENT&page=1&limit=100');const outside=pool.resources.find(u=>u.type==='user'&&u.role==='STUDENT'&&u.state==='CREATED'&&!list.data.some(x=>x.id===u.id));if(outside)target=outside;}
    if(list.data.some(u=>u.id===target.id))return{status:'PARTIAL',actual:{created,pagination:list.pagination,targetId:target.id},conclusion:'Chưa tạo được mục tiêu ngoài trang đầu với thứ tự API hiện tại; không kết luận bỏ sót.'};
    const exact=await pool.get('admin',`/admin/users?q=${encodeURIComponent(target.email)}&role=STUDENT&page=1&limit=100`);assert.ok(exact.data.some(x=>x.id===target.id));await login('admin');await page(`/admin/classes/${pool.class.id}`);await ui.button(/^(Chọn học viên có sẵn|Thêm học viên|Thêm học viên có sẵn|Add Student|Select Existing Students)$/i);await waitNetwork('/admin/users','GET');await ui.ready();await ui.fill('input[placeholder^="Tìm kiếm học viên theo tên"],input[placeholder^="Search by name, email, student ID"]',target.email);await ui.ready();const text=await ui.text();await capture('missing-outside-first-page');const reqs=await driver.executeScript('return (window.__srsNetwork||[]).filter(x=>x.path.includes("/admin/users"))');return{status:text.includes(target.email)?'NOT_REPRODUCED':'REPRODUCED',actual:{targetId:target.id,email:target.email,created,pagination:list.pagination,inFirst100:false,exactApi:exact,uiFound:text.includes(target.email),requests:reqs},conclusion:text.includes(target.email)?'Tìm được học viên ngoài trang đầu trên UI.':'API tìm chính xác có học viên; modal không tìm thấy vì chỉ tải/lọc100 bản ghi đầu.'};
  });
  await probe('transfer-modal',['BUG-13'],['Admin mở lớp nguồn fixture và chọn Chuyển lớp trên đúng hàng học viên fixture.','Quan sát thông tin lớp nguồn/đích, ô tìm kiếm và xác nhận; không chuyển vào lớp có dữ liệu thật.'],async()=>{
    await login('admin');await page(`/admin/classes/${pool.class.id}`);await ui.rowAction(pool.users.student.fullName,/Chuyển lớp|Transfer/i);await ui.ready();await capture('transfer-modal');const text=await ui.text();return{status:'OBSERVED',actual:{classId:pool.class.id,targetClassId:pool.foreignClass.id,studentId:pool.users.student.id,text,actions:await controls()},conclusion:'Đã mở được modal Chuyển lớp trên staging; mô tả không có luồng chuyển lớp trong khảo sát source local không phản ánh đầy đủ bản deploy. Chưa kiểm sức chứa150 hoặc xác nhận chuyển.'};
  });
  await probe('teacher-csv-export',['BUG-18'],['Giáo viên chủ lớp mở tiến độ/bảng điểm lớp fixture.','Bấm Xuất CSV, đợi file trong thư mục tải xuống riêng tối đa30 giây.','Đọc bytes BOM/header và đối chiếu tên học viên fixture trong file.'],async()=>{
    const folder=join(out,'downloads');await mkdir(folder,{recursive:true});await driver.sendDevToolsCommand('Page.setDownloadBehavior',{behavior:'allow',downloadPath:folder});await login('teacher');await page(`/teacher/classes/${pool.class.id}`);await ui.button(/^Xuất CSV$|^Export CSV$/i);let files=[];await driver.wait(async()=>{files=(await readdir(folder)).filter(x=>!x.endsWith('.crdownload'));return files.length>0;},30000).catch(()=>{});if(!files.length)return{status:'REPRODUCED',actual:{files,waitedMs:30000,classId:pool.class.id},conclusion:'Không có file tải hoàn tất sau30giây từ nút XuấtCSV ở bảng tiến độ lớp; khác vị trí nút manual đề xuất tại danh sách bài.'};const bytes=await readFile(join(folder,files[0]));const text=bytes.toString('utf8');return{status:'NOT_REPRODUCED',actual:{files,bytes:bytes.length,utf8Bom:bytes.subarray(0,3).equals(Buffer.from([239,187,191])),header:text.split(/\r?\n/)[0],containsStudent:text.includes(pool.users.student.fullName)},conclusion:'Đã tải CSV thật, ghi BOM/header và đối chiếu fixture. Không tự suy ra nút xuất ở mọi màn đều hoạt động.'};
  });
  await probe('speaking-second-attempt',['BUG-22'],['Tạo bài Speaking maxSubmissions=2, học viên bắt đầu lượt1.','Ghi âm giả lập trình duyệt ít nhất2 giây, dừng và nộp; đọc lượt1.','Mở lại bài, bắt đầu lượt2, ghi/nộp; đối chiếu ID module mới và response upload/submit.'],async()=>{
    const item=await pool.assignment('SPEAKING',{maxSubmissions:2});const rows=[];await login('student');
    for(let i=1;i<=2;i++){const attempt=await start(ctx,ui,item);await(await ui.visible('.speaking-btn-record')).click();await driver.wait(async()=>/00:0[2-9]/.test(await ui.text()),10000);await(await ui.visible('.speaking-btn-record')).click();await driver.wait(async()=>await driver.executeScript('return !!document.querySelector("audio")?.src'),10000);await ui.button(/^Nộp bài|Submit Speaking/i);await driver.wait(async()=>new URL(await driver.getCurrentUrl()).pathname.startsWith('/student/submissions/'),30000);const read=await pool.get('student',`/submissions/${attempt.id}`);rows.push({attempt:i,detail:read});await capture(`speaking-attempt-${i}`);}
    return{status:'NOT_REPRODUCED',actual:{assignmentId:item.id,rows},conclusion:'Đã ghi/nộp hai lượt Speaking qua UI với hai lượt thật; không gặp 403 trong điều kiện này.'};
  });
  await probe('review-and-raw-score',['BUG-24','BUG-25'],['Học viên mở tổng quan một bài Reading, quan sát có Review trước nộp.','Nộp một bài Reading fixture có đáp án đúng rồi mở lại kết quả.','Mở bảng điểm để ghi các cột Điểm thô/Điểm quy đổi.'],async()=>{
    const item=await pool.assignment('READING');await login('student');await start(ctx,ui,item);const before=await controls();await capture('before-submit');await answer(ctx,ui,item);await submit(ctx,ui,item);await driver.wait(async()=>new URL(await driver.getCurrentUrl()).pathname.startsWith('/student/submissions/'),20000);const after=await ui.text();await capture('after-submit');await page('/student/grades');const grades=await ui.text();return{status:'OBSERVED',actual:{assignmentId:item.id,before,after,grades},conclusion:'Đã lưu trước/sau nộp và cột bảng điểm. BảngUC020 mô tả sau nộp; wireframe trước nộp còn mâu thuẫn. Cột điểm thô tự nó là đề xuất UX.'};
  });
  await probe('ai-writing-word-threshold',['BUG-26'],['Tạo bài Viết và ba bài nộp tổng hợp có19,20,21 từ.','Giáo viên yêu cầu AI phân tích từng bài qua API đúng endpoint UI.','Đọc phản hồi và theo dõi dữ liệu grading; phân biệt nhận job với AI đã chấm.'],async()=>{
    const item=await pool.assignment('WRITING',{maxSubmissions:3});const rows=[];
    for(const count of [19,20,21]){const text='I practice English every day because learning languages helps people understand different cultures and communicate with confidence around the world every single week'.split(' ').slice(0,count).join(' ');assert.equal(text.split(/\s+/).length,count);const sub=await pool.submitted(item,{text});const response=await pool.request('teacher','POST',`/submission-modules/${sub.submissionModuleId}/grading/ai-analyze`,undefined,{allowError:true});let grading;const deadline=Date.now()+45000;do{grading=await pool.get('teacher',`/submission-modules/${sub.submissionModuleId}/grading`);if(grading.aiFeedback||['FAILED','AI_GRADED'].includes(grading.status)||response.status>=400)break;await new Promise(r=>setTimeout(r,1500));}while(Date.now()<deadline);const suggestion=await pool.request('teacher','GET',`/submission-modules/${sub.submissionModuleId}/grading/ai-suggestion`,undefined,{allowError:true});rows.push({wordCount:count,...sub,triggerStatus:response.status,trigger:response.data,grading,suggestion});await save(`ai-${count}`,rows.at(-1));}
    const short=rows[0];return{status:short.grading?.aiFeedback||short.grading?.status==='AI_GRADED'?'REPRODUCED':short.grading?.status==='FAILED'&&rows.slice(1).every(x=>x.grading.status==='AI_GRADED')?'NOT_REPRODUCED':'PARTIAL',actual:rows,conclusion:'Đã ghi trạng thái cuối và kết quả AI19/20/21 từ. Trigger202 là nhận job, không đồng nghĩa chấm thành công; chỉ kết luận theo trạng thái/kết quả sau xử lý.'};
  });
  await probe('overall-score-calculation',['BUG-27'],['Tạo bài bốn kỹ năng có maxScore lần lượt20,10,10,10.','Tạo/nộp đủ4 module với dữ liệu tổng hợp; giáo viên chấm lần lượt18,8,6,4.','Tính độc lập điểm thang10:9,8,6,4; trung bình6.75. Đối chiếu API báo cáo.'],async()=>{
    const item=await pool.assignment('WRITING',{status:'DRAFT'});await pool.request('teacher','PUT',`/modules/${item.moduleId}`,{maxScore:20});const mods=[{id:item.moduleId,skill:'WRITING',score:18,max:20}];
    for(const [skill,score] of [['SPEAKING',8],['READING',6],['LISTENING',4]]){const m=await pool.request('teacher','POST',`/assignments/${item.id}/modules`,{skill,taskType:skill==='SPEAKING'?'RECORDING':'QUIZ',instructions:`Score calculation ${skill}`,orderIndex:mods.length+1,maxScore:10});const data={id:m.id,skill,score,max:10};if(['READING','LISTENING'].includes(skill)){data.question=await pool.request('teacher','POST',`/modules/${m.id}/questions`,{content:'Synthetic score check: type apple',questionType:'SHORT_ANSWER',correctAnswer:{correctAnswer:'apple'},score:10,orderIndex:1});}mods.push(data);}
    await pool.request('teacher','PATCH',`/assignments/${item.id}/status`,{status:'PUBLISHED'});
    const sub=await pool.request('student','POST',`/assignments/${item.id}/submissions`);
    for(const m of sub.modules){const d=mods.find(x=>x.id===m.moduleId);let payload;
      if(d.question)payload={answers:[{questionId:d.question.id,content:{text:'apple'}}]};
      else{const speaking=d.skill==='SPEAKING';const mimeType=speaking?'audio/wav':'text/plain';const up=await pool.request('student','POST',`/submission-modules/${m.id}/${speaking?'audio':'document'}-upload-url`,{mimeType});const bytes=speaking?await readFile(await pool.wav()):Buffer.from('This is a synthetic essay for checking score calculation across all four language skills without using any real student work.');const put=await fetch(up.uploadUrl,{method:'PUT',headers:{'Content-Type':mimeType},body:bytes,signal:AbortSignal.timeout(25000)});assert.ok(put.ok);payload={answers:[],[speaking?'audioStorageKey':'storageKey']:up.storageKey};}
      const response=await pool.request('student','POST',`/submission-modules/${m.id}/submit`,payload,{allowError:true});if(response.status>=400)return{status:'BLOCKED',actual:{assignmentId:item.id,module:m,status:response.status,response:response.data},conclusion:'Không tạo được đủ bài nộp hợp lệ cho bộ điểm độc lập; không dùng dữ liệu thiếu để kết luận sai công thức.'};}
    await pool.request('student','POST',`/submissions/${sub.id}/submit`);
    for(const m of sub.modules){const data=mods.find(x=>x.id===m.moduleId);const grade=await pool.get('teacher',`/submission-modules/${m.id}/grading`);const r=await pool.request('teacher','PUT',`/gradings/${grade.id}`,{finalScore:data.score,finalFeedback:'Synthetic score audit',note:'Manual audit test fixture'},{allowError:true});if(r.status>=400)return{status:'BLOCKED',actual:{assignmentId:item.id,gradingId:grade.id,response:r},conclusion:'Không lưu được bộ điểm đã chọn, chưa đủ dữ liệu so công thức.'};}
    const report=await pool.get('teacher',`/reports/students/${pool.users.student.id}/progress?classId=${pool.class.id}`);return{status:'OBSERVED',actual:{assignmentId:item.id,submissionId:sub.id,modules:mods,equalSkillMean:6.75,weightedTotal:7.2,report},conclusion:'Đã tạo bộ điểm biết trước. Cần lọc đúng bài/lượt trong API; báo cáo gộp nhiều bài không được coi là điểm tổng riêng của bài này.'};
  });
  await probe('agreed-profile-validation',['BUG-03'],['Dùng tài khoản Admin fixture riêng mở Hồ sơ cá nhân.','Nhập tên dài1,2,50,51 ký tự, lưu và đọc API; đối chiếu giới hạn2–50.','Đổi mật khẩu:7 ký tự, thiếu chữ hoa, thiếu số, hợp lệ8 ký tự; đối chiếu đăng nhập bằng mật khẩu mới/cũ.'],async()=>{
    const user=pool.users.profile;await login('profile');await page('/admin/profile');
    const nameSelector='.profile-form-card input[type=text]:not([readonly]):not([placeholder])';
    const names=[];
    for(const length of [1,2,50,51]){
      await ui.fill(nameSelector,'A'.padEnd(length,'n'));
      await(await ui.visible('.profile-form-card button[type=submit]')).click();
      await new Promise(r=>setTimeout(r,1000));
      const saved=await pool.get('profile','/users/me');
      names.push({inputLength:length,savedLength:saved.fullName.length,validity:await driver.executeScript('const x=document.querySelector(arguments[0]);return {valid:x.validity.valid,message:x.validationMessage,maxLength:x.maxLength,minLength:x.minLength}',nameSelector)});
      await capture(`self-name-${length}`);
    }
    const passwords=[];let currentPassword=user.password;
    for(const [label,next,shouldAccept] of [['short7','Abc1234',false],['no-uppercase','abc12345',false],['no-digit','Abcdefgh',false],['valid8','Abc12345',true]]){
      secrets.push(next);await page('/admin/profile');await ui.button(/^(Bảo mật & Mật khẩu|Security & Password|Bảo mật|Security|Đổi mật khẩu|Change Password)$/i);
      const inputs=await driver.findElements(By.css('.profile-password-form input'));assert.equal(inputs.length,3);
      for(const [i,value] of [currentPassword,next,next].entries()){await inputs[i].clear();await inputs[i].sendKeys(value);}
      await(await ui.visible('.profile-password-form button[type=submit]')).click();await new Promise(r=>setTimeout(r,1000));
      const response=await pool.request(null,'POST','/auth/login',{email:user.email,password:next},{allowError:true});
      passwords.push({label,expectedAccepted:shouldAccept,newCredentialStatus:response.status});
      if(response.status===200){currentPassword=next;user.password=next;}
      await capture(`self-password-${label}`);
    }
    return{status:names.some(x=>[1,51].includes(x.inputLength)&&x.savedLength===x.inputLength)||passwords.some(x=>(x.newCredentialStatus===200)!==x.expectedAccepted)?'REPRODUCED':'NOT_REPRODUCED',actual:{userId:user.id,names,policyChecks:passwords},conclusion:'Kiểm bổ sung trực tiếp UI hồ sơ cá nhân theo file đã chốt; phân biệt với API Admin sửa hồ sơ. Mỗi đổi mật khẩu được kiểm bằng đăng nhập thật.'};
  });
  await probe('agreed-class-capacity',['BUG-13'],['Tạo lớp fixture riêng, thêm lần lượt học viên fixture duy nhất.','Đối chiếu thêm học viên thứ149,150,151 với giới hạn150 đã chốt; đọc lại danh sách.','Chỉ cleanup tài khoản và lớp do lượt này tạo.'],async()=>{
    const cls=await pool.createClass('Capacity150');const boundary=[];let accepted=0;
    for(let i=1;i<=151;i++){
      const user=await pool.createUser('STUDENT',`Capacity${i}`);
      const r=await pool.request('admin','POST',`/classes/${cls.id}/members`,{studentId:user.id},{allowError:true});
      if(r.status<300){accepted++;pool.resources.push({type:'member',id:r.data.memberId,classId:cls.id,studentId:user.id,state:'CREATED'});await pool.journal();}
      if(i>=149||r.status>=400)boundary.push({ordinal:i,status:r.status,response:r.data});
      if(i<149&&r.status>=400)break;
    }
    const members=await pool.get('admin',`/classes/${cls.id}/members?page=1&limit=100`);const detail=await pool.get('admin',`/classes/${cls.id}`);
    return{status:accepted>150?'REPRODUCED':accepted===150?'NOT_REPRODUCED':'PARTIAL',actual:{classId:cls.id,accepted,boundary,readbackPagination:members.pagination,readbackClass:detail},conclusion:`Đã kiểm biên sức chứa bằng API trên lớp riêng: chấp nhận ${accepted} học viên; không suy thành kết quả UI chuyển lớp.`};
  });
}catch(e){run.setupError=safe(String(e.message));console.log(`SETUP BLOCKED: ${run.setupError}`);}
finally{
  if(driver)await driver.quit().catch(()=>{});
  run.cleanupErrors=await pool.cleanup();run.retainedFixtures=pool.resources.filter(x=>x.state==='ARCHIVED');run.finishedAt=new Date().toISOString();await flush();console.log(JSON.stringify({results:run.results.length,cleanupErrors:run.cleanupErrors.length,retained:run.retainedFixtures.length}));
}
