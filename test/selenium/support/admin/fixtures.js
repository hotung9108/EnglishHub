import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {StagingApi} from '../teacher/expanded-api.js';

export const blocked = (message, dependsOn=[]) => Object.assign(new Error(message), {code:'QA31_BLOCKED', dependsOn});
export function assertStaging(config) {
  assert.equal(config.baseUrl,'https://staging.hotung9108.me','QA31 only supports staging');
  assert.ok(config.users.admin.email && config.users.admin.password,'Missing Admin test credentials in .env');
}
export function assertOwned(ledger, kind, id, actual) {
  const record=ledger.find(x=>x.kind===kind && Number(x.id)===Number(id));
  assert.ok(record && Number.isInteger(Number(id)) && Number(id)>0,'Refusing mutation: resource not in this run ledger');
  if(kind==='user') {
    assert.match(record.email,/^qa31-[a-f0-9]+-(teacher|student)@example\.invalid$/);
    assert.equal(actual.email,record.email,'Refusing mutation: user email mismatch');
    assert.equal(actual.role,record.role); assert.notEqual(actual.role,'ADMIN');
  } else { assert.match(record.name,/^QA31-/); assert.equal(actual.name,record.name,'Refusing mutation: class identity mismatch'); }
  return record;
}
export function resourcesFor(tests) {
  const need=new Set(tests.flatMap(t=>t.resources||[]));
  if(need.has('audit'))need.add('content');
  if(need.has('content'))need.add('baseClass');
  if(need.has('baseClass')){need.add('teacher');need.add('student');}
  if(need.has('editClass')||need.has('archiveClass'))need.add('teacher');
  return need;
}

// API creates prerequisites only. Every behavior under test is performed through Selenium.
// Nothing runs at import time. Credentials live only in process memory, never in ledger/report.
export async function prepareFixtures(config, tests, directory, {api=new StagingApi(config)}={}) {
  assertStaging(config);
  const ledger=[], errors={}, data={api,ledger,errors};
  const nonce=crypto.randomBytes(6).toString('hex');
  data.tag=nonce; data.names={teacher:'QA Admin Teacher '+nonce.replace(/[0-9]/g,c=>String.fromCharCode(103+Number(c))),student:'QA Admin Student '+nonce.replace(/[0-9]/g,c=>String.fromCharCode(103+Number(c)))};
  data.uiEmail=`qa31-${nonce}-created@example.invalid`;
  data.uiNames={teacher:data.names.teacher+' UI',student:data.names.student+' UI'};
  data.password=`Qa31!${crypto.randomBytes(12).toString('hex')}Aa7`;
  config.users.qa31generated={password:data.password};
  const need=resourcesFor(tests);
  const save=()=>fs.writeFile(path.join(directory,'fixture-ledger.json'),JSON.stringify({nonce,resources:ledger,errors},null,2));
  const attempt=async(key,fn)=>{try{data[key]=await fn();}catch(e){errors[key]=e.message;}finally{await save();}};
  await api.login('admin');
  {
    for(const role of ['teacher','student']) if(need.has(role)) await attempt(role,async()=>{
      const email=`qa31-${nonce}-${role}@example.invalid`, roleCode=role.toUpperCase();
      const created=await api.request('admin','POST','/admin/users',{role:roleCode,fullName:data.names[role],email,password:data.password});
      const id=created.user?.id; assert.ok(id,'Create user missing id');
      ledger.push({kind:'user',id,email,role:roleCode}); await save();
      const user=await readUser({api},{id,email}); assertOwned(ledger,'user',id,user);
      config.users[`qa31${role}`]={email,password:data.password};
      return {id,email,name:data.names[role]};
    });
  }
  for(const key of ['baseClass','editClass','archiveClass']) if(need.has(key) || key==='baseClass'&&need.has('content')) await attempt(key,async()=>{
    if(!data.teacher || key==='baseClass'&&!data.student) throw blocked('QA account fixture unavailable');
    const name=`QA31-${key}-${nonce}`;
    const c=await api.request('admin','POST','/classes',{name,level:'B1',description:'QA31 isolated Selenium fixture',teacherId:data.teacher.id,startDate:new Date().toISOString().slice(0,10),endDate:'2028-12-31'});
    assert.ok(c.id); ledger.push({kind:'class',id:c.id,name}); await save();
    const own=await api.get('admin',`/classes/${c.id}`); assertOwned(ledger,'class',c.id,own);
    if(key==='archiveClass') await api.request('admin','PUT',`/classes/${c.id}`,{status:'COMPLETED'});
    else if(key==='baseClass') await api.request('admin','POST',`/classes/${c.id}/members`,{studentId:data.student.id});
    return {id:c.id,name};
  });
  if(need.has('content')) await attempt('content',async()=>{
    if(!data.baseClass) throw blocked('Class fixture unavailable');
    await api.login('qa31teacher');
    const title=`QA31-Content-${nonce}`, c=data.baseClass;
    assertOwned(ledger,'class',c.id,await api.get('admin',`/classes/${c.id}`));
    const a=await api.request('qa31teacher','POST',`/classes/${c.id}/assignments`,{title,description:'QA31 content visibility',openAt:new Date(Date.now()-86400000).toISOString(),closeAt:'2028-12-31T00:00:00.000Z',maxSubmissions:3});
    assert.ok(a.id); ledger.push({kind:'assignment',id:a.id,classId:c.id,title}); await save();
    const module=await api.request('qa31teacher','POST',`/assignments/${a.id}/modules`,{skill:'READING',taskType:'QUIZ',instructions:'QA31 isolated content',orderIndex:1,maxScore:10});
    const question=await api.request('qa31teacher','POST',`/modules/${module.id}/questions`,{content:'QA31: type daily practice.',questionType:'SHORT_ANSWER',correctAnswer:{correctAnswer:'daily practice'},score:10,orderIndex:1});
    await api.request('qa31teacher','PATCH',`/assignments/${a.id}/status`,{status:'PUBLISHED'});
    const verified=await api.get('qa31teacher',`/assignments/${a.id}`);
    assert.equal(verified.status,'PUBLISHED');
    return {id:a.id,title,moduleId:module.id,questionId:question.id,status:verified.status};
  });
  if(need.has('audit'))await attempt('audit',async()=>{
    if(!data.content||!data.student)throw blocked('Published content/student fixture unavailable');
    await api.login('qa31student');
    const sub=await api.request('qa31student','POST',`/assignments/${data.content.id}/submissions`);
    ledger.push({kind:'submission',id:sub.id,assignmentId:data.content.id});await save();
    const moduleId=sub.modules[0].id;
    await api.request('qa31student','POST',`/submission-modules/${moduleId}/submit`,{answers:[{questionId:data.content.questionId,content:{text:'daily practice'}}]});
    await api.request('qa31student','POST',`/submissions/${sub.id}/submit`);
    const grading=await api.get('qa31teacher',`/submission-modules/${moduleId}/grading`);
    assert.ok(grading.id);ledger.push({kind:'grading',id:grading.id,submissionId:sub.id});await save();
    const note=`QA31 audit correction ${nonce}`;
    for(const score of [7.5,8])await api.request('qa31teacher','PUT',`/gradings/${grading.id}`,{finalScore:score,finalFeedback:'QA31 synthetic audit fixture',note});
    const detail=await api.get('qa31teacher',`/gradings/${grading.id}`);
    assert.equal(detail.finalScore,8);assert.equal(detail.status,'COMPLETED');
    return {id:grading.id,note,oldScore:7.5,newScore:8};
  });
  await save(); return data;
}

export async function readUser(data,user) {
  const list=await data.api.get('admin',`/admin/users?q=${encodeURIComponent(user.email)}&limit=100`);
  const found=list.data?.find(x=>Number(x.id)===Number(user.id)&&x.email===user.email);
  assert.ok(found,'API cannot identify QA account by email and ID');return found;
}
export async function guardUser(data,user) { return assertOwned(data.ledger,'user',user.id,await readUser(data,user)); }
export async function guardClass(data,c) { return assertOwned(data.ledger,'class',c.id,await data.api.get('admin',`/classes/${c.id}`)); }
export async function waitApi(fn,predicate,timeout=15000) {
  const deadline=Date.now()+timeout; let last;
  do { last=await fn(); if(predicate(last))return last; await new Promise(r=>setTimeout(r,400)); } while(Date.now()<deadline);
  assert.fail('API readback did not reach expected state');
}
