import '../config/runtime.js';
import {readdir,readFile,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out=resolve(process.argv[2]);
const secrets=Object.entries(process.env).filter(([k,v])=>/PASSWORD|TOKEN|SECRET/.test(k)&&v&&v.length>=6).map(([,v])=>v);
const files=[];
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory()){if(e.name!=='sources')await walk(p);}else if(/\.(html|md|csv|json)$/.test(e.name)&&e.name!=='handoff-verification.json')files.push(p);}}
await walk(out);const exposed=[];const hashes=[];
for(const p of files){const bytes=await readFile(p);const text=bytes.toString('utf8');if(secrets.some(s=>text.includes(s)))exposed.push(p);assert.ok(!text.includes('\ufffd'),`Invalid UTF-8: ${p}`);hashes.push({file:p.slice(out.length+1),sha256:createHash('sha256').update(bytes).digest('hex')});}
assert.equal(exposed.length,0,`Secret found in handoff file(s): ${exposed.join(', ')}`);
const data=JSON.parse(await readFile(join(out,'ket-qua-doi-chieu.json'),'utf8'));
assert.equal(data.bugs.length,27);assert.equal(data.cases.length,170);
const page=await readFile(join(out,'BAO_CAO_KIEM_TRA_LAI.html'),'utf8');
assert.ok(page.includes('Kiểm tra lại manual'));assert.equal((page.match(/<tr>/g)||[]).length,171);assert.equal((page.match(/data:image\/png;base64,/g)||[]).length,6);
await writeFile(join(out,'handoff-verification.json'),JSON.stringify({checkedFiles:files.length,secretMatches:0,utf8Valid:true,bugs:27,cases:170,embeddedScreenshots:6,hashes},null,2));
console.log(JSON.stringify({checkedFiles:files.length,secretMatches:0,utf8Valid:true,bugs:27,cases:170,embeddedScreenshots:6}));
