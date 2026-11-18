import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join,extname} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {collectReports} from '../common/runner/report-catalog.js';
const args=process.argv.slice(2);assert.ok(args.every(a=>a.startsWith('--run='))&&args.length<=1,'Use --run=<directory name from reports index>');
const root=fileURLToPath(new URL('../reports/',import.meta.url));
const data=await collectReports({root,catalogPath:fileURLToPath(new URL('../catalog/cases.json',import.meta.url))});
const key=args[0]?.slice(6)||data.defaultRun;const run=data.runs.find(r=>r.key===key);assert.ok(run,'Run not found in existing reports');
let embedded=0;
for(const c of run.results){const last=c.images.at(-1);c.images=[];c.execution=null;if(last){const bytes=await readFile(join(root,...last.split('/').map(decodeURIComponent)));const mime=extname(last).toLowerCase()==='.png'?'image/png':extname(last).toLowerCase()==='.webp'?'image/webp':'image/jpeg';c.images=[`data:${mime};base64,${bytes.toString('base64')}`];embedded++;}}
run.report=null;run.summary=null;data.runs=[run];data.defaultRun=run.key;data.warnings=[];data.exported=true;
const template=await readFile(new URL('../common/runner/report-portal.html',import.meta.url),'utf8');
const safe=JSON.stringify(data).replaceAll('<','\\u003c').replaceAll('\u2028','\\u2028').replaceAll('\u2029','\\u2029');
const dir=join(root,'exports');await mkdir(dir,{recursive:true});
const name=run.key.replace(/[^a-zA-Z0-9_.-]/g,'_')+'-'+createHash('sha256').update(run.key).digest('hex').slice(0,6)+'.html';
await writeFile(join(dir,name),template.replace('REPORT_CATALOG_JSON',safe));
console.log(JSON.stringify({file:'reports/exports/'+name,run:run.key,cases:run.results.length,embeddedFinalScreenshots:embedded,standalone:true,note:'One final screenshot per case when present; original results unchanged. No raw API log files exported.'}));
