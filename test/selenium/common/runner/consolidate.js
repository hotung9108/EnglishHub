import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { report } from "./core.js";
import { procedureFingerprint } from "./provenance.js";
import { buildReportIndex } from './report-catalog.js';

const paths=process.argv.slice(2);assert.ok(paths.length,'Pass report directories in execution order; latest execution wins, including failures');
const output=fileURLToPath(new URL("../../reports/srs-reviewed",import.meta.url));await mkdir(output,{recursive:true});
const catalog=JSON.parse(await readFile(new URL("../../catalog/cases.json",import.meta.url),'utf8'));
const results=new Map();const executions=[];const cleanupErrors=[];const retainedFixtures=[];
for(const path of paths){
  const root=resolve(path);const run=JSON.parse(await readFile(join(root,'summary.json'),'utf8'));
  if(run.source?.srs)assert.equal(run.source.srs.sha256,catalog.sources.srs.sha256);
  executions.push({directory:relative(output,root).replaceAll('\\','/'),runId:run.runId,executed:run.results.length,total:run.total,finishedAt:run.finishedAt,procedureSha256:run.procedureSha256});
  let cleanup;try{cleanup=JSON.parse(await readFile(join(root,'cleanup.json'),'utf8'));}catch{cleanupErrors.push({runId:run.runId,error:'Cleanup file missing; incomplete execution must be recovered'});}
  for(const error of cleanup?.errors||[])cleanupErrors.push({runId:run.runId,...error});
  for(const resource of cleanup?.resources||[])if(resource.state==='ARCHIVED')retainedFixtures.push({runId:run.runId,...resource});
  for(const result of run.results){
    const file=relative(output,join(root,result.id,'execution.json')).replaceAll('\\','/');
    const reference=catalog.cases.find(c=>c.id===result.id);assert.ok(reference,`Unknown result ID ${result.id}`);
    results.set(result.id,{...reference,...result,sourceRun:run.runId,sourceProcedureSha256:run.procedureSha256,screenshots:(result.screenshots||[]).map(f=>relative(output,join(root,f)).replaceAll('\\','/')),evidence:[file,...(result.evidence||[]).map(f=>relative(output,join(root,f)).replaceAll('\\','/'))]});
  }
}
const ordered=catalog.cases.map(test=>results.get(test.id)||{...test,status:'SKIPPED',reason:'No completed execution recorded yet',log:[],screenshots:[],evidence:[],durationMs:0});
const run={runId:'SRS-reviewed-latest-executions',baseUrl:'https://staging.hotung9108.me',total:catalog.total,source:catalog.sources,executions,cleanupErrors,retainedFixtures,results:ordered,status:cleanupErrors.length?'CLEANUP_FAILED':ordered.some(r=>r.status==='FAILED')?'FAILED':ordered.some(r=>r.status!=='PASSED')?'INCOMPLETE':'PASSED',finishedAt:new Date().toISOString()};
const fingerprint=await procedureFingerprint();
if (run.status === 'INCOMPLETE' && ordered.every(r => r.status === 'PASSED' || (r.status === 'SKIPPED' && r.startedAt && r.scopeExclusion))) run.status = 'PASSED';
run.currentScopeExclusions = catalog.cases.filter(t => t.scopeExclusion).map(t => ({ id: t.id, ...t.scopeExclusion }));
run.currentProcedureSha256=fingerprint.sha256;run.currentProcedureFiles=fingerprint.files;
run.outdatedCaseIds=ordered.filter(r=>r.startedAt&&r.sourceProcedureSha256!==fingerprint.sha256).map(r=>r.id);
const summary=await report(output,run);console.log(output,JSON.stringify(summary.counts));
await writeFile(join(output,'cleanup.json'),JSON.stringify({errors:cleanupErrors,resources:retainedFixtures,executions},null,2));
await writeFile(join(output,'fixture-journal.json'),JSON.stringify({retainedFixtures,executions},null,2));
await buildReportIndex({root:fileURLToPath(new URL('../../reports/',import.meta.url)),catalogPath:fileURLToPath(new URL('../../catalog/cases.json',import.meta.url))});
