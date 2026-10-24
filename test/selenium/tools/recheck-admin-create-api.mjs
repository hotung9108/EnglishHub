// One targeted API diagnostic, separate from Selenium case counts.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {root,loadConfig,loadLocalEnv} from '../config/env.js';
import {StagingApi} from '../support/teacher/expanded-api.js';
import {sanitize} from '../utils/reporter.js';
const run=process.argv[2];assert.match(run||'',/^qa31-\d{4}-\d{2}-\d{2}T[\dTZ-]+$/);
const directory=path.join(root,'reports',run);
assert.equal(JSON.parse(await fs.readFile(path.join(directory,'summary.json'),'utf8')).status,'COMPLETED');
loadLocalEnv();const config=loadConfig();assert.equal(config.baseUrl,'https://staging.hotung9108.me');
const nonce=crypto.randomBytes(6).toString('hex'),email=`qa31-${nonce}-admin-api-recheck@example.invalid`,password=`Qa31!${crypto.randomBytes(12).toString('hex')}Aa7`;
config.users.qa31diagnostic={password};
const api=new StagingApi(config),result={startedAt:new Date().toISOString(),scope:'Targeted API diagnostic, not an additional Selenium case',requested:{fullName:'QA Admin API Recheck',email,role:'ADMIN'}};
try {
  await api.login('admin');
  try {result.created=await api.request('admin','POST','/admin/users',{...result.requested,password});result.createStatus=api.events.at(-1).status;}
  catch(error){result.createStatus=error.status;result.createError=error.message;}
  const list=await api.get('admin',`/admin/users?q=${encodeURIComponent(email)}&limit=100`);
  result.matches=list.data.filter(u=>u.email===email);result.verifiedAdmin=result.matches.some(u=>u.role==='ADMIN');
  console.log(`Admin API create: HTTP ${result.createStatus}; matched users=${result.matches.length}; verified ADMIN=${result.verifiedAdmin}`);
} catch(error){result.error=error.message;process.exitCode=1;}
finally {
  result.finishedAt=new Date().toISOString();result.apiObservations=api.events.filter(e=>e.endpoint!=='/auth/login');
  await fs.writeFile(path.join(directory,'admin-api-create-recheck.json'),sanitize(JSON.stringify(result,null,2),config.users));
}
