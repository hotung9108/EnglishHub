import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { Blocked, redact } from "../runner/core.js";
import { businessDate } from "../time.js";

export class FixturePool {
  constructor({ apiBase, admin, output, secrets }) {
    this.base = apiBase; this.admin = admin; this.output = output; this.secrets = secrets;
    this.sessions = {}; this.users = {}; this.resources = []; this.events = [];
    this.prefix = `SEL${Date.now()}${randomBytes(3).toString('hex')}`;
  }
  async request(role, method, path, body, { allowError = false } = {}) {
    if(role&&this.sessions[role]){
      const payload=JSON.parse(Buffer.from(this.sessions[role].accessToken.split('.')[1],'base64url').toString());
      if(payload.exp*1000<Date.now()+30000)await this.login(role,role==='admin'?this.admin:this.users[role]);
    }
    const started = Date.now();
    const response = await fetch(this.base + path, { method, headers: {
      'Content-Type': 'application/json', ...(this.sessions[role] ? { Authorization: `Bearer ${this.sessions[role].accessToken}` } : {})
    }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(25000) });
    const text = await response.text(); let data; try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 4000) }; }
    const event = redact({ role, method, path, request: body, status: response.status, response: data, durationMs: Date.now() - started, at: new Date().toISOString() }, this.secrets);
    this.events.push(event);
    await writeFile(join(this.output, 'api-log.json'), JSON.stringify(this.events, null, 2));
    if (!allowError && !response.ok) throw Object.assign(new Error(`${method} ${path}: HTTP ${response.status} ${JSON.stringify(redact(data, this.secrets))}`), { status: response.status });
    return allowError ? { status: response.status, data } : data;
  }
  get(role, path) { return this.request(role, 'GET', path); }
  async login(role, credentials = this.users[role]) {
    const session = await this.request(null, 'POST', '/auth/login', { email: credentials.email, password: credentials.password });
    assert.ok(session.accessToken && session.user?.id, 'Login API must return token and user identity');
    this.secrets.push(session.accessToken, session.refreshToken);
    this.sessions[role] = session;
    return session;
  }
  async journal() { await writeFile(join(this.output, 'fixture-journal.json'), JSON.stringify(this.resources, null, 2)); }
  async init() {
    if (!this.admin.email || !this.admin.password) throw new Blocked('Set SELENIUM_ADMIN_EMAIL and SELENIUM_ADMIN_PASSWORD');
    this.users.admin = { ...this.admin, role: 'ADMIN' };
    await this.login('admin');
    assert.equal(this.sessions.admin.user.role, 'ADMIN', 'Fixture creator must be ADMIN');
    for (const [role, roleValue] of [['teacher', 'TEACHER'], ['student', 'STUDENT'], ['outsider', 'TEACHER'], ['other', 'STUDENT'], ['locked', 'STUDENT'], ['profile', 'ADMIN'], ['empty', 'STUDENT']]) {
      this.users[role] = await this.createUser(roleValue, role);
      if (role === 'locked') {
        await this.request('admin', 'PATCH', `/admin/users/${this.users[role].id}/status`, { status: 'LOCKED' });
        const locked = await this.get('admin', `/admin/users?q=${encodeURIComponent(this.users[role].email)}&limit=100`);
        const account = locked.data.find(user => user.id === this.users[role].id);
        assert.equal(account?.email, this.users[role].email, 'Locked fixture must be the exact created account');
        assert.equal(account?.status, 'LOCKED', 'Verify locked state before using login fixture');
      }
      else await this.login(role);
      process.env[`SELENIUM_${role.toUpperCase()}_EMAIL`] = this.users[role].email;
      process.env[`SELENIUM_${role.toUpperCase()}_PASSWORD`] = this.users[role].password;
    }
    this.class = await this.createClass('Main', this.users.teacher.id);
    this.foreignClass = await this.createClass('Foreign', this.users.outsider.id);
    await this.member(this.class.id, this.users.student.id);
    await this.member(this.class.id, this.users.other.id);
    await this.member(this.foreignClass.id, this.users.other.id);
    this.users.admin = await this.createUser('ADMIN','UiAdmin');
    process.env.SELENIUM_ADMIN_EMAIL=this.users.admin.email;
    process.env.SELENIUM_ADMIN_PASSWORD=this.users.admin.password;
    return this;
  }
  async member(classId, studentId) {
    const response = await this.request('admin','POST',`/classes/${classId}/members`,{ studentId });
    this.resources.push({type:'member',id:response.memberId,classId,studentId,state:'CREATED'});await this.journal();return response;
  }
  async wav() {
    const file=join(this.output,'fixture-tone.wav');
    const rate=16000, samples=rate*3, bytes=Buffer.alloc(44+samples*2);
    bytes.write('RIFF');bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVEfmt ',8);bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(1,22);bytes.writeUInt32LE(rate,24);bytes.writeUInt32LE(rate*2,28);bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);bytes.write('data',36);bytes.writeUInt32LE(samples*2,40);
    for(let i=0;i<samples;i++)bytes.writeInt16LE(Math.round(3000*Math.sin(2*Math.PI*440*i/rate)),44+i*2);
    await writeFile(file,bytes);return file;
  }
  async createUser(role, label = 'User') {
    const nonce = randomBytes(5).toString('hex');
    const fullName = `Selenium ${label.replace(/[^a-z]/gi, '')} ${nonce.replace(/[0-9]/g, c => String.fromCharCode(97 + Number(c)))}`;
    const email = `${this.prefix}-${label}-${nonce}@example.invalid`.toLowerCase();
    const password = `Qa!${randomBytes(12).toString('hex')}Az7`; this.secrets.push(password);
    // Reserve the identity before writing so a lost create response can be recovered.
    const resource = { type: 'user', email, fullName, role, state: 'RESERVED' }; this.resources.push(resource); await this.journal();
    const response = await this.request('admin', 'POST', '/admin/users', { fullName, email, password, role });
    assert.ok(response.user?.id, 'Created user must return ID');
    Object.assign(resource, { id: response.user.id, state: 'CREATED' }); await this.journal();
    return { id: resource.id, email, password, fullName, role };
  }
  async createClass(label, teacherId = this.users.teacher.id, overrides = {}) {
    const name = `${this.prefix}-${label}-${randomBytes(3).toString('hex')}`;
    const resource = { type: 'class', name, teacherId, state: 'RESERVED' }; this.resources.push(resource); await this.journal();
    const payload = { name, level: 'B1', teacherId, startDate: businessDate(-7), endDate: businessDate(365), ...overrides };
    const data = await this.request('admin', 'POST', '/classes', payload);
    assert.ok(data.id, 'Created class must return ID'); Object.assign(resource, { id: data.id, state: 'CREATED' }); await this.journal();
    return { ...payload, id: data.id };
  }
  async assignment(skill = 'WRITING', { status = 'PUBLISHED', owner = 'teacher', classId = this.class.id, maxSubmissions = 2, closeAt = new Date(Date.now() + 7 * 86400000).toISOString(), questions = 1 } = {}) {
    const title = `${this.prefix}-${skill}-${randomBytes(5).toString('hex')}`;
    const resource = { type: 'assignment', title, classId, owner, state: 'RESERVED' }; this.resources.push(resource); await this.journal();
    const a = await this.request(owner, 'POST', `/classes/${classId}/assignments`, { title, description: 'Isolated SRS Selenium fixture', maxSubmissions, openAt: new Date(Date.now() - 86400000).toISOString(), closeAt });
    assert.ok(a.id); Object.assign(resource, { id: a.id, state: 'CREATED' }); await this.journal();
    const instructions = `SRS ${skill}: describe daily practice in English.`;
    const m = await this.request(owner, 'POST', `/assignments/${a.id}/modules`, { skill, taskType: skill === 'WRITING' ? 'ESSAY' : skill === 'SPEAKING' ? 'RECORDING' : 'QUIZ', orderIndex: 1, instructions, maxScore: 10 });
    if(skill==='LISTENING'){
      const upload=await this.request(owner,'POST',`/modules/${m.id}/audio`,{mimeType:'audio/wav'});
      assert.equal(new URL(upload.uploadUrl).protocol,'https:');
      const binary=await readFile(await this.wav());const response=await fetch(upload.uploadUrl,{method:'PUT',headers:{'Content-Type':'audio/wav'},body:binary,signal:AbortSignal.timeout(25000)});assert.ok(response.ok,`WAV upload HTTP ${response.status}`);
      await this.request(owner,'POST',`/modules/${m.id}/audio/confirm`,{storageKey:upload.storageKey});
    }
    const qs = [];
    if (['READING', 'LISTENING'].includes(skill)) for (let i = 0; i < questions; i++) {
      const q = await this.request(owner, 'POST', `/modules/${m.id}/questions`, { content: `SRS question ${i + 1}: type apple`, questionType: 'SHORT_ANSWER', correctAnswer: { correctAnswer: 'apple' }, score: 10 / questions, orderIndex: i + 1 });
      qs.push(q);
    }
    if (status !== 'DRAFT') await this.request(owner, 'PATCH', `/assignments/${a.id}/status`, { status });
    return { ...a, id: a.id, moduleId: m.id, title, skill, instructions, questions: qs, classId, owner, maxSubmissions };
  }
  async submitted(item, { student = 'student', answer = 'apple', text } = {}) {
    const s = await this.request(student, 'POST', `/assignments/${item.id}/submissions`);
    const m = s.modules.find(m => m.moduleId === item.moduleId); assert.ok(m?.id);
    let payload={ answers:item.questions.map(q=>({questionId:q.id,content:{text:answer}})) };
    if(['WRITING','SPEAKING'].includes(item.skill)){
      const speaking=item.skill==='SPEAKING';
      const mimeType=speaking?'audio/wav':'text/plain';
      const upload=await this.request(student,'POST',`/submission-modules/${m.id}/${speaking?'audio':'document'}-upload-url`,{mimeType});
      assert.equal(new URL(upload.uploadUrl).protocol,'https:');
      let bytes;
      if(speaking){
        const file=join(this.output,'fixture-speech.wav');
        execFileSync('powershell.exe',['-NoProfile','-Command',`Add-Type -AssemblyName System.Speech; $srsVoice=New-Object System.Speech.Synthesis.SpeechSynthesizer; $srsVoice.SelectVoice('Microsoft David Desktop'); $srsVoice.SetOutputToWaveFile('${file.replaceAll("'","''")}'); $srsVoice.Speak('Today I would like to talk about learning English. Daily practice helps students build confidence and improve communication. We can read interesting books and discuss new ideas with our teachers.'); $srsVoice.Dispose()`],{windowsHide:true});
        bytes=await readFile(file);
      }else bytes=Buffer.from(text||Array(12).fill('Daily English practice improves vocabulary and confidence. Students read articles, listen to conversations and reflect on constructive feedback. This synthetic essay verifies the grading workflow without using real student work.').join(' '));
      const put=await fetch(upload.uploadUrl,{method:'PUT',headers:{'Content-Type':mimeType},body:bytes,signal:AbortSignal.timeout(25000)});assert.ok(put.ok,`Storage upload HTTP ${put.status}`);
      payload={answers:[],[speaking?'audioStorageKey':'storageKey']:upload.storageKey};
    }
    await this.request(student, 'POST', `/submission-modules/${m.id}/submit`, payload);
    await this.request(student, 'POST', `/submissions/${s.id}/submit`);
    return { submissionId: s.id, submissionModuleId: m.id };
  }
  async cleanup() {
    const errors = [];
    const priority={evaluation:0,assignment:1,member:2,class:3,user:4};
    for (const resource of [...this.resources].reverse().sort((a,b)=>priority[a.type]-priority[b.type])) {
      if (['DELETED', 'ARCHIVED'].includes(resource.state)) continue;
      try {
        if (resource.type === 'evaluation') {
          assert.ok(this.resources.some(r=>r.type==='user'&&r.id===resource.studentId));
          const response=await this.request('teacher','DELETE',`/evaluations/${resource.id}`,undefined,{allowError:true});assert.ok([200,204,404].includes(response.status));
        } else if (resource.type === 'member') {
          assert.ok(this.resources.some(r=>r.type==='class'&&r.id===resource.classId));
          assert.ok(this.resources.some(r=>r.type==='user'&&r.id===resource.studentId));
          const removed=await this.request('admin','DELETE',`/classes/${resource.classId}/members/${resource.id}`,undefined,{allowError:true});
          assert.ok([200,204,404].includes(removed.status));
        } else if (resource.type === 'user') {
          assert.ok(resource.email.startsWith(this.prefix.toLowerCase() + '-'));
          const list = await this.get('admin', `/admin/users?q=${encodeURIComponent(resource.email)}&limit=100`);
          const matches = list.data.filter(u => u.email === resource.email); assert.ok(matches.length <= 1);
          if (!matches.length) { resource.state = 'DELETED'; await this.journal(); continue; }
          const user = matches[0]; assert.equal(user.id, resource.id ?? user.id); assert.notEqual(user.id, this.sessions.admin.user.id);
          await this.request('admin', 'DELETE', `/admin/users/${user.id}`);
          const after = await this.get('admin', `/admin/users?q=${encodeURIComponent(resource.email)}&limit=100`);
          assert.equal(after.data.filter(u => u.email === resource.email).length, 0, 'Deleted user remains visible');
        } else {
          if (!resource.id) {
            const endpoint = resource.type === 'class' ? '/classes?limit=100' : `/classes/${resource.classId}/assignments?limit=100`;
            const list = await this.get('admin', endpoint);
            const matches = list.data.filter(item => (item.name || item.title) === (resource.name || resource.title));
            assert.ok(matches.length <= 1, 'Reserved UI fixture identity ambiguous');
            if (!matches.length) { resource.state = 'DELETED'; await this.journal(); continue; }
            resource.id = matches[0].id; await this.journal();
          }
          const path = resource.type === 'class' ? `/classes/${resource.id}` : `/assignments/${resource.id}`;
          const owner = resource.owner || 'admin';
          const found = await this.request(owner, 'GET', path, undefined, { allowError: true });
          if (found.status === 404) { resource.state = 'DELETED'; await this.journal(); continue; }
          assert.equal(found.status, 200);
          assert.equal(resource.type === 'class' ? found.data.name : found.data.title, resource.name || resource.title, 'Identity changed; refuse cleanup');
          assert.ok((resource.name || resource.title).startsWith(this.prefix));
          if (resource.type === 'class') {
            const roster = await this.get('admin', `${path}/members`);
            for (const member of roster.data) {
              assert.ok(this.resources.some(r => r.type === 'user' && r.id === member.studentId), 'Refuse to remove an unowned class member');
              await this.request('admin', 'DELETE', `${path}/members/${member.memberId}`);
            }
          }
          const deletion=await this.request(resource.owner || 'admin', 'DELETE', path, undefined, {allowError:true});
          if(resource.type==='class'&&deletion.status===409){
            // Backend retains historical rows. Quarantine only this owned fixture,
            // preserve IDs/reason for review; never force-delete via database.
            await this.request('admin','PUT',path,{status:'COMPLETED'});
            const archived=await this.get('admin',path);assert.equal(archived.status,'COMPLETED');
            resource.state='ARCHIVED';resource.retentionReason='API refuses deletion of related historical data (409); class closed after owned members removed';await this.journal();continue;
          }
          assert.ok([200,204].includes(deletion.status),`Cleanup DELETE ${path}: HTTP ${deletion.status}`);
          const after = await this.request(owner, 'GET', path, undefined, { allowError: true });
          assert.equal(after.status, 404, 'Deleted fixture must not be retrievable');
        }
        resource.state = 'DELETED'; await this.journal();
      } catch (error) { errors.push({ resource: { ...resource }, error: error.message }); }
    }
    await writeFile(join(this.output, 'cleanup.json'), JSON.stringify({ at: new Date().toISOString(), errors, resources: this.resources,deletedCount:this.resources.filter(r=>r.state==='DELETED').length,retainedCount:this.resources.filter(r=>r.state==='ARCHIVED').length,allFixturesDeleted:this.resources.every(r=>r.state==='DELETED'),retentionPolicy:'ARCHIVED is retained data, not deleted. No approved automatic purge policy; environment owner follow-up required.' }, null, 2));
    return errors;
  }
}
