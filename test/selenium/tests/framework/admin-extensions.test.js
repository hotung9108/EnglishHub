import test from 'node:test';
import assert from 'node:assert/strict';
import {dateWindows,assertOverview,assertAuditStatusRows,studentStatus,systemSettingsAvailable,systemSettingsPersistence,contentEntry} from '../../support/admin/extended-scenarios.js';
import {AdminPage} from '../../pages/admin/AdminPage.js';
import {classify} from '../../support/admin/options.js';

test('absence of a sidebar content menu is a scope blocker, not proof of a product bug',async()=>{
  const result={};await assert.rejects(contentEntry({driver:{findElements:async()=>[]}}, {},result),e=>e.code==='QA31_SCOPE'&&classify(e,'scenario')==='SCOPE_REVIEW');
  assert.deepEqual(result.readback.entries,[]);
});

test('date windows include submission day and exclude it in the future across a year boundary',()=>{
  const plan=dateWindows(new Date('2026-12-31T23:59:59Z'));
  assert.deepEqual(plan.include,{from:'2026-12-29',to:'2027-01-02'});
  assert.deepEqual(plan.exclude,{from:'2027-01-30',to:'2027-01-31'});
});
test('Reports KPI assertion cannot pass from matching digits in another metric',()=>{
  const expected={classCount:1,pendingGradingCount:0,averageScorePercent:80,completionRatePercent:100};
  const actual={classCount:'1',pendingGradingCount:'0',averageScorePercent:'80%',completionRatePercent:'100%'};
  assert.doesNotThrow(()=>assertOverview(actual,expected));
  assert.throws(()=>assertOverview({...actual,averageScorePercent:'8%'},expected));
  assert.throws(()=>assertOverview(actual,{...expected,classCount:undefined}));
});
test('Audit filters require rows and exact ID/status/score, including score zero',()=>{
  const expected=[{id:9,status:'COMPLETED',finalScore:0}];
  assert.doesNotThrow(()=>assertAuditStatusRows([['GR-9','Completed','0']],expected,'COMPLETED'));
  assert.throws(()=>assertAuditStatusRows([],expected,'COMPLETED'));
  assert.throws(()=>assertAuditStatusRows([['GR-8','Completed','0']],expected,'COMPLETED'));
  assert.throws(()=>assertAuditStatusRows([['GR-9','Pending','0']],expected,'COMPLETED'));
  assert.throws(()=>assertAuditStatusRows([['GR-9','Completed','Unscored']],expected,'COMPLETED'));
});
test('date entry verifies actual ISO value; browser entry problems are harness errors',async()=>{
  let value='';
  const page=new AdminPage({executeScript:async(script,element,iso)=>{assert.ok(script.includes("new Event('input'"));assert.ok(script.includes("new Event('change'"));value=iso;}},{});page.step=async()=>{};
  const e={getAttribute:async()=>value};
  await page.fillDate(e,'2026-10-20');assert.equal(value,'2026-10-20');
  await assert.rejects(page.fillDate({...e,getAttribute:async()=>''},'2026-10-20'),error=>error.code==='QA31_HARNESS'&&classify(error,'scenario')==='HARNESS_REVIEW');
});

function studentData() {
  const student={id:7,email:'qa31-abc123-student@example.invalid',name:'QA Student'};
  return {student,baseClass:{id:9,name:'QA31-Test'},ledger:[{kind:'user',id:7,email:student.email,role:'STUDENT'}],api:{get:async()=>({data:[{id:7,email:student.email,fullName:student.name,role:'STUDENT',status:'ACTIVE'}]}),request:async()=>{assert.fail('Unexpected mutation');}}};
}
test('missing QA Student in list blocks before any UI/API status change',async()=>{
  const p={nav:async()=>{},search:async()=>{},rows:async()=>[]};
  await assert.rejects(studentStatus(p,studentData(),{},'list'),e=>e.code==='QA31_BLOCKED'&&e.dependsOn.includes('QA31-014'));
});
test('wrong profile identity blocks before pressing lock, even with the right URL',async()=>{
  let profileClicks=0;
  const p={openClass:async()=>{},exactRow:async()=>({}),rowAction:async()=>{profileClicks++;},ready:async()=>{},driver:{getCurrentUrl:async()=>'https://staging.hotung9108.me/admin/students/7'},assertIdentity:async()=>assert.fail('Wrong person')};
  await assert.rejects(studentStatus(p,studentData(),{},'profile'),e=>e.code==='QA31_BLOCKED'&&e.dependsOn.includes('QA31-020'));
  assert.equal(profileClicks,1,'Only the Profile navigation may have been clicked');
});
test('failed UI assertion after locking restores ACTIVE only for owned Student ID',async()=>{
  const d=studentData();let status='ACTIVE',restored=0;
  d.api.get=async()=>({data:[{id:7,email:d.student.email,role:'STUDENT',fullName:d.student.name,status}]});
  d.api.request=async(role,method,url,body)=>{assert.equal(role,'admin');assert.equal(method,'PATCH');assert.equal(url,'/admin/users/7/status');assert.deepEqual(body,{status:'ACTIVE'});status='ACTIVE';restored++;};
  const row={getText:async()=>status==='ACTIVE'?`QA Student ${d.student.email}`:'Wrong status badge'};
  const p={nav:async()=>{},search:async()=>{},rows:async()=>[row],rowAction:async()=>{status='LOCKED';},acceptOptionalConfirm:async()=>{},exactRow:async()=>row};
  await assert.rejects(studentStatus(p,d,{},'list'),e=>e.code==='ERR_ASSERTION');
  assert.equal(status,'ACTIVE');assert.equal(restored,1);
});
test('personal settings cannot satisfy system settings; dependent save/reset stays blocked',async()=>{
  const p={nav:async()=>{},field:async()=>{throw new Error('Only personal profile exists');},driver:{getCurrentUrl:async()=>'https://staging.hotung9108.me/admin/settings'}};
  await assert.rejects(systemSettingsAvailable(p,{},{}),e=>e.code==='ERR_ASSERTION');
  await assert.rejects(systemSettingsPersistence(p,{},{}),e=>e.code==='QA31_BLOCKED'&&e.dependsOn.includes('QA31-048'));
});
test('system settings workflow checks persistence across reload and defaults after reset',async()=>{
  for(const persist of [true,false]) {
    let value='default',saved='default';const model={getAttribute:async()=>value,findElements:async()=>['default','alternate'].map(v=>({getAttribute:async()=>v}))};
    const p={nav:async()=>{},field:async()=>model,select:async(_,v)=>{value=v;},button:async pattern=>{if(pattern.test('Save Configuration')){if(persist)saved=value;}else if(pattern.test('Reset to Defaults')){value='default';saved='default';}},driver:{navigate:()=>({refresh:async()=>{value=saved;}})},ready:async()=>{},acceptOptionalConfirm:async()=>{}};
    if(persist)await systemSettingsPersistence(p,{},{});else await assert.rejects(systemSettingsPersistence(p,{},{}),/không giữ sau reload/);
    assert.equal(value,'default');
  }
});
