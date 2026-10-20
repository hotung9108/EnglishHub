import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { verifySubmitted, latestAttempt } from '../../support/student/fixtures.js';
import { studentCases } from '../student/cases.js';
import { writeSuiteReport } from '../../utils/suite-reporter.js';
import { summarizeNetwork } from '../../support/student/network.js';

test('Student submission verdict rejects UI success when API still has an in-progress attempt', () => {
  assert.throws(() => verifySubmitted({ submission: { status: 'IN_PROGRESS' }, module: { status: 'IN_PROGRESS', answers: [] } }), /not persisted/);
});
test('Student readback matches the real module when the list DTO omits assignmentId', async () => {
  const data = { studentId: 77, api: { get: async (_role, endpoint) => {
    if (endpoint.startsWith('/submissions?')) return { data: [
      { id: 1, attemptNumber: 2, modules: [{ moduleId: 888 }] },
      { id: 2, attemptNumber: 1, modules: [{ moduleId: 999 }] },
    ] };
    if (endpoint === '/submissions/2') return { id: 2, assignmentId: 100, studentId: 77, modules: [{ id: 5, moduleId: 999 }] };
    if (endpoint === '/submission-modules/5') return { id: 5, moduleId: 999 };
    throw new Error('Readback selected the wrong submission');
  } } };
  const snapshot = await latestAttempt(data, { id: 100, moduleId: 999 });
  assert.equal(snapshot.submission.id, 2); assert.equal(snapshot.module.moduleId, 999);
});
test('Speaking/document verdict requires a stored READY asset, not just a submitted status', () => {
  const snapshot = { submission: { status: 'SUBMITTED' }, module: { status: 'SUBMITTED', answers: [] } };
  assert.throws(() => verifySubmitted(snapshot, { audio: true }), /No READY audio/);
  assert.throws(() => verifySubmitted(snapshot, { document: true }), /No READY document/);
  snapshot.module.answers = [{ audioStorageKey: 'synthetic.wav', audioUploadStatus: 'READY', docStorageKey: 'synthetic.pdf', docUploadStatus: 'READY', content: { text: 'daily practice' } }];
  verifySubmitted(snapshot, { audio: true, document: true, text: 'daily practice' });
  assert.throws(() => verifySubmitted(snapshot, { text: 'another answer' }), /exact text/);
});
test('Student registry contains distinct cases for all required business flows', () => {
  assert.equal(studentCases.length, 45);
  assert.equal(new Set(studentCases.map(test => test.id)).size, studentCases.length);
  for (const test of studentCases) {
    assert.ok(test.steps && test.expected && typeof test.run === 'function');
    assert.match(test.id, /^QA30-\d{3}$/);
  }
});

test('In-progress readback does not call the submitted-only module detail endpoint', async () => {
  const calls = [];
  const data = { studentId: 77, api: { get: async (_role, endpoint) => {
    calls.push(endpoint);
    if (endpoint.startsWith('/submissions?')) return { data: [{ id: 2, attemptNumber: 1, modules: [{ id: 5, moduleId: 999 }] }] };
    if (endpoint === '/submissions/2') return { id: 2, assignmentId: 100, studentId: 77, status: 'IN_PROGRESS', modules: [{ id: 5, moduleId: 999, status: 'IN_PROGRESS' }] };
    throw new Error('The module detail endpoint rejects in-progress work with HTTP 400');
  } } };
  const snapshot = await latestAttempt(data, { id: 100, moduleId: 999 }, { submissionId: 2 });
  assert.equal(snapshot.module.status, 'IN_PROGRESS');
  assert.equal(calls.some(endpoint => endpoint.startsWith('/submission-modules/')), false);
  assert.throws(() => verifySubmitted(snapshot), /not persisted/);
});

test('Readback pins the UI submission even when another completed attempt is newer', async () => {
  const data = { studentId: 77, api: { get: async (_role, endpoint) => {
    if (endpoint.startsWith('/submissions?')) return { data: [
      { id: 3, attemptNumber: 2, modules: [{ moduleId: 999 }] },
      { id: 2, attemptNumber: 1, modules: [{ moduleId: 999 }] },
    ] };
    if (endpoint === '/submissions/2') return { id: 2, assignmentId: 100, studentId: 77, status: 'SUBMITTED', modules: [{ id: 5, moduleId: 999, status: 'SUBMITTED' }] };
    if (endpoint === '/submission-modules/5') return { id: 5, status: 'SUBMITTED', answers: [] };
    throw new Error('Readback selected a different attempt');
  } } };
  const snapshot = await latestAttempt(data, { id: 100, moduleId: 999 }, { submissionId: 2 });
  assert.equal(snapshot.submission.id, 2);
  await assert.rejects(latestAttempt(data, { id: 100, moduleId: 999 }, { submissionId: 99 }), /does not belong/);
});

test('MCQ readback requires the selected option on the exact question', () => {
  const snapshot = { submission: { status: 'GRADED' }, module: { status: 'GRADED', answers: [{ questionId: 99, content: { selectedOptionIds: [2] } }] } };
  verifySubmitted(snapshot, { selectedOptionId: 2, questionId: 99 });
  assert.throws(() => verifySubmitted(snapshot, { selectedOptionId: 1, questionId: 99 }), /expected question/);
  assert.throws(() => verifySubmitted(snapshot, { selectedOptionId: 2, questionId: 100 }), /expected question/);
});

test('Browser metadata excludes auth, bodies, headers and signed query strings', () => {
  const entry = (method, params) => ({ message: JSON.stringify({ message: { method, params } }) });
  const result = summarizeNetwork([
    entry('Network.requestWillBeSent', { requestId: 'login', request: { method: 'POST', url: 'https://api-staging.hotung9108.me/api/v1/auth/login', postData: 'synthetic-password' } }),
    entry('Network.requestWillBeSent', { requestId: 'submit', request: { method: 'POST', url: 'https://api-staging.hotung9108.me/api/v1/submissions/2/submit?token=synthetic-token', headers: { Authorization: 'Bearer synthetic-token' }, postData: 'synthetic-private-body' } }),
    entry('Network.responseReceived', { requestId: 'submit', response: { status: 200, mimeType: 'application/json' } }),
    entry('Network.requestWillBeSent', { requestId: 'upload', request: { method: 'PUT', url: 'https://storage.example.invalid/qa/audio.wav?signature=synthetic-secret' } }),
    entry('Network.responseReceived', { requestId: 'upload', response: { status: 403 } }),
  ]);
  assert.equal(result.length, 2); assert.equal(result[0].status, 200); assert.equal(result[1].status, 403);
  assert.equal(result[1].endpoint, '[storage-upload]');
  assert.doesNotMatch(JSON.stringify(result), /auth\/login|synthetic-|Authorization|signature|storage.example/);
});
test('Shared reporter labels QA30 correctly and preserves unexecuted cases and failure evidence', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'qa30-report-'));
  try {
    await writeSuiteReport(dir, { suite: { id: 'QA-30', role: 'Học viên', key: 'QA30.Student' }, status: 'FAILED', selectedCases: ['QA30-011', 'QA30-016'], cases: [{ id: 'QA30-011', title: 'Text submission', status: 'FAILED', reason: 'Bearer synthetic-token', screenshot: 'QA30-011.png' }] });
    const html = await fs.readFile(path.join(dir, 'report.html'), 'utf8');
    assert.match(html, /QA-30 · Học viên/); assert.doesNotMatch(html, /QA-29/);
    assert.match(html, /QA30-016/); assert.doesNotMatch(html, /Bearer synthetic-token/);
    assert.match(await fs.readFile(path.join(dir, 'junit.xml'), 'utf8'), /QA30.Student/);
    assert.match(await fs.readFile(path.join(dir, 'issues/QA30-011.md'), 'utf8'), /QA-30/);
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});

test('Product-blocked report keeps dependency and actual GitHub issue in HTML and evidence', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'qa30-dependency-report-'));
  try {
    const issueRefs=[{url:'https://github.com/hotung9108/EnglishHub/issues/178',group:'grade-mapping'}];
    await writeSuiteReport(dir,{suite:{id:'QA-30',role:'Học viên',key:'QA30.Student'},status:'FAILED',selectedCases:['QA30-017'],cases:[{id:'QA30-017',title:'Grade action',status:'BLOCKED',classification:'PRODUCT_DEPENDENCY',dependsOn:['QA30-028'],issueRefs,reason:'Missing grade row'}]});
    const html=await fs.readFile(path.join(dir,'report.html'),'utf8');
    assert.match(html,/Depends on: QA30-028/);assert.match(html,/https:\/\/github.com\/hotung9108\/EnglishHub\/issues\/178/);
    const evidence=JSON.parse(await fs.readFile(path.join(dir,'evidence/QA30-017.json'),'utf8'));
    assert.deepEqual(evidence.dependsOn,['QA30-028']);assert.deepEqual(evidence.issueRefs,issueRefs);
    assert.match(await fs.readFile(path.join(dir,'junit.xml'),'utf8'),/<skipped/);
  } finally { await fs.rm(dir,{recursive:true,force:true}); }
});
