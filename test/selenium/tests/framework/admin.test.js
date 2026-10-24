import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {parseOptions,classify} from '../../support/admin/options.js';
import {assertOwned,assertStaging,resourcesFor,readUser,prepareFixtures} from '../../support/admin/fixtures.js';
import {adminCases} from '../admin/cases.js';
import {summarizeNetwork} from '../../support/admin/network.js';
import {writeSuiteReport} from '../../utils/suite-reporter.js';
import {checkStagingAvailability} from '../../support/admin/staging-health.js';
import {AdminPage} from '../../pages/admin/AdminPage.js';
import {assertAccountRejected,assertProgressMetrics,assertGradingCells,assertAuditLogs,assertReportClassCells} from '../../support/admin/assertions.js';
import {adminProcedures,detailedAdminSteps} from '../admin/procedures.js';

test('published issue links survive report rendering without labelling scope review as a bug',async()=>{
  const directory=await fs.mkdtemp(path.join(os.tmpdir(),'qa31-issue-links-'));
  try {
    const cases=['QA31-036','QA31-041','QA31-050'].map(id=>{
      const c=adminCases.find(c=>c.id===id);
      return {id,title:c.title,issueRefs:c.issueRefs,status:'BLOCKED',startedAt:new Date().toISOString()};
    });
    await writeSuiteReport(directory,{suite:{id:'QA-31',key:'QA31.Admin',role:'Admin'},cases,selectedCases:cases.map(c=>c.id),status:'COMPLETED'});
    const html=await fs.readFile(path.join(directory,'report.html'),'utf8');
    for(const number of [190,195,196])assert.ok(html.includes(`https://github.com/hotung9108/EnglishHub/issues/${number}`));
    const scope=JSON.parse(await fs.readFile(path.join(directory,'evidence/QA31-050.json'),'utf8'));
    assert.deepEqual(scope.issueRefs,[]);
    const related=JSON.parse(await fs.readFile(path.join(directory,'evidence/QA31-036.json'),'utf8'));
    assert.equal(related.issueRefs[1].group,'Related API diagnostic');
  } finally {await fs.rm(directory,{recursive:true,force:true});}
});

test('every Admin case has numbered procedures matching the registry',()=>{
  assert.equal(Object.keys(adminProcedures).length,adminCases.length);
  for(const c of adminCases) {
    const lines=c.steps.split('\n');assert.ok(lines.length>=3,`${c.id} missing detailed steps`);
    lines.forEach((line,i)=>assert.ok(line.startsWith(`${i+1}. `)));
    assert.equal(c.steps,detailedAdminSteps(c.id));
  }
  assert.throws(()=>detailedAdminSteps('QA31-999'),/Missing/);
});
test('targeted retest validates every selected case and shares one fixture plan',()=>{
  const selected=parseOptions(['--cases=003,014,QA31-025,39,040,003'],adminCases).selected;
  assert.deepEqual(selected.map(c=>c.id),['QA31-003','QA31-014','QA31-025','QA31-039','QA31-040']);
  assert.deepEqual([...resourcesFor(selected)].sort(),['baseClass','student','teacher']);
  for(const value of ['--cases=003,999','--cases=003,','--cases='])assert.throws(()=>parseOptions([value],adminCases));
  assert.throws(()=>parseOptions(['--case=003','--cases=014'],adminCases));
});

test('Accounts creation verifies persisted role; selecting ADMIN cannot pass with a STUDENT record',async()=>{
  for(const [id,wanted,actual,shouldPass] of [['QA31-036','ADMIN','STUDENT',false],['QA31-036','ADMIN','ADMIN',true],['QA31-037','TEACHER','TEACHER',true],['QA31-038','STUDENT','STUDENT',true]]) {
    let roleValue='STUDENT';const entered=[];
    const select={findElements:async()=>['ADMIN','TEACHER','STUDENT'].map(value=>({getAttribute:async()=>value})),getAttribute:async()=>roleValue};
    const p={nav:async()=>{},button:async()=>{},visible:async()=>({}),field:async()=>({}),fill:async(_,value)=>entered.push(value),select:async(_,value)=>{roleValue=value;},clickElement:async()=>{},driver:{findElements:async locator=>locator.value==='.adm-drawer select'?[select]:[]}};
    const data={tag:'abc123',names:{teacher:'QA Admin Teacher abcdef'},password:'private-test-value',ledger:[],api:{get:async()=>({data:[{id:90,email:`qa31-abc123-${wanted.toLowerCase()}-accounts-ui@example.invalid`,fullName:`QA Accounts ${wanted} abcdef`,role:actual}]})}};
    const result={};const action=adminCases.find(c=>c.id===id).run(p,data,result);
    if(shouldPass)await action;else await assert.rejects(action,/vai trò khác/);
    assert.equal(roleValue,wanted);assert.equal(result.readback.requested.role,wanted);assert.equal(result.readback.actual.user.role,actual);
    assert.equal(data.ledger[0].role,actual,'Keep the actual wrongly created user traceable');
    assert.ok(!JSON.stringify(result).includes(data.password));assert.equal(entered.length,3);
  }
});

test('existing-account search excludes newly created users and never mutates data',async()=>{
  for(const id of ['QA31-039','QA31-040']) {
    const keywords=[],routes=[],calls=[];const old={id:12,email:'old@example.invalid',fullName:'Existing Student',role:'STUDENT'};
    const fresh={id:99,email:'new@example.invalid',fullName:'New QA',role:'STUDENT'};
    const data={ledger:[{kind:'ui-user',id:99}],api:{get:async(role,url)=>{calls.push(url);return {data:[fresh,old]};}}};
    const p={nav:async route=>routes.push(route),search:async value=>keywords.push(value),exactRow:async email=>{assert.equal(email,old.email);return {getText:async()=>`${old.fullName} ${old.email}`};}};
    const result={};await adminCases.find(c=>c.id===id).run(p,data,result);
    assert.deepEqual(keywords,[old.email,old.fullName]);assert.equal(result.readback.user.id,12);
    assert.deepEqual(routes,[id==='QA31-039'?'accounts':'students']);assert.equal(calls.length,1);
    if(id==='QA31-040')assert.ok(calls[0].includes('role=STUDENT'));
    await assert.rejects(adminCases.find(c=>c.id===id).run(p,{ledger:[{kind:'user',id:12}],api:{get:async()=>({data:[old]})}},{}),e=>e.code==='QA31_FIXTURE');
  }
});

test('report count accepts the displayed unit while rejecting wrong numbers and identity',()=>{
  const api={classId:155,className:'QA31-Class',assignedAssignmentCount:1,averageScorePercent:80,completionRatePercent:100};
  const cells=['ENG-155','QA31-Class','1 bài','80%','100%'];
  assert.doesNotThrow(()=>assertReportClassCells(cells,api));
  assert.doesNotThrow(()=>assertReportClassCells([...cells.slice(0,2),'1 hw',...cells.slice(3)],api));
  for(const [i,value] of [[0,'ENG-15'],[2,'10 bài'],[2,'1 lỗi 1 bài'],[3,'8%'],[4,'10%']]) {
    const wrong=[...cells];wrong[i]=value;assert.throws(()=>assertReportClassCells(wrong,api));
  }
});

test('fixture dependencies do not create unrelated accounts for a single case',()=>{
  const plan=id=>[...resourcesFor(adminCases.filter(c=>c.id===id))].sort();
  assert.deepEqual(plan('QA31-003'),['teacher']);
  assert.deepEqual(plan('QA31-014'),['student']);
  assert.deepEqual(plan('QA31-022'),['editClass','teacher']);
  assert.deepEqual(plan('QA31-010'),[]);
  assert.deepEqual(plan('QA31-031'),['audit','baseClass','content','student','teacher']);
});
test('teacher-only setup creates one identified account and keeps password out of ledger',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'qa31-fixture-'));const calls=[];let user;
  const api={login:async role=>assert.equal(role,'admin'),request:async(role,method,url,body)=>{
    calls.push({role,method,url});assert.equal(url,'/admin/users');assert.equal(body.role,'TEACHER');
    user={id:22,email:body.email,role:body.role,fullName:body.fullName};return {user};
  },get:async()=>({data:[user]})};
  const config={baseUrl:'https://staging.hotung9108.me',users:{admin:{email:'admin',password:'secret'}}};
  try {
    const data=await prepareFixtures(config,[{resources:['teacher']}],dir,{api});
    assert.equal(calls.length,1);assert.equal(data.student,undefined);assert.deepEqual(data.errors,{});
    assert.equal(data.teacher.id,22);assert.notEqual(data.uiNames.teacher,data.names.teacher);
    assert.doesNotMatch(data.names.teacher,/\d/);
    const ledger=await fs.readFile(path.join(dir,'fixture-ledger.json'),'utf8');
    assert.ok(!ledger.includes(data.password));assert.ok(!ledger.includes('secret'));
  }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('progress compares named values exactly, not digits elsewhere in drawer',()=>{
  const api={totalStudentCount:1,scoredStudentCount:0,belowAverageCount:0,completionRatePercent:0};
  const ui={totalStudentCount:'1',scoredStudentCount:'0',belowAverageCount:'0',completionRatePercent:'0%'};
  assert.doesNotThrow(()=>assertProgressMetrics(ui,api));
  assert.throws(()=>assertProgressMetrics({...ui,totalStudentCount:'10'},api));
  assert.throws(()=>assertProgressMetrics({...ui,scoredStudentCount:'1'},api));
  assert.throws(()=>assertProgressMetrics(ui,{...api,belowAverageCount:undefined}));
});
test('audit checks score zero and status, not just grading ID',()=>{
  const g={id:9,status:'COMPLETED',finalScore:0};
  assert.doesNotThrow(()=>assertGradingCells(['GR-9','Completed','0'],g));
  assert.throws(()=>assertGradingCells(['GR-9','Pending','0'],g));
  assert.throws(()=>assertGradingCells(['GR-9','Completed','Unscored'],g));
});
test('audit requires real correction and matches old/new/note on each row',()=>{
  const fixture={oldScore:7.5,newScore:8,note:'QA correction'};
  const entries=[{oldScore:0,newScore:7.5,note:'Initial'},fixture];
  const rows=[['Teacher','0','7.5','Initial'],['Teacher','7.5','8','QA correction']];
  assert.doesNotThrow(()=>assertAuditLogs(rows,entries,fixture));
  assert.throws(()=>assertAuditLogs([],[],fixture),/empty/);
  assert.throws(()=>assertAuditLogs([rows[1]],entries,fixture),/count/);
  assert.throws(()=>assertAuditLogs([['Teacher','7.5','0','Initial'],rows[1]],entries,fixture),/same row/);
  assert.throws(()=>assertAuditLogs(rows,entries,{...fixture,note:'Missing'}),/missing/);
});

test('invalid-email echoed in preview cannot satisfy the rejection assertion',()=>{
 const base={email:'qa31-ab-invalid-email',pathname:'/admin/students/create',users:[]};
 assert.throws(()=>assertAccountRejected(base),/validation/);
 assert.doesNotThrow(()=>assertAccountRejected({...base,formError:'Vui lòng nhập đúng định dạng.'}));
 assert.throws(()=>assertAccountRejected({...base,formError:'Error',users:[{email:base.email}]}),/API vẫn/);
 assert.throws(()=>assertAccountRejected({...base,nativeMessage:'Invalid email',pathname:'/admin/students'}),/navigated/);
});

test('select waits for API options arriving after the page text is stable',async()=>{
 let polls=0,clicked;
 const option=value=>({getAttribute:async()=>value});
 const field={findElements:async()=>++polls===1?[option('')]:[option(''),option('151')]};
 const driver={wait:async fn=>{for(let i=0;i<5;i++)if(await fn())return true;throw new Error('Timed out');}};
 const page=new AdminPage(driver,{timeout:1000});
 page.clickElement=async element=>{clicked=await element.getAttribute('value');};
 await page.select(field,151);assert.equal(clicked,'151');assert.ok(polls>=2);
});

test('accept code formats and exact title, reject mixed command paste',()=>{
 for(const value of ['7','007','QA31-007','qa31-007',adminCases[6].title])assert.equal(parseOptions([`--case=${value}`],adminCases).selected[0].id,'QA31-007');
 assert.throws(()=>parseOptions(['--case=cmd /c QA31-Watch.cmd'],adminCases),/Không có case/);
 assert.throws(()=>parseOptions(['--case=999'],adminCases));
});
test('registry unique IDs, meaningful expected and resources',()=>{
 assert.equal(new Set(adminCases.map(c=>c.id)).size,adminCases.length);
 for(const c of adminCases){assert.match(c.id,/^QA31-\d{3}$/);assert.ok(c.steps.length>15&&c.expected.length>15&&typeof c.run==='function');}
 assert.deepEqual([...resourcesFor(adminCases.filter(t=>t.id==='QA31-001'))],[]);
 assert.ok(resourcesFor(adminCases).has('archiveClass'));
});
test('watch pacing bounded and unknown arguments rejected',()=>{
 assert.equal(parseOptions(['--watch','--slow=2500'],adminCases).observeMs,2500);
 for(const a of ['--slow=-1','--slow=NaN','--slow=30001','--delete-all'])assert.throws(()=>parseOptions([a],adminCases));
});
test('never mutate unowned ID, wrong email, ADMIN or renamed class',()=>{
 const ledger=[{kind:'user',id:7,email:'qa31-abc123-teacher@example.invalid',role:'TEACHER'},{kind:'class',id:8,name:'QA31-Isolated'}];
 const user={email:ledger[0].email,role:'TEACHER'};
 assert.ok(assertOwned(ledger,'user',7,user));
 assert.throws(()=>assertOwned(ledger,'user',1,user));
 assert.throws(()=>assertOwned(ledger,'user',7,{...user,email:'real@example.com'}));
 assert.throws(()=>assertOwned(ledger,'user',7,{...user,role:'ADMIN'}));
 assert.throws(()=>assertOwned(ledger,'class',8,{name:'Real class'}));
 assert.throws(()=>assertOwned([{kind:'user',id:7,email:'admin@example.com',role:'ADMIN'}],'user',7,{email:'admin@example.com',role:'ADMIN'}));
});
test('staging guard rejects localhost and missing admin',()=>{
 assert.throws(()=>assertStaging({baseUrl:'http://localhost:5173',users:{admin:{email:'a',password:'b'}}}));
 assert.throws(()=>assertStaging({baseUrl:'https://staging.hotung9108.me',users:{admin:{}}}));
});
test('Admin readback uses supported search endpoint and verifies ID plus email',async()=>{
 const user={id:22,email:'qa31-abc123-teacher@example.invalid'};const calls=[];
 const data={api:{get:async(role,endpoint)=>{calls.push(endpoint);return {data:[{id:21,email:user.email},{...user,role:'TEACHER'}]};}}};
 assert.equal((await readUser(data,user)).id,22);assert.ok(calls[0].startsWith('/admin/users?q='));
 await assert.rejects(readUser(data,{...user,id:23}));
});
test('dependency is not product failure, 403 not automatic product bug',()=>{
 assert.equal(classify({code:'QA31_BLOCKED'},'scenario'),'PRODUCT_DEPENDENCY');
 assert.equal(classify({code:'QA31_FIXTURE'},'scenario'),'FIXTURE_REVIEW');
 assert.equal(classify({status:403},'scenario'),'API_ACCESS_REVIEW');
 assert.equal(classify({code:'ERR_ASSERTION'},'scenario'),'PRODUCT_CANDIDATE');
 assert.equal(classify(new Error('selector timeout'),'scenario'),'NEEDS_REVIEW');
});
test('network evidence removes auth and signed query strings',()=>{
 const entry=m=>({message:JSON.stringify({message:m})});
 const records=summarizeNetwork([
 entry({method:'Network.requestWillBeSent',params:{requestId:'a',request:{method:'POST',url:'https://api-staging.hotung9108.me/api/v1/auth/login'}}}),
 entry({method:'Network.requestWillBeSent',params:{requestId:'b',request:{method:'GET',url:'https://api-staging.hotung9108.me/api/v1/classes?q=secret'}}}),
 entry({method:'Network.responseReceived',params:{requestId:'b',response:{status:403,mimeType:'application/json'}}})]);
 assert.deepEqual(records.map(x=>[x.endpoint,x.status]),[['/api/v1/classes',403]]);assert.ok(!JSON.stringify(records).includes('secret'));
});
test('health preflight rejects down staging before any setup',async()=>{
 await assert.rejects(checkStagingAvailability({baseUrl:'https://staging.hotung9108.me'},{request:async()=>503}),e=>e.code==='QA31_ENVIRONMENT');
});
test('report preserves blocked, not-run, dependency and escapes HTML',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'qa31-report-'));
 try {
 await writeSuiteReport(dir,{suite:{id:'QA-31',role:'Admin',key:'QA31.Admin'},selectedCases:['QA31-001','QA31-002','QA31-003'],cases:[{id:'QA31-001',title:'<bad>',steps:'1. Open\n2. <button>',status:'FAILED',reason:'<script>',phase:'scenario'},{id:'QA31-002',title:'blocked',status:'BLOCKED',dependsOn:['QA31-001']}]});
 const html=await fs.readFile(path.join(dir,'report.html'),'utf8');const json=JSON.parse(await fs.readFile(path.join(dir,'summary.json'),'utf8'));assert.ok(html.includes('<pre>1. Open\n2. &lt;button&gt;</pre>'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.deepEqual(json.notRun,['QA31-003']);assert.equal(json.counts.BLOCKED,1);assert.deepEqual(json.cases[1].dependsOn,['QA31-001']);
 const issue=await fs.readFile(path.join(dir,'issues/QA31-001.md'),'utf8');assert.ok(issue.includes('DRAFT'));assert.ok(issue.includes('QA-31'));
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
