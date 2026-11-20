import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {collectReports,buildReportIndex} from '../common/runner/report-catalog.js';
test('report catalog keeps original results, detects partial runs and rejects evidence outside reports',async()=>{
 const temp=await mkdtemp(join(tmpdir(),'report-index-'));try{
  const root=join(temp,'reports'),catalogPath=join(temp,'cases.json');await mkdir(join(root,'run','ASG_009'),{recursive:true});await mkdir(join(root,'partial'));await mkdir(join(root,'broken'));
  await writeFile(catalogPath,JSON.stringify({cases:[{id:'ASG_009',title:'Tiêu đề',requirement:'UC012'}]}));
  await writeFile(join(temp,'outside.png'),'private');await writeFile(join(root,'run','ASG_009','safe.png'),'image');
  const payload={total:1,finishedAt:'2026-11-17T00:00:00Z',complete:true,counts:{PASSED:1},cleanupDisposition:{deleted:2,retained:1,status:'RETAINED_DATA_REQUIRES_FOLLOWUP'},results:[{id:'ASG_009',status:'FAILED',title:'</script><script>alert(1)</script>',screenshots:['ASG_009/safe.png','../../outside.png'],testData:'secret-not-for-index',expected:'not copied'}]};
  const original=JSON.stringify(payload);await writeFile(join(root,'run','summary.json'),original);await writeFile(join(root,'partial','summary.json'),JSON.stringify({total:2,results:[]}));await writeFile(join(root,'broken','summary.json'),'{bad');
  const data=await collectReports({root,catalogPath});assert.equal(data.runs.length,2);assert.equal(data.warnings.length,1);assert.equal(data.defaultRun,'run');const r=data.runs.find(r=>r.key==='run');assert.equal(r.counts.FAILED,1);assert.equal(r.countMismatch,true);assert.equal(r.cleanup.retained,1);assert.deepEqual(r.results[0].images,['run/ASG_009/safe.png']);assert.equal(data.runs.find(r=>r.key==='partial').complete,false);
  await buildReportIndex({root,catalogPath});assert.equal(await readFile(join(root,'run','summary.json'),'utf8'),original);const html=await readFile(join(root,'index.html'),'utf8');assert.ok(!html.includes('secret-not-for-index'));assert.ok(!html.includes('</script><script>alert(1)</script>'));assert.ok(html.includes('\\u003c/script>'));
 }finally{await rm(temp,{recursive:true,force:true});}
});
