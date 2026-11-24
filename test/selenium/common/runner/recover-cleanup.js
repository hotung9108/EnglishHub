import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import "../../config/runtime.js";
import { FixturePool } from "../fixtures/pool.js";
const output=resolve(process.argv[2]);
const resources=JSON.parse(await readFile(resolve(output,'fixture-journal.json'),'utf8'));
const apiLog=JSON.parse(await readFile(resolve(output,'api-log.json'),'utf8'));
for(const e of apiLog)if(e.method==='POST'&&/^\/classes\/\d+\/members$/.test(e.path)&&e.response?.memberId&&!resources.some(r=>r.type==='member'&&r.id===e.response.memberId))resources.push({type:'member',id:e.response.memberId,classId:Number(e.path.split('/')[2]),studentId:e.request.studentId,state:'CREATED'});
const identity=resources.find(r=>r.type==='user');assert.ok(identity);
const prefix=identity.email.split('-')[0];assert.match(prefix,/^sel\d+[a-f0-9]+$/i);
const pool=new FixturePool({apiBase:'https://api-staging.hotung9108.me/api/v1',admin:{email:process.env.SELENIUM_ADMIN_EMAIL,password:process.env.SELENIUM_ADMIN_PASSWORD},output,secrets:[process.env.SELENIUM_ADMIN_PASSWORD]});
pool.prefix=resources.find(r=>r.type==='class')?.name.split('-')[0] || prefix;
pool.resources=resources;pool.events=apiLog;pool.users.admin=pool.admin;await pool.login('admin');assert.equal(pool.sessions.admin.user.role,'ADMIN');
if(resources.some(r=>r.type==='assignment'&&!['DELETED','ARCHIVED'].includes(r.state))){
  const user=await pool.createUser('TEACHER','Recovery');pool.users.teacher=user;await pool.login('teacher');
  for(const c of resources.filter(r=>r.type==='class'&&resources.some(a=>a.type==='assignment'&&a.classId===r.id&&a.state!=='DELETED'))){
    const actual=await pool.get('admin',`/classes/${c.id}`);assert.equal(actual.name,c.name);assert.ok(c.name.startsWith(pool.prefix));
    await pool.request('admin','PUT',`/classes/${c.id}`,{teacherId:user.id});
    for(const a of resources.filter(r=>r.type==='assignment'&&r.classId===c.id))a.owner='teacher';
  }
}
const errors=await pool.cleanup();console.log(JSON.stringify({remaining:errors.length,errors},null,2));process.exitCode=errors.length?1:0;
