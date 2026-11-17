import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { Blocked, executeCase, redact, report } from "../common/runner/core.js";
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const sample={id:'TC_001',row:2,title:'<script>alert(1)</script>',expected:'Expected business result',steps:'1. Act 2. Assert',testData:'secret-password'};
const temporary=new URL("../.cache/remake-unit",import.meta.url);await mkdir(temporary,{recursive:true});
const tmpdir=()=>temporary.pathname.replace(/^\/([A-Za-z]:)/,'$1');
const fake=()=>({executeScript:async()=>null,takeScreenshot:async()=>'iVBORw0KGgo=',quit:async()=>{}});
async function run(procedure,overrides={}){
  const output=await mkdtemp(join(tmpdir(),'englishhub-srs-'));
  try{return await executeCase(sample,procedure,{output,secrets:['secret-password'],buildDriver:async()=>fake(),...overrides});}
  finally{await rm(output,{recursive:true,force:true});}
}
test('a failed business assertion is FAILED, never converted to PASSED',async()=>{
  const result=await run({run:ctx=>ctx.step('Assert expected result',()=>assert.equal(1,2))});assert.equal(result.status,'FAILED');assert.ok(result.screenshots.length);assert.equal(result.log.find(e=>e.phase==='Execution').status,'FAILED');
});
test('a known product bug remains FAILED even if screenshot acquisition also fails',async()=>{
  const driver=fake();driver.takeScreenshot=async()=>{throw new Error('evidence unavailable');};const result=await run({run:ctx=>ctx.step('Bug',()=>assert.fail('product mismatch'))},{buildDriver:async()=>driver});assert.equal(result.status,'FAILED');assert.ok(result.evidenceErrors.length);
});
test('unavailable fixture is BLOCKED with cleanup still executed',async()=>{
  let cleaned=false;const result=await run({prepare:cleanup=>{cleanup('Undo partial setup',async()=>{cleaned=true;});throw new Error('prerequisite unavailable');},run:()=>assert.fail('must not run')});assert.equal(result.status,'BLOCKED');assert.equal(cleaned,true);
});
test('ambiguous requirement is BLOCKED, never accepted as alternate expected',async()=>{const result=await run({run:ctx=>ctx.step('Oracle',()=>{throw new Blocked('Specification missing boundary');})});assert.equal(result.status,'BLOCKED');});
test('an unconfirmed assumption in expected cannot be reported as acceptance PASS',async()=>{
  const output=await mkdtemp(join(tmpdir(),'unconfirmed-'));
  try{let executed=false;const result=await executeCase({...sample,expected:'Giả định quy tắc; cần xác nhận'},{run:()=>{executed=true;}},{output,buildDriver:async()=>fake()});assert.equal(result.status,'BLOCKED');assert.equal(executed,false);}finally{await rm(output,{recursive:true,force:true});}
});
test('missing implementation is SKIPPED, not passed',async()=>{assert.equal((await run(undefined)).status,'SKIPPED');});
test('successful assertions without mandatory evidence cannot pass',async()=>{const driver=fake();driver.takeScreenshot=async()=>{throw new Error('no screenshot');};const result=await run({run:ctx=>ctx.step('Assert',()=>assert.equal(1,1))},{buildDriver:async()=>driver});assert.equal(result.status,'BLOCKED');});
test('cleanup failure blocks successful assertions and records error',async()=>{const result=await run({prepare:cleanup=>cleanup('Cleanup fixture',()=>{throw new Error('cleanup failed');}),run:ctx=>ctx.step('Assert',()=>assert.equal(1,1))});assert.equal(result.status,'BLOCKED');assert.equal(result.cleanupFailed,true);});
test('cleanup order is reverse registration and all tasks run despite errors',async()=>{const order=[];await run({prepare:cleanup=>{cleanup('first',()=>order.push(1));cleanup('second',()=>{order.push(2);throw new Error('failure');});cleanup('third',()=>order.push(3));},run:ctx=>ctx.step('Act',()=>true)});assert.deepEqual(order,[3,2,1]);});
test('passwords, tokens and signed URLs are redacted recursively',()=>{const result=redact({password:'p',data:['secret-password','Bearer abc.def.ghi'],uploadUrl:'https://signed',nested:{accessToken:'token',score:0}},['secret-password']);assert.deepEqual(result,{password:'[REDACTED]',data:['[REDACTED]','Bearer [REDACTED]'],uploadUrl:'[REDACTED]',nested:{accessToken:'[REDACTED]',score:0}});});
test('HTML report escapes app/workbook content and preserves exact counts',async()=>{const output=await mkdtemp(join(tmpdir(),'englishhub-report-'));try{const result=await report(output,{runId:'unit',total:2,results:[{...sample,status:'FAILED',log:[],durationMs:10},{...sample,id:'TC_002',status:'BLOCKED',log:[],durationMs:20}]});assert.deepEqual(result.counts,{PASSED:0,FAILED:1,BLOCKED:1,SKIPPED:0});const html=await readFile(join(output,'index.html'),'utf8');assert.ok(!html.includes('<script>alert(1)</script>'));assert.ok(html.includes('&lt;script&gt;'));}finally{await rm(output,{recursive:true,force:true});}});
test('170 IDs retain traceability: 168 procedures and two approved exclusions',()=>{const list=JSON.parse(execFileSync(process.execPath,[fileURLToPath(new URL("../common/runner/run.js",import.meta.url)),'--list'],{encoding:'utf8'}));assert.equal(list.total,170);assert.equal(list.procedures,168);assert.equal(list.active,168);assert.equal(list.excluded,2);assert.equal(list.pendingOracleOrFixture,14);assert.equal(new Set(list.cases.map(c=>c.id)).size,170);assert.ok(list.cases.every(c=>(c.procedure||c.scopeExclusion)&&c.requirement));assert.deepEqual(list.cases.filter(c=>c.scopeExclusion).map(c=>c.id),['DO_017','GRD_012']);});

test('approved scope exclusion persists a skip without browser or fixture execution',async()=>{
  const output=await mkdtemp(join(tmpdir(),'englishhub-excluded-'));
  const scopeExclusion={source:'User confirmation',date:'2026-11-16',reason:'Outside approved scope'};
  try{
    const result=await executeCase({...sample,scopeExclusion},{prepare:()=>assert.fail('must not prepare'),run:()=>assert.fail('must not execute')},{output,buildDriver:()=>assert.fail('must not open browser')});
    assert.equal(result.status,'SKIPPED');assert.equal(result.reason,scopeExclusion.reason);
    assert.equal(result.log[0].phase,'Scope');assert.equal(result.screenshots.length,0);
    const saved=JSON.parse(await readFile(join(output,sample.id,'execution.json'),'utf8'));
    assert.equal(saved.status,'SKIPPED');assert.deepEqual(saved.scopeExclusion,scopeExclusion);
  }finally{await rm(output,{recursive:true,force:true});}
});

test('report warns about older code without rewriting a failed execution',async()=>{
  const output=await mkdtemp(join(tmpdir(),'englishhub-version-'));
  try{
    const result=await report(output,{runId:'review',total:1,currentProcedureSha256:'new',outdatedCaseIds:[sample.id],results:[{...sample,status:'FAILED',sourceProcedureSha256:'old',log:[],durationMs:10}]});
    assert.equal(result.results[0].status,'FAILED');
    assert.equal(result.counts.FAILED,1);
    const html=await readFile(join(output,'index.html'),'utf8');
    assert.ok(html.includes('Kết quả lịch sử: bộ chạy đã thay đổi'));
    assert.ok(!html.includes('<script>alert(1)</script>'));
  }finally{await rm(output,{recursive:true,force:true});}
});
