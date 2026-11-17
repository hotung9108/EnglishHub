import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {scenarios,caseFiles} from "../common/runner/registry.js";
const root=new URL("..",import.meta.url);
const cli=(file,...args)=>JSON.parse(execFileSync(process.execPath,[fileURLToPath(new URL(file,root)),...args],{encoding:'utf8'}));
test('every catalog entry resolves to exactly one source or an approved exclusion',async()=>{
 const catalog=JSON.parse(await readFile(new URL('catalog/cases.json',root),'utf8'));
 const index=JSON.parse(await readFile(new URL('catalog/case-index.json',root),'utf8'));
 assert.equal(catalog.cases.length,170);assert.equal(Object.keys(scenarios).length,168);
 for(const c of catalog.cases){assert.ok(index[c.id]);if(c.scopeExclusion){assert.ok(!scenarios[c.id]);continue;}assert.equal(index[c.id].sourceFile,caseFiles[c.id]);assert.ok((await stat(new URL(caseFiles[c.id],root))).isFile());}
});
test('batch inspection accounts for 170 distinct IDs without starting a run',()=>{
 const plan=cli('common/runner/run-batches.js','--list');assert.equal(plan.batches.length,7);assert.equal(plan.batches.at(-1).length,20);assert.equal(new Set(plan.batches.flat()).size,170);
});
test('UC source folders and Qase mapping agree without changing case IDs',async()=>{
 const catalog=JSON.parse(await readFile(new URL('catalog/cases.json',root),'utf8'));
 const mapping=JSON.parse(await readFile(new URL('integrations/qase/mapping.json',root),'utf8'));
 const layout=JSON.parse(await readFile(new URL('integrations/qase/uc-layout.json',root),'utf8'));
 assert.equal(Object.keys(mapping.cases).length,170);
 assert.equal(new Set(Object.values(mapping.cases)).size,170);
 for(const c of catalog.cases){
  assert.equal(layout.cases[c.id].qaseCaseId,mapping.cases[c.id]);
  if(c.scopeExclusion){assert.equal(layout.cases[c.id].suiteId,layout.excludedSuiteId);continue;}
  const uc=c.requirement.match(/UC\d{3}/)?.[0];
  if(uc){assert.ok(caseFiles[c.id].includes(`/${uc.toLowerCase()}/`),c.id);assert.equal(layout.cases[c.id].suiteId,layout.ucSuites[uc]);}
  else{assert.ok(caseFiles[c.id].startsWith('cases/08-nfr/'));assert.equal(layout.cases[c.id].suiteId,layout.nfrSuiteId);}
 }
});
test('finder resolves ID, requirement and role from the canonical catalog',()=>{
 const one=cli('tools/find-cases.js','ASG_009');assert.equal(one.total,1);assert.equal(one.cases[0].sourceFile,'cases/04-assignments/uc012/teacher-assignments.cases.js');
 const group=cli('tools/find-cases.js','--role=teacher','--requirement=UC012');assert.ok(group.total>0);assert.ok(group.cases.every(c=>c.role==='teacher'&&c.requirement.includes('UC012')));
});
test('check-only and role selection inspect the same registry; unsupported flags cannot run staging',()=>{
 const view=cli('run.js','--role=teacher','--check-only');assert.ok(view.selected>0&&view.selected<170);assert.equal(view.cases.length,view.selected);
 const bad=spawnSync(process.execPath,[fileURLToPath(new URL('run.js',root)),'--unknown-option'],{encoding:'utf8'});assert.notEqual(bad.status,0);assert.match(bad.stderr,/Unsupported option/);
});
