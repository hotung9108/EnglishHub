import {readFile,writeFile,readdir,stat,mkdir} from 'node:fs/promises';
import {resolve,join,relative,isAbsolute,extname} from 'node:path';
const statuses=['PASSED','FAILED','BLOCKED','SKIPPED'];
const inside=(root,p)=>{const r=relative(root,p);return !isAbsolute(r)&&r!=='..'&&!r.startsWith('..'+(process.platform==='win32'?'\\':'/'));};
const href=p=>p.replaceAll('\\','/').split('/').map(encodeURIComponent).join('/');
export async function collectReports({root,catalogPath}){
 root=resolve(root);
 const catalog=JSON.parse((await readFile(catalogPath,'utf8')).replace(/^\uFEFF/,''));
 const refs=new Map(catalog.cases.map(c=>[c.id,c]));
 const runs=[],warnings=[];
 async function fileLink(dir,name){if(typeof name!=='string'||isAbsolute(name))return null;const p=resolve(dir,name);if(!inside(root,p))return null;try{if((await stat(p)).isFile())return href(relative(root,p));}catch{}return null;}
 async function visit(dir,depth){
  let entries;try{entries=await readdir(dir,{withFileTypes:true});}catch(e){warnings.push({path:relative(root,dir),message:'Không đọc được thư mục'});return;}
  if(entries.some(e=>e.isFile()&&e.name==='summary.json')){
   try{
    const source=JSON.parse((await readFile(join(dir,'summary.json'),'utf8')).replace(/^\uFEFF/,''));
    if(!Array.isArray(source.results))throw Error('Không có results[] theo định dạng Selenium hiện hành');
    const counts=Object.fromEntries(statuses.map(s=>[s,0]));const results=[];const seen=new Set();
    for(const r of source.results){if(typeof r.id!=='string')continue;const ref=refs.get(r.id);const status=statuses.includes(r.status)?r.status:'UNKNOWN';counts[status]=(counts[status]||0)+1;seen.add(r.id);
     const images=[];for(const p of Array.isArray(r.screenshots)?r.screenshots:[]){if(!['.png','.jpg','.jpeg','.webp'].includes(extname(String(p)).toLowerCase()))continue;const link=await fileLink(dir,p);if(link)images.push(link);}
     results.push({id:r.id,title:String(r.title||ref?.title||r.id),requirement:String(r.requirement||ref?.requirement||''),status,startedAt:r.startedAt||null,durationMs:Number.isFinite(r.durationMs)?r.durationMs:null,images,execution:await fileLink(dir,`${r.id}/execution.json`)});
    }
    const total=Number.isInteger(source.total)?source.total:results.length;
    const countMismatch=!!source.counts&&statuses.some(s=>(source.counts[s]||0)!==counts[s]);
    const cleanup=source.cleanupDisposition||{};
    runs.push({key:relative(root,dir).replaceAll('\\','/')||'.',name:relative(root,dir).replaceAll('\\','/')||'reports',runId:String(source.runId||''),startedAt:source.startedAt||results.find(r=>r.startedAt)?.startedAt||null,finishedAt:source.finishedAt||null,status:String(source.status||'UNKNOWN'),total,executed:results.length,counts,complete:!!source.finishedAt&&seen.size===total&&source.complete!==false,fullSuite:total===catalog.cases.length&&seen.size===catalog.cases.length,duplicateIds:results.length!==seen.size,countMismatch,aggregated:Array.isArray(source.executions)||!!source.currentProcedureSha256,procedureSha256:typeof source.procedureSha256==='string'?source.procedureSha256:null,srsSha256:source.source?.srs?.sha256||null,cleanup:{status:cleanup.status||'NOT_RECORDED',deleted:Number.isFinite(cleanup.deleted)?cleanup.deleted:null,retained:Number.isFinite(cleanup.retained)?cleanup.retained:null,errors:Array.isArray(source.cleanupErrors)?source.cleanupErrors.length:null},report:await fileLink(dir,'index.html'),summary:await fileLink(dir,'summary.json'),results});
   }catch(e){warnings.push({path:relative(root,join(dir,'summary.json')).replaceAll('\\','/'),message:'Bỏ qua summary không đúng định dạng hoặc không đọc được'});}
  }
  if(depth>=5)return;
  for(const e of entries){if(!e.isDirectory()||e.isSymbolicLink()||e.name.startsWith('.')||['tmp','node_modules','__pycache__'].includes(e.name)||/^[A-Z]+_\d+$/.test(e.name))continue;await visit(join(dir,e.name),depth+1);}
 }
 await visit(root,0);
 runs.sort((a,b)=>String(b.finishedAt||b.startedAt||'').localeCompare(String(a.finishedAt||a.startedAt||'')));
 const requirementNames=Object.fromEntries(Object.entries(catalog.specs||{}).map(([id,s])=>[id,s.text?.match(/Tên Use case\s*\n([^\n]+)/)?.[1]||id]));
 return {generatedAt:new Date().toISOString(),expectedCases:catalog.cases.length,requirementNames,defaultRun:runs.find(r=>r.complete&&r.fullSuite&&!r.aggregated)?.key||runs.find(r=>r.complete)?.key||runs[0]?.key||null,runs,warnings};
}
export async function buildReportIndex(options){
 await mkdir(options.root,{recursive:true});
 const data=await collectReports(options);
 const template=await readFile(new URL('./report-portal.html',import.meta.url),'utf8');
 const safe=JSON.stringify(data).replaceAll('<','\\u003c').replaceAll('\u2028','\\u2028').replaceAll('\u2029','\\u2029');
 await writeFile(join(options.root,'catalog.json'),JSON.stringify(data,null,2)+'\n');
 await writeFile(join(options.root,'index.html'),template.replace('REPORT_CATALOG_JSON',safe));
 return {runs:data.runs.length,cases:data.runs.reduce((n,r)=>n+r.results.length,0),warnings:data.warnings.length};
}
