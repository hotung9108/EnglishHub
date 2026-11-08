import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { loadConfig, loadLocalEnv } from '../../../../BTL_PRJ1/EnglishHub-qa30/test/selenium/config/env.js';

// Explicit staging-only reproduction. Keeps QA fixtures for evidence; never logs credentials/signed URLs.
assert.ok(process.argv.includes('--run'), 'Use --run to create isolated QA data on staging');
const dir = path.dirname(fileURLToPath(import.meta.url));
const runId = new Date().toISOString().replace(/[:.]/g, '-');
const reportPath = path.join(dir, `evidence-${runId}.json`);
const report = { runId, startedAt: new Date().toISOString(), environment: 'staging',
  apiBase: 'https://api-staging.hotung9108.me/api/v1', sourceReference: 'f85d5e94624c59bfc2118f0a36f3c990982e534a',
  deployedCommit: 'not verified', method: 'direct API, not browser UI', events: [], fixtures: {}, cases: [] };
const save = () => fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
const sessions = {};
async function request(role, method, endpoint, { body, uploadUrl, file, mimeType } = {}) {
  const url = uploadUrl || report.apiBase + endpoint;
  assert.equal(new URL(url).protocol, 'https:');
  if (!uploadUrl) assert.equal(new URL(url).origin, 'https://api-staging.hotung9108.me');
  const lines = [`url = ${JSON.stringify(url)}`, `request = ${JSON.stringify(method)}`];
  lines.push(`header = ${JSON.stringify('Content-Type: ' + (mimeType || 'application/json'))}`);
  if (!uploadUrl && sessions[role]) lines.push(`header = ${JSON.stringify('Authorization: Bearer ' + sessions[role])}`);
  if (body !== undefined) lines.push(`data = ${JSON.stringify(JSON.stringify(body))}`);
  if (file) lines.push(`upload-file = ${JSON.stringify(file.replaceAll('\\', '/'))}`);
  const at = new Date().toISOString();
  const response = await new Promise((resolve, reject) => {
    const child = spawn('curl.exe', ['--silent', '--show-error', '--connect-timeout', '10', '--max-time', '45', '--config', '-', '--write-out', '\n%{http_code}'], { windowsHide: true });
    let output = ''; child.stdout.on('data', x => output += x); child.stderr.resume();
    child.on('error', () => reject(new Error('Unable to launch curl')));
    child.on('close', code => {
      if (code) return reject(new Error(`Transport error ${code}: ${method} ${uploadUrl ? '[signed upload URL redacted]' : endpoint}`));
      const split = output.lastIndexOf('\n'); const raw = output.slice(0, split);
      let json; try { json = JSON.parse(raw); } catch { json = null; }
      resolve({ status: Number(output.slice(split + 1)), json });
    });
    child.stdin.end(lines.join('\n') + '\n');
  });
  report.events.push({ at, completedAt: new Date().toISOString(), role, method,
    endpoint: uploadUrl ? '[presigned object upload; URL redacted]' : endpoint,
    status: response.status, ...(endpoint.startsWith('/auth/') ? {} : { requestBody: body }) });
  save();
  return response;
}
async function ok(role, method, endpoint, options) {
  const res = await request(role, method, endpoint, options);
  assert.ok(res.status >= 200 && res.status < 300, `${method} ${endpoint}: HTTP ${res.status}`);
  return res.json;
}
async function login(role, account) {
  assert.ok(account?.email && account?.password, `Missing ${role} credentials`);
  const result = await ok(role, 'POST', '/auth/login', { body: account });
  assert.ok(result.accessToken && result.user?.id, 'Login response invalid');
  sessions[role] = result.accessToken;
  return result.user;
}
function snapshot(data) {
  return { id: data.id, assignmentId: data.assignmentId, studentId: data.studentId, status: data.status,
    modules: data.modules?.map(m => ({ id: m.id, moduleId: m.moduleId, status: m.status })) };
}
try {
  save(); loadLocalEnv(); const config = loadConfig();
  // Read-only preflight before creating any fixture.
  const health = await request(null, 'GET', '/submissions');
  assert.ok([401, 403].includes(health.status), `API preflight unexpected HTTP ${health.status}`);
  const admin = await login('admin', config.users.admin);
  const teacher = await login('teacher', config.users.teacher);
  const accountPath = fileURLToPath(new URL('../../../../BTL_PRJ1/EnglishHub-qa30/test/selenium/.cache/qa30-account.json', import.meta.url));
  const studentAccount = JSON.parse(fs.readFileSync(accountPath, 'utf8'));
  assert.match(studentAccount.email, /^qa30-[0-9a-f]{12}@example\.invalid$/);
  const student = await login('student', studentAccount);
  assert.equal(student.role, 'STUDENT');
  report.fixtures.identities = { adminId: admin.id, teacherId: teacher.id, studentId: student.id, studentPurpose: 'existing isolated QA30 synthetic account' }; save();
  const className = `QA-DOCX-MIME-${runId}`;
  const cls = await ok('admin', 'POST', '/classes', { body: { name: className,
    description: 'Isolated DOCX MIME length bug verification; retain evidence.', level: 'B1', teacherId: teacher.id,
    startDate: '2026-10-01', endDate: '2027-10-01' } });
  report.fixtures.classId = cls.id; report.fixtures.className = className; save();
  await ok('admin', 'POST', `/classes/${cls.id}/members`, { body: { studentId: student.id } });
  const docxMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  for (const [label, mimeType, filename] of [['DOCX', docxMime, 'sample.docx'], ['PDF', 'application/pdf', 'control.pdf']]) {
    const result = { label, mimeType, mimeLength: mimeType.length, attempts: [] }; report.cases.push(result); save();
    const assignment = await ok('teacher', 'POST', `/classes/${cls.id}/assignments`, { body: {
      title: `QA-DOCX-MIME-${label}-${runId}`, description: 'Synthetic MIME verification fixture',
      openAt: new Date(Date.now() - 86400000).toISOString(), closeAt: new Date(Date.now() + 7 * 86400000).toISOString(), maxSubmissions: 3 } });
    result.assignmentId = assignment.id; save();
    const module = await ok('teacher', 'POST', `/assignments/${assignment.id}/modules`, { body: {
      skill: 'WRITING', taskType: 'ESSAY', orderIndex: 1, maxScore: 10, instructions: 'Upload synthetic QA document.' } });
    result.moduleId = module.id; save();
    await ok('teacher', 'PATCH', `/assignments/${assignment.id}/status`, { body: { status: 'PUBLISHED' } });
    const sub = await ok('student', 'POST', `/assignments/${assignment.id}/submissions`);
    result.submissionId = sub.id; result.submissionModuleId = sub.modules.find(m => m.moduleId === module.id)?.id;
    assert.ok(result.submissionModuleId); result.before = snapshot(await ok('student', 'GET', `/submissions/${sub.id}`)); save();
    const endpoint = `/submission-modules/${result.submissionModuleId}`;
    const upload = await ok('student', 'POST', endpoint + '/document-upload-url', { body: { mimeType } });
    assert.ok(upload.storageKey.endsWith(label === 'DOCX' ? '/essay.docx' : '/essay.pdf'));
    result.storageKey = upload.storageKey;
    const file = path.join(dir, filename); const bytes = fs.readFileSync(file);
    result.file = { name: filename, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') }; save();
    const uploaded = await request('student', 'PUT', '', { uploadUrl: upload.uploadUrl, file, mimeType });
    result.uploadStatus = uploaded.status; save(); assert.ok(uploaded.status >= 200 && uploaded.status < 300, `Upload HTTP ${uploaded.status}`);
    for (let n = 0; n < (label === 'DOCX' ? 2 : 1); n++) {
      const at = new Date().toISOString();
      const response = await request('student', 'POST', endpoint + '/submit', { body: {} });
      const after = snapshot(await ok('student', 'GET', `/submissions/${sub.id}`));
      result.attempts.push({ at, method: 'POST', endpoint: endpoint + '/submit', requestBody: {}, responseStatus: response.status, responseBody: response.json, after }); save();
      if (response.status >= 200 && response.status < 300) break;
      if (response.status !== 500 || after.modules.find(m => m.id === result.submissionModuleId)?.status !== 'IN_PROGRESS') break;
    }
    console.log(`${label}: upload HTTP ${result.uploadStatus}; submit HTTP ${result.attempts.map(a => a.responseStatus).join(', ')}; module ${result.attempts.at(-1).after.modules.find(m => m.id === result.submissionModuleId)?.status}`);
  }
  const docx = report.cases.find(c => c.label === 'DOCX'); const pdf = report.cases.find(c => c.label === 'PDF');
  report.verdict = docx.attempts.every(a => a.responseStatus === 500) && docx.attempts.length === 2 && pdf.attempts[0].responseStatus === 200 ? 'REPRODUCED_API_DOCX_500_WITH_PDF_CONTROL_200' : 'REVIEW_OBSERVED_RESULTS';
  report.limitations = ['No browser UI run', 'No staging DB schema/log access; SQLState 22001 inferred from source plus supplied original logs', 'Deployed commit not verified', 'Fixtures retained; no full-submission finalize or AI grading requested'];
} catch (error) {
  report.verdict = 'BLOCKED_OR_INCOMPLETE'; report.error = error.message;
  console.log('Verification incomplete: ' + error.message); process.exitCode = 2;
} finally {
  report.completedAt = new Date().toISOString(); save(); console.log('Evidence: ' + reportPath);
}
