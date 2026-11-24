import assert from 'node:assert/strict';
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join,resolve,relative } from 'node:path';

const root=fileURLToPath(new URL("../..",import.meta.url));
const catalog=JSON.parse(await readFile(new URL("../../catalog/cases.json",import.meta.url),'utf8'));
if(process.argv.includes('--list')){
 console.log(JSON.stringify({total:catalog.total,batches:Array.from({length:Math.ceil(catalog.cases.length/25)},(_,i)=>catalog.cases.slice(i*25,(i+1)*25).map(c=>c.id))},null,2));
}else{
const resume=process.argv.slice(2).find(a=>a.startsWith('--resume='))?.slice(9);
const directory=resume?resolve(resume):join(root,'reports',`batch-session-${new Date().toISOString().replace(/[:.]/g,'-')}`);
assert.ok(!relative(join(root,'reports'),directory).startsWith('..'),'Batch session must be inside Selenium reports');
await mkdir(directory,{recursive:true});
const path=join(directory,'session.json');
let session;
if(resume)session=JSON.parse(await readFile(path,'utf8'));
else session={sources:catalog.sources,startedAt:new Date().toISOString(),batches:Array.from({length:Math.ceil(catalog.cases.length/25)},(_,i)=>({ids:catalog.cases.slice(i*25,(i+1)*25).map(c=>c.id),directory:join(directory,`batch-${i+1}`),state:'PENDING'}))};
assert.equal(session.sources.workbook.sha256,catalog.sources.workbook.sha256);
assert.equal(session.batches.flatMap(b=>b.ids).length,catalog.total,'A full batch session must account for all reviewed cases');
assert.deepEqual(new Set(session.batches.flatMap(b=>b.ids)),new Set(catalog.cases.map(c=>c.id)));
const run=(script,args,env={})=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,[join(root,'common','runner',script),...args],{cwd:root,env:{...process.env,...env},stdio:'inherit',windowsHide:true});child.once('error',reject);child.once('exit',code=>resolve(code??1));});
const save=()=>writeFile(path,JSON.stringify(session,null,2));
await save();
for(const batch of session.batches){
  assert.ok(!relative(directory,resolve(batch.directory)).startsWith('..'),'Batch path must stay inside this session');
  if(batch.state==='COMPLETE')continue;
  if(batch.state==='RUNNING'){
    try{const journal=JSON.parse(await readFile(join(batch.directory,'fixture-journal.json'),'utf8'));if(journal.length){const code=await run('recover-cleanup.js',[batch.directory]);assert.equal(code,0,'Recover interrupted fixtures before rerunning batch');}}
    catch(error){if(error.code!=='ENOENT')throw error;}
    (batch.previousRuns??=[]).push(batch.directory);batch.directory=join(directory,`retry-${Date.now()}`);
  }
  batch.state='RUNNING';await save();
  batch.exitCode=await run('run.js',batch.ids,{SELENIUM_OUTPUT_DIR:batch.directory});
  const summary=JSON.parse(await readFile(join(batch.directory,'summary.json'),'utf8'));
  assert.equal(summary.results.length,batch.ids.length,'Batch stopped before all selected cases were recorded; resume this session');
  assert.ok(summary.finishedAt,'Batch cleanup did not finish; resume this session');
  assert.equal(summary.cleanupErrors?.length,0,'Resolve cleanup errors before completing this batch; resume will recover its journal');
  batch.state='COMPLETE';batch.counts=summary.counts;await save();
}
session.finishedAt=new Date().toISOString();await save();
assert.equal(await run('consolidate.js',session.batches.map(b=>b.directory)),0,'Consolidated report generation failed');
console.log(`Batch session: ${directory}`);process.exitCode=session.batches.some(b=>b.exitCode!==0)?1:0;

}
