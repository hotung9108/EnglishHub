// Catalog inspection only: no environment loading, requests, or test execution.
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const args=process.argv.slice(2);
assert.ok(args.every(a=>['--list','--check'].includes(a)||a.startsWith('--suite=')),'Use --list, --check or --suite=<id>; API execution is not enabled for imported collections.');
const catalog=JSON.parse(await readFile(new URL('./catalog.json',import.meta.url),'utf8'));
const id=args.find(a=>a.startsWith('--suite='))?.slice(8);
const suites=catalog.suites.filter(s=>!id||s.id===id);
assert.ok(suites.length,'Unknown suite');
function requests(items){return(items||[]).reduce((n,i)=>n+(i.request?1:0)+requests(i.item),0);}
if(args.includes('--check'))for(const s of suites){const c=JSON.parse(await readFile(new URL(s.collection,import.meta.url),'utf8'));assert.equal(requests(c.item),s.requestCount,s.id);}
console.log(JSON.stringify({status:catalog.status,executionEnabled:false,suites:suites.map(s=>({id:s.id,title:s.title,role:s.role,status:s.status,legacyRequirements:s.legacyRequirements,requestCount:s.requestCount,collection:s.collection})),check:args.includes('--check')?'JSON_AND_COUNTS_VALIDATED_NOT_EXECUTED':undefined},null,2));
