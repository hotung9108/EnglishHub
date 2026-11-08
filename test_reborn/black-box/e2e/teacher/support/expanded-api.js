import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { root } from '../../../../common/config/env.js';

export class StagingApi {
  constructor(config) { this.config = config; this.sessions = {}; this.events = []; this.base = config.apiBaseUrl || 'https://api-staging.hotung9108.me/api/v1'; }
  async request(role, method, endpoint, body, file, uploadUrl) {
    const authenticated = !uploadUrl && !endpoint.startsWith('/auth/') && this.sessions[role];
    if (authenticated) {
      let expiry;
      try { expiry = JSON.parse(Buffer.from(this.sessions[role].accessToken.split('.')[1], 'base64url')).exp; } catch {}
      if (expiry && expiry * 1000 < Date.now() + 60000) {
        await this.login(role);
        this.events.push({ role, action: 'reauth-before-expiry', at: new Date().toISOString() });
      }
    }
    try { return await this.send(role, method, endpoint, body, file, uploadUrl); }
    catch (error) {
      // A 401 means authentication rejected the request. Retry once after login,
      // never retry 403 or an upload/mutation transport timeout.
      if (!authenticated || error.status !== 401) throw error;
      await this.login(role);
      this.events.push({ role, action: 'reauth-after-401', at: new Date().toISOString() });
      return this.send(role, method, endpoint, body, file, uploadUrl);
    }
  }
  async send(role, method, endpoint, body, file, uploadUrl) {
    const lines = [`url = ${JSON.stringify(uploadUrl || this.base + endpoint)}`, `request = ${JSON.stringify(method)}`];
    lines.push(`header = ${JSON.stringify(`Content-Type: ${file ? 'audio/wav' : 'application/json'}`)}`);
    if (!uploadUrl && this.sessions[role]) lines.push(`header = ${JSON.stringify('Authorization: Bearer ' + this.sessions[role].accessToken)}`);
    if (body !== undefined) lines.push(`data = ${JSON.stringify(JSON.stringify(body))}`);
    if (file) lines.push(`upload-file = ${JSON.stringify(file.replaceAll('\\', '/'))}`);
    const result = await new Promise((resolve, reject) => {
      const child = spawn('curl.exe', ['--silent', '--show-error', '--connect-timeout', '10', '--max-time', '45', '--resolve', 'minio:9000:127.0.0.1', '--config', '-', '--write-out', '\n%{http_code}'], { windowsHide: true });
      let output = ''; child.stdout.on('data', chunk => { output += chunk; }); child.stderr.resume();
      child.on('error', () => reject(new Error('curl unavailable')));
      child.on('close', code => { if (code) return reject(new Error(`Transport error ${code}: ${role} ${method} ${endpoint || 'upload to ' + new URL(uploadUrl).hostname}`)); const split = output.lastIndexOf('\n'); let json; try { json = JSON.parse(output.slice(0, split)); } catch { json = {}; } resolve({ status: Number(output.slice(split + 1)), json }); });
      child.stdin.end(lines.join('\n') + '\n');
    });
    this.events.push({ role, method, endpoint: uploadUrl ? '[QA audio upload]' : endpoint, status: result.status, at: new Date().toISOString() });
    if (result.status < 200 || result.status >= 300) { const error = new Error(`${method} ${endpoint}: HTTP ${result.status}`); error.status = result.status; error.endpoint = endpoint; error.method = method; throw error; }
    return result.json;
  }
  async login(role) {
    const account = this.config.users[role]; assert.ok(account?.email && account?.password, `Missing ${role} QA account`);
    const result = await this.request(role, 'POST', '/auth/login', account);
    assert.ok(result.accessToken && result.user?.id); this.sessions[role] = result; return result.user;
  }
  get(role, endpoint) { return this.request(role, 'GET', endpoint); }
  async createAssignment(data, skill, label, status = 'PUBLISHED', owner = 'teacher', classId = data.fixture.classId) {
    const title = `QA29X-${skill}-${label}-${data.runId}`;
    const openAt = new Date(Date.now() - 86400000).toISOString();
    const closeAt = new Date(Date.now() + 21 * 86400000).toISOString();
    const assignment = await this.request(owner, 'POST', `/classes/${classId}/assignments`, { title, description: 'QA29 expanded UI fixture', openAt, closeAt, maxSubmissions: 10 });
    data.createdFixtures.push({ type: 'assignment', id: assignment.id, title, classId });
    const module = await this.request(owner, 'POST', `/assignments/${assignment.id}/modules`, { skill, taskType: skill === 'SPEAKING' ? 'RECORDING' : skill === 'WRITING' ? 'ESSAY' : 'QUIZ', orderIndex: 1, instructions: `QA29 ${skill} instructions ${data.runId}`, maxScore: 10 });
    if (status !== 'DRAFT') await this.request(owner, 'PATCH', `/assignments/${assignment.id}/status`, { status });
    return { id: assignment.id, moduleId: module.id, title, skill, openAt, closeAt, classId };
  }
}

async function loadOrBootstrapTeacherLedger(config, api) {
  const ledgerFile = config.fixtures?.teacherLedger || path.join(root, config.isLocal ? 'fixtures/local.json' : 'fixtures/staging.json');
  await api.login('teacher');
  let fixture = null;
  try {
    fixture = JSON.parse(await fs.readFile(ledgerFile, 'utf8'));
    const cls = await api.get('teacher', `/classes/${fixture.classId}`);
    if (!cls || cls.name !== fixture.className) fixture = null;
  } catch {
    fixture = null;
  }
  if (!fixture) {
    const prepScript = path.join(root, 'black-box/e2e/teacher/support/prepare-fixtures.js');
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [prepScript, '--no-lock', `--env=${config.env || 'local'}`], { stdio: 'inherit', env: { ...process.env, TEST_ENV: config.env || 'local' } });
      child.on('close', code => code === 0 ? resolve() : reject(new Error(`prepare-fixtures exited with ${code}`)));
    });
    fixture = JSON.parse(await fs.readFile(ledgerFile, 'utf8'));
  }
  return fixture;
}

export async function prepareBase(config, data) {
  data.api = new StagingApi(config);
  data.fixture = await loadOrBootstrapTeacherLedger(config, data.api);
  Object.assign(data, data.fixture);
  return data;
}

export async function prepareExpanded(config, data) {
  const api = new StagingApi(config); data.api = api; data.createdFixtures = [];
  data.fixture = await loadOrBootstrapTeacherLedger(config, api);
  Object.assign(data, data.fixture);
  await api.login('teacher'); await api.login('admin'); await api.login('student');
  data.extra = {}; data.setupErrors = {};
  data.extra.edit = await api.createAssignment(data, 'WRITING', 'Edit', 'DRAFT');
  // [TEMP DISABLED - FILE STORAGE/UPLOAD] Omit 'SPEAKING' to avoid generating synthetic WAV and PUT uploading to S3
  for (const skill of ['READING', 'LISTENING']) {
    try {
    const item = await api.createAssignment(data, skill, 'Grade');
    if (skill !== 'SPEAKING') {
      const question = await api.request('teacher', 'POST', `/modules/${item.moduleId}/questions`, { content: 'QA29: Write the phrase daily practice.', questionType: 'SHORT_ANSWER', correctAnswer: { correctAnswer: 'daily practice' }, score: 10, orderIndex: 1 });
      item.questionId = question.id;
    }
    const attempt = await api.request('student', 'POST', `/assignments/${item.id}/submissions`);
    item.submissionId = attempt.id; item.submissionModuleId = attempt.modules.find(module => module.moduleId === item.moduleId)?.id;
    assert.ok(item.submissionModuleId);
    if (skill === 'SPEAKING') {
      // Valid synthetic WAV fixture for manual-grading UI, not an AI speech-quality benchmark.
      const file = path.join(root, '.cache/qa29-speaking-sample.wav'); await fs.mkdir(path.dirname(file), { recursive: true });
      const bytes = Buffer.alloc(44 + 16000 * 2 * 2); bytes.write('RIFF'); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write('WAVEfmt ', 8); bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22); bytes.writeUInt32LE(16000, 24); bytes.writeUInt32LE(32000, 28); bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34); bytes.write('data', 36); bytes.writeUInt32LE(bytes.length - 44, 40); await fs.writeFile(file, bytes);
      const upload = await api.request('student', 'POST', `/submission-modules/${item.submissionModuleId}/audio-upload-url`, { mimeType: 'audio/wav' });
      assert.ok(['https:', 'http:'].includes(new URL(upload.uploadUrl).protocol));
      await api.request('student', 'PUT', '', undefined, file, upload.uploadUrl);
      await api.request('student', 'POST', `/submission-modules/${item.submissionModuleId}/submit`, {});
    } else await api.request('student', 'POST', `/submission-modules/${item.submissionModuleId}/submit`, { answers: [{ questionId: item.questionId, content: { text: 'daily practice' } }] });
    await api.request('student', 'POST', `/submissions/${item.submissionId}/submit`);
    item.gradingId = (await api.get('teacher', `/submission-modules/${item.submissionModuleId}/grading`)).id;
    data.extra[skill.toLowerCase()] = item;
    } catch (error) {
      data.setupErrors[skill.toLowerCase()] = error.message;
      console.log(`Fixture ${skill}: ${error.message}`);
    }
  }
  // Isolated account for reversible profile/password tests; never rename/change seed teacher.
  try {
  const email = `qa29-${crypto.randomBytes(6).toString('hex')}@example.invalid`;
  const password = `Qa29!${crypto.randomBytes(12).toString('hex')}Aa7`;
  const newUser = await api.request('admin', 'POST', '/admin/users', { fullName: 'QA Teacher Profile', email, password, role: 'TEACHER', specialization: 'QA29' });
  config.users.profile = { email, password };
  data.extra.profileUser = { email, password };
  data.extra.profileId = newUser.user?.id;
  data.createdFixtures.push({ type: 'user', id: data.extra.profileId, purpose: 'Isolated profile/password QA account' });
  await api.login('profile');
  } catch (error) { data.setupErrors.profile = error.message; console.log(`Fixture profile: ${error.message}`); }
  try {
    let outsider;
    if (process.env.QA29_OUTSIDER_EMAIL && process.env.QA29_OUTSIDER_PASSWORD) {
      config.users.outsider = { email: process.env.QA29_OUTSIDER_EMAIL, password: process.env.QA29_OUTSIDER_PASSWORD };
      try {
        outsider = await api.login('outsider');
      } catch (err) {
        console.log(`Outsider login with env failed (${err.message}), creating dynamically...`);
      }
    }
    if (!outsider) {
      const outsiderEmail = `qa29-outsider-${String(data.runId).toLowerCase()}@example.invalid`;
      const outsiderPassword = `Qa29!${crypto.randomBytes(12).toString('hex')}Aa7`;
      const outsiderUser = await api.request('admin', 'POST', '/admin/users', { fullName: 'QA Teacher Outsider', email: outsiderEmail, password: outsiderPassword, role: 'TEACHER', specialization: 'QA29' });
      config.users.outsider = { email: outsiderEmail, password: outsiderPassword };
      data.extra.outsiderUser = { email: outsiderEmail, password: outsiderPassword };
      data.createdFixtures.push({ type: 'user', id: outsiderUser.user?.id, purpose: 'Isolated outsider teacher QA account' });
      outsider = await api.login('outsider');
    }
    assert.notEqual(outsider.id, api.sessions.teacher.user.id, 'Outside fixture must belong to a different teacher');
    let pool;
    const cleanupStatePath = config.fixtures?.cleanupState || path.join(root, config.isLocal ? 'fixtures/cleanup-state.local.json' : 'fixtures/cleanup-state.json');
    try { pool = JSON.parse(await fs.readFile(cleanupStatePath, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    let foreign;
    if (pool && pool.teacherId === outsider.id) {
      assert.match(pool.name, /^QA29X-Outside-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/);
      try { const detail = await api.get('admin', `/classes/${pool.foreignClassId}`); assert.equal(detail.name, pool.name); assert.equal(detail.teacherId ?? detail.teacher?.id, outsider.id); foreign = { id: detail.id }; }
      catch (error) { if (error.status !== 404) throw error; }
    }
    foreign ||= await api.request('admin', 'POST', '/classes', { name: `QA29X-Outside-${data.runId}`, level: 'B1', teacherId: outsider.id, startDate: '2026-10-01', endDate: '2027-10-01' });
    data.createdFixtures.push({ type: 'class', id: foreign.id, name: pool?.foreignClassId === foreign.id ? pool.name : `QA29X-Outside-${data.runId}`, teacherId: outsider.id });
    data.extra.foreignClass = foreign.id;
    data.extra.foreignAssignment = await api.createAssignment(data, 'WRITING', 'Outside', 'PUBLISHED', 'outsider', foreign.id);
  } catch (error) { data.setupErrors.foreign = error.message; console.log(`Fixture outside class: ${error.message}`); }
  return Object.assign(data, data.extra);
}
