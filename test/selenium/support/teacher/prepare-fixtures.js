import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { root, loadLocalEnv, loadConfig } from '../../config/env.js';
import { sanitize } from '../../utils/reporter.js';
import { acquireRunLock } from './run-lock.js';

loadLocalEnv();
const config = loadConfig();
const base = process.env.QA29_API_BASE_URL || 'https://api-staging.hotung9108.me/api/v1';
assert.equal(base, 'https://api-staging.hotung9108.me/api/v1', 'Fixture preparation is restricted to the configured staging API');
assert.equal(config.baseUrl, 'https://staging.hotung9108.me', 'Use the staging frontend for these fixtures');
const directory = path.join(root, 'fixtures');
const ledgerPath = path.join(directory, 'staging.json');
const sessions = {};
const safe = value => sanitize(value, config.users);

// curl uses the workstation network/proxy configuration. Feed credentials and
// signed URLs through stdin, never command arguments, logs or temporary files.
async function request(url, method, headers, body, uploadFile) {
  const lines = [`url = ${JSON.stringify(url)}`, `request = ${JSON.stringify(method)}`];
  for (const [name, value] of Object.entries(headers)) lines.push(`header = ${JSON.stringify(`${name}: ${value}`)}`);
  if (body !== undefined) lines.push(`data = ${JSON.stringify(JSON.stringify(body))}`);
  if (uploadFile) lines.push(`upload-file = ${JSON.stringify(uploadFile.replaceAll('\\', '/'))}`);
  return new Promise((resolve, reject) => {
    const child = spawn('curl.exe', ['--silent', '--show-error', '--connect-timeout', '10', '--max-time', '60', '--config', '-', '--write-out', '\n%{http_code}'], { windowsHide: true });
    let stdout = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.resume();
    child.on('error', () => reject(new Error('Cannot start curl.exe')));
    child.on('close', code => {
      if (code) return reject(new Error(`HTTPS request failed (curl exit ${code})`));
      const index = stdout.lastIndexOf('\n');
      resolve({ status: Number(stdout.slice(index + 1)), text: stdout.slice(0, index) });
    });
    child.stdin.end(lines.join('\n'));
  });
}

async function api(role, method, endpoint, body) {
  const response = await request(`${base}${endpoint}`, method, { 'Content-Type': 'application/json', ...(sessions[role] ? { Authorization: `Bearer ${sessions[role].accessToken}` } : {}) }, body);
  let result;
  try { result = JSON.parse(response.text); } catch { result = {}; }
  if (response.status < 200 || response.status >= 300) throw new Error(`${role} ${method} ${endpoint}: HTTP ${response.status} ${safe(result.message || result.error || '')}`);
  return result;
}

async function findNamed(role, endpoint, field, name) {
  for (let page = 1; page <= 100; page++) {
    const result = await api(role, 'GET', `${endpoint}?page=${page}&limit=100`);
    assert.ok(Array.isArray(result.data), 'Expected a paginated fixture list');
    const matches = result.data.filter(item => item[field] === name);
    assert.ok(matches.length <= 1, 'Ambiguous fixture names; inspect ledger before proceeding');
    if (matches.length) return matches[0];
    if (result.data.length < 100 || page * 100 >= result.pagination?.total) return null;
  }
  throw new Error('Fixture lookup exceeded pagination limit');
}

let release;
try {
  release = await acquireRunLock();
  const logins = await Promise.allSettled(['admin', 'teacher', 'student'].map(async role => {
    assert.ok(config.users[role].email && config.users[role].password, `Configure SELENIUM_${role.toUpperCase()}_EMAIL/PASSWORD`);
    sessions[role] = await api(role, 'POST', '/auth/login', config.users[role]);
    assert.ok(sessions[role].accessToken && sessions[role].user?.id, `${role}: login response missing user/token`);
    assert.equal(sessions[role].user.role.toLowerCase(), role);
    console.log(JSON.stringify({ role, id: sessions[role].user.id, fullName: sessions[role].user.fullName, login: 'OK' }));
  }));
  const failed = logins.filter(result => result.status === 'rejected');
  for (const result of failed) console.error(safe(result.reason.message));
  assert.equal(failed.length, 0, 'Fixture preparation requires successful login for admin, teacher and student');
  if (process.argv.includes('--inspect-grading')) {
    const ledger = JSON.parse(await fs.readFile(ledgerPath, 'utf8'));
    const grading = await api('teacher', 'GET', `/gradings/${ledger.gradingId}`);
    const evidence = { gradingId: grading.id, finalScore: grading.finalScore, finalFeedback: grading.finalFeedback, status: grading.status, checkedAt: new Date().toISOString() };
    await fs.mkdir(path.join(root, '.cache', 'qa29-ui'), { recursive: true });
    await fs.writeFile(path.join(root, '.cache', 'qa29-ui', 'grading-readback.json'), JSON.stringify(evidence, null, 2));
    console.log(JSON.stringify(evidence));
  } else if (process.argv.includes('--inspect-modules')) {
    const ledger = JSON.parse(await fs.readFile(ledgerPath, 'utf8'));
    const result = await api('teacher', 'GET', `/assignments/${ledger.assignmentId}/modules`);
    console.log(JSON.stringify({ responseType: Array.isArray(result) ? 'array' : typeof result, keys: Object.keys(result), arrayFields: Object.entries(result).filter(([, value]) => Array.isArray(value)).map(([key, value]) => ({ key, length: value.length })) }));
  } else if (!process.argv.includes('--inspect')) {
    await fs.access(path.join(root, 'fixtures', 'qa29-writing-sample.pdf'));
    await fs.mkdir(directory, { recursive: true });
    let ledger;
    try { ledger = JSON.parse(await fs.readFile(ledgerPath, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    ledger ||= {
      apiBaseUrl: base, createdAt: new Date().toISOString(),
      className: `QA29-Teacher-${new Date().toISOString().replace(/[:.]/g, '-')}`,
      assignmentTitle: `QA29-Writing-Grading-${new Date().toISOString().replace(/[:.]/g, '-')}`,
      teacherId: sessions.teacher.user.id, studentId: sessions.student.user.id,
      studentName: sessions.student.user.fullName,
    };
    assert.equal(ledger.apiBaseUrl, base);
    assert.equal(ledger.teacherId, sessions.teacher.user.id);
    assert.equal(ledger.studentId, sessions.student.user.id);
    const save = () => fs.writeFile(ledgerPath, JSON.stringify(ledger, null, 2));
    await save();
    if (!ledger.classId) {
      // Recover a creation that committed on the server before a network timeout.
      const created = await findNamed('teacher', '/classes', 'name', ledger.className) || await api('admin', 'POST', '/classes', {
        name: ledger.className, level: 'B1', description: 'Dedicated persistent QA-29 Selenium fixture. Do not transfer or delete during QA runs.',
        teacherId: ledger.teacherId, startDate: '2026-10-01', endDate: '2027-10-01',
      });
      assert.ok(created.id); ledger.classId = created.id; await save();
    }
    const detail = await api('teacher', 'GET', `/classes/${ledger.classId}`);
    assert.equal(detail.name, ledger.className, 'Do not modify a class outside the fixture ledger');
    assert.equal(detail.teacherId ?? detail.teacher?.id, ledger.teacherId);
    const members = await api('teacher', 'GET', `/classes/${ledger.classId}/members`);
    if (!members.data.some(item => item.studentId === ledger.studentId)) {
      ledger.memberId = (await api('admin', 'POST', `/classes/${ledger.classId}/members`, { studentId: ledger.studentId })).memberId;
      await save();
    }
    if (!ledger.assignmentId) {
      const created = await findNamed('teacher', `/classes/${ledger.classId}/assignments`, 'title', ledger.assignmentTitle) || await api('teacher', 'POST', `/classes/${ledger.classId}/assignments`, {
        title: ledger.assignmentTitle, description: 'QA29 Writing fixture for grading and feedback persistence.',
        openAt: new Date(Date.now() - 86400000).toISOString(), closeAt: '2027-09-30T16:59:00Z', maxSubmissions: 10,
      });
      assert.ok(created.id); ledger.assignmentId = created.id; await save();
    }
    let assignment = await api('teacher', 'GET', `/assignments/${ledger.assignmentId}`);
    assert.equal(assignment.title, ledger.assignmentTitle);
    if (!ledger.moduleId) {
      const modules = await api('teacher', 'GET', `/assignments/${ledger.assignmentId}/modules`);
      assert.ok(Array.isArray(modules.data), 'Staging module list must provide data array');
      assert.ok(modules.data.length <= 1, 'Fixture assignment must contain one module');
      ledger.moduleId = modules.data[0]?.id || (await api('teacher', 'POST', `/assignments/${ledger.assignmentId}/modules`, {
        skill: 'WRITING', taskType: 'ESSAY', orderIndex: 1, instructions: 'Write at least 250 words about the benefits of learning English every day.', maxScore: 10,
      })).id;
      assert.ok(ledger.moduleId); await save();
    }
    if (assignment.status !== 'PUBLISHED') await api('teacher', 'PATCH', `/assignments/${ledger.assignmentId}/status`, { status: 'PUBLISHED' });
    if (!ledger.submissionId) {
      const existing = await api('student', 'GET', `/submissions?assignmentId=${ledger.assignmentId}&studentId=${ledger.studentId}&limit=100`);
      assert.ok(existing.data.length <= 1, 'Fixture must have one grading attempt');
      const attempt = existing.data[0] ? await api('student', 'GET', `/submissions/${existing.data[0].id}`) : await api('student', 'POST', `/assignments/${ledger.assignmentId}/submissions`);
      ledger.submissionId = attempt.id;
      ledger.submissionModuleId = attempt.modules.find(item => item.moduleId === ledger.moduleId)?.id;
      assert.ok(ledger.submissionId && ledger.submissionModuleId); await save();
    }
    // The module-detail endpoint is readable only after submission on staging.
    const progress = await api('student', 'GET', `/submissions/${ledger.submissionId}`);
    let module = progress.modules.find(item => item.id === ledger.submissionModuleId);
    assert.ok(module, 'Expected fixture submission module');
    if (module.status === 'IN_PROGRESS') {
      const pdf = await fs.readFile(path.join(root, 'fixtures', 'qa29-writing-sample.pdf'));
      assert.ok(pdf.subarray(0, 5).toString() === '%PDF-', 'Prepare the sample PDF first');
      const upload = await api('student', 'POST', `/submission-modules/${ledger.submissionModuleId}/document-upload-url`, { mimeType: 'application/pdf' });
      const uploadUrl = new URL(upload.uploadUrl);
      assert.equal(uploadUrl.protocol, 'https:', 'Upload URL must use HTTPS');
      const response = await request(uploadUrl.href, 'PUT', { 'Content-Type': 'application/pdf' }, undefined, path.join(root, 'fixtures', 'qa29-writing-sample.pdf'));
      assert.ok(response.status >= 200 && response.status < 300, `PDF upload failed: HTTP ${response.status}`);
      await api('student', 'POST', `/submission-modules/${ledger.submissionModuleId}/submit`, {});
    }
    const submission = await api('student', 'GET', `/submissions/${ledger.submissionId}`);
    if (submission.status === 'IN_PROGRESS') await api('student', 'POST', `/submissions/${ledger.submissionId}/submit`);
    module = await api('teacher', 'GET', `/submission-modules/${ledger.submissionModuleId}`);
    assert.ok(['SUBMITTED', 'GRADED'].includes(module.status));
    assert.ok(module.answers.some(answer => answer.docUploadStatus === 'READY'), 'Uploaded document must be READY');
    const grading = await api('teacher', 'GET', `/submission-modules/${ledger.submissionModuleId}/grading`);
    assert.ok(grading.id, 'Grading record must exist');
    const roster = await api('teacher', 'GET', `/classes/${ledger.classId}/members`);
    const student = roster.data.find(item => item.studentId === ledger.studentId);
    assert.ok(student?.fullName);
    ledger.studentName = student.fullName;
    ledger.gradingId = grading.id;
    ledger.verifiedAt = new Date().toISOString();
    await save();
    // Preserve all existing credentials and unrelated settings. Update only fixture keys.
    const filename = path.join(root, '.env');
    let env = await fs.readFile(filename, 'utf8');
    for (const [key, value] of Object.entries({ QA29_CLASS_NAME: ledger.className, QA29_STUDENT_NAME: ledger.studentName, QA29_ASSIGNMENT_TITLE: ledger.assignmentTitle, QA29_SCORE: '7' })) {
      assert.ok(!/[\r\n"\\]/.test(value), `Fixture value cannot be safely serialized: ${key}`);
      const line = `${key}="${value}"`;
      const expression = new RegExp(`^${key}=.*$`, 'gm');
      env = expression.test(env) ? env.replace(expression, () => line) : `${env.trimEnd()}\n${line}\n`;
    }
    await fs.writeFile(filename, env);
    console.log(JSON.stringify({ status: 'READY', ...ledger }, null, 2));
  }
} catch (error) {
  console.error(safe(error.message));
  try {
    await fs.access(ledgerPath);
    console.error('Progress is saved in fixtures/staging.json. Re-run to resume; existing resources are not deleted.');
  } catch {
    console.error('No fixture ledger exists yet. Staging data and .env fixture settings have not been changed.');
  }
  process.exitCode = 1;
} finally { if (release) await release(); }
