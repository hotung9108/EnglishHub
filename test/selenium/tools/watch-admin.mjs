import {createInterface} from 'node:readline/promises';
import {spawn} from 'node:child_process';
import {adminCases} from '../tests/admin/cases.js';
import {parseOptions} from '../support/admin/options.js';
const rl=createInterface({input:process.stdin,output:process.stdout});
try {
  for(const c of adminCases)console.log(`${c.id} | ${c.title}`);
  const input=(await rl.question('\nNhap ma (7 / 007 / QA31-007) hoac ten case; Enter de thoat: ')).trim();
  if(input){const {selected}=parseOptions([`--case=${input}`],adminCases);rl.close();const child=spawn(process.execPath,['run-admin.js','--watch','--slow=2500',`--case=${selected[0].id}`],{stdio:'inherit',windowsHide:true});process.exitCode=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve);});}
}catch(e){console.error(e.message);process.exitCode=2;}finally{rl.close();}
