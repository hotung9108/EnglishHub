import {createHash} from 'node:crypto';
import {readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

export async function procedureFingerprint() {
  const root=fileURLToPath(new URL("../..",import.meta.url));
  const names=[];
  async function visit(directory){for(const e of await readdir(join(root,directory),{withFileTypes:true})){const name=join(directory,e.name);if(e.name.startsWith('.')||['reports','node_modules','__pycache__'].includes(e.name))continue;if(e.isDirectory())await visit(name);else if(/\.(js|mjs|py|json|mp3|wav|txt|pdf)$/.test(name))names.push(name);}}
  for(const dir of ['cases','common','catalog','config','fixtures','integrations','tools','tests'])await visit(dir);
  names.push('run.js','package.json','package-lock.json');names.sort();
  const hash=createHash('sha256');
  const files={};
  for(const name of names){
    const bytes=await readFile(join(root,name));
    hash.update(name.replaceAll('\\','/')+'\0');
    hash.update(bytes);
    files[name.replaceAll('\\','/')]=createHash('sha256').update(bytes).digest('hex');
  }
  return {sha256:hash.digest('hex'),files};
}
