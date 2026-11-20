// Unified offline search. Never imports runners or loads credentials.
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const args=process.argv.slice(2);
assert.ok(args.filter(a=>a.startsWith('--')).every(a=>/^--scope=(selenium|api|legacy|bugs|edges)$/.test(a)||/^--role=(admin|teacher|student|shared)$/.test(a)),'Use --scope=selenium|api|legacy|bugs|edges and --role=admin|teacher|student|shared');
const scope=args.find(a=>a.startsWith('--scope='))?.slice(8)||'selenium';
const role=args.find(a=>a.startsWith('--role='))?.slice(7);
const query=args.filter(a=>!a.startsWith('--')).join(' ').toLocaleLowerCase('vi');
let items;
if(scope==='selenium'){
 const catalog=await read('selenium/catalog/cases.json'),index=await read('selenium/catalog/case-index.json');
 items=catalog.cases.map(c=>({id:c.id,title:c.title,requirement:c.requirement,...index[c.id],status:c.scopeExclusion?'EXCLUDED':'DRAFT',path:index[c.id].sourceFile?'selenium/'+index[c.id].sourceFile:'selenium/catalog/cases.json'}));
}else if(scope==='api')items=(await read('api/catalog.json')).suites.map(s=>({...s,path:'api/'+s.collection}));
else if(scope==='legacy')items=(await read('docs/review/selenium-candidates.json')).cases;
else if(scope==='bugs')items=(await read('docs/review/historical-bugs.json')).bugs;
else items=(await read('docs/review/edge-candidates.json')).entries;
items=items.filter(i=>(!role||i.role===role)&&(!query||JSON.stringify(i).toLocaleLowerCase('vi').includes(query)));
console.log(JSON.stringify({scope,total:items.length,items},null,2));
