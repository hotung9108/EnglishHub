import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { root } from '../../config/env.js';
import { StagingApi } from '../teacher/expanded-api.js';
import { reuseStudentFixture } from './quick-fixtures.js';
import { studentPlan } from './scenario-plan.js';

export const ledgerPath = path.join(root, 'fixtures/qa30.json');
const accountPath = path.join(root, '.cache/qa30-account.json');
const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');


const definitions = { writing: 'WRITING', draft: 'WRITING', document: 'WRITING', reading: 'READING', wrong: 'READING', listening: 'LISTENING', speaking: 'SPEAKING', graded: 'READING', mcqReading: 'READING', mcqWrong: 'READING', mcqListening: 'LISTENING', navigation: 'WRITING', speakingValidation: 'SPEAKING', mcqCancel: 'READING' };
const mcqOptions = ['daily practice', 'once a year', 'never study', 'skip feedback'];

export async function ensureStudentAssignment(api, data, key, save, check = () => {}) {
  const skill = definitions[key];
  assert.ok(skill, "Unknown student fixture key");
  if (data.assignments[key]?.ready) return;
  let item = data.assignments[key];
  check();
  if (!item) {
    const title = `QA30-${skill}-${key}-${stamp()}`;
    const maxSubmissions = key === 'graded' ? 1 : 10;
    const assignment = await api.request('teacher', 'POST', `/classes/${data.classId}/assignments`, { title, description: `Synthetic QA30 ${skill} submission test.`, openAt: new Date(Date.now() - 86400000).toISOString(), closeAt: new Date(Date.now() + 14 * 86400000).toISOString(), maxSubmissions });
    item = data.assignments[key] = { id: assignment.id, title, skill, maxSubmissions };
    await save();
  }
  check();
  if (!item.moduleId) {
    // ModuleService only accepts WRITING/ESSAY; REWRITE belongs to READING.
    const taskType = skill === 'WRITING' ? 'ESSAY' : skill === 'SPEAKING' ? 'RECORDING' : 'QUIZ';
    const module = await api.request('teacher', 'POST', `/assignments/${item.id}/modules`, { skill, taskType, orderIndex: 1, maxScore: 10, instructions: `QA30 ${skill}: daily practice. Synthetic fixture, no student work.` });
    item.taskType = taskType;
    item.moduleId = module.id; await save();
  }
  check();
  if (['READING', 'LISTENING'].includes(skill) && !item.questionId) {
    item.questionType = key.startsWith('mcq') ? 'MULTIPLE_CHOICE' : 'SHORT_ANSWER';
    item.questionText = item.questionType === 'MULTIPLE_CHOICE' ? 'QA30: choose the phrase daily practice.' : 'QA30: type the phrase daily practice.';
    if (item.questionType === 'MULTIPLE_CHOICE') item.options = [...mcqOptions];
    const correctAnswer = item.questionType === 'MULTIPLE_CHOICE'
      ? { options: mcqOptions.map((content, index) => ({ id: index + 1, content, isCorrect: index === 0 })) }
      : { correctAnswer: 'daily practice' };
    const question = await api.request('teacher', 'POST', `/modules/${item.moduleId}/questions`, { content: item.questionText, questionType: item.questionType, correctAnswer, score: 10, orderIndex: 1 });
    item.questionId = question.id; await save();
  }
  check();
  await api.request('teacher', 'PATCH', `/assignments/${item.id}/status`, { status: 'PUBLISHED' });
  item.ready = true; await save();
}

export async function prepareStudent(config, { fresh = false, quick = false, caseId, progress = () => {}, check = () => {} } = {}) {
  assert.equal(config.baseUrl, 'https://staging.hotung9108.me', 'QA30 fixture preparation is staging-only');
  const api = new StagingApi(config);
  const plan = studentPlan(caseId);
  if (quick && caseId && !fresh) {
    let account, data;
    try {
      account = JSON.parse(await fs.readFile(accountPath, 'utf8'));
      data = JSON.parse(await fs.readFile(ledgerPath, 'utf8'));
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (account && data?.schemaVersion === 3 && plan.assignments.every(key => data.assignments[key]?.ready) && (!plan.evaluation || data.evaluation) && (!plan.grading || data.assignments.graded.gradingId)) {
      progress('Che do nhanh: tai su dung fixture, khong tao lai ca bo.');
      return reuseStudentFixture(config, { account, data, caseId, api, save: () => fs.writeFile(ledgerPath, JSON.stringify(data, null, 2)), create: ensureStudentAssignment, list: listAttempts, progress, check });
    }
    progress('Chua co du fixture hop le; can chuan bi lan dau.');
  }
  check(); progress('Dang nhap va kiem tra tai khoan QA...');
  await api.login('admin'); await api.login('teacher');
  // Verify the provided student input, then isolate suite data in a generated QA account.
  await api.login('student');
  await fs.mkdir(path.dirname(accountPath), { recursive: true });
  await fs.mkdir(path.dirname(ledgerPath), { recursive: true });
  let account;
  try { account = JSON.parse(await fs.readFile(accountPath, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!account) {
    account = { email: `qa30-${crypto.randomBytes(6).toString('hex')}@example.invalid`, password: `Qa30!${crypto.randomBytes(12).toString('hex')}Aa7` };
    await api.request('admin', 'POST', '/admin/users', { ...account, fullName: 'QA Student Automation', role: 'STUDENT', studentCode: `QA30-${crypto.randomBytes(5).toString('hex')}` });
    await fs.writeFile(accountPath, JSON.stringify(account));
  }
  assert.match(account.email, /^qa30-[0-9a-f]{12}@example\.invalid$/);
  config.users.student = account;
  const student = await api.login('student');
  assert.equal(student.role, 'STUDENT');
  assert.equal(student.fullName, 'QA Student Automation');
  let data;
  try { data = JSON.parse(await fs.readFile(ledgerPath, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (data) {
    assert.equal(data.studentId, student.id);
    assert.equal(data.teacherId, api.sessions.teacher.user.id);
    assert.match(data.className, /^QA30-Student-\d{4}-/);
    const detail = await api.get('teacher', `/classes/${data.classId}`);
    assert.equal(detail.name, data.className);
    assert.equal(detail.teacherId ?? detail.teacher?.id, data.teacherId);
  }
  if (!data || fresh || data.schemaVersion !== 3) {
    check(); progress('Tao lop QA30 rieng...');
    data = { runId: stamp(), studentId: student.id, teacherId: api.sessions.teacher.user.id, assignments: {} };
    data.schemaVersion = 3;
    data.className = `QA30-Student-${data.runId}`;
    const cls = await api.request('admin', 'POST', '/classes', { name: data.className, description: 'Isolated QA30 Selenium student fixture; retain for evidence.', level: 'B1', teacherId: data.teacherId, startDate: '2026-10-01', endDate: '2027-10-01' });
    data.classId = cls.id;
    await api.request('admin', 'POST', `/classes/${cls.id}/members`, { studentId: student.id });
    await fs.writeFile(ledgerPath, JSON.stringify(data, null, 2));
  }
  const save = () => fs.writeFile(ledgerPath, JSON.stringify(data, null, 2));
  for (const key of plan.assignments) {
    check(); progress(`Chuan bi bai ${key}...`);
    await ensureStudentAssignment(api, data, key, save, check);
  }
  if (plan.grading) {
    const item = data.assignments.graded;
    check(); progress('Chuan bi bai cham san 7.5/10...');
    if (!item.submissionId) {
      const sub = await api.request('student', 'POST', `/assignments/${item.id}/submissions`);
      item.submissionId = sub.id; item.submissionModuleId = sub.modules[0].id; await save();
    }
    if (!item.gradingId) {
      const current = await api.get('student', `/submissions/${item.submissionId}`);
      if (current.modules[0].status === 'IN_PROGRESS') await api.request('student', 'POST', `/submission-modules/${item.submissionModuleId}/submit`, { answers: [{ questionId: item.questionId, content: { text: 'daily practice' } }] });
      if (current.status === 'IN_PROGRESS') await api.request('student', 'POST', `/submissions/${item.submissionId}/submit`);
      item.gradingId = (await api.get('teacher', `/submission-modules/${item.submissionModuleId}/grading`)).id;
      data.feedback = `QA30 official feedback ${data.runId}: clear response; practise examples.`;
      await api.request('teacher', 'PUT', `/gradings/${item.gradingId}`, { finalScore: 7.5, finalFeedback: data.feedback, note: 'QA30 synthetic grading fixture' });
      await save();
    }
    const grading = await api.get('student', `/gradings/${item.gradingId}`);
    assert.equal(grading.finalScore, 7.5); assert.equal(grading.finalFeedback, data.feedback);
  }
  if (plan.evaluation && !data.evaluation) {
    check(); progress('Chuan bi danh gia dinh ky...');
    const content = `QA30 periodic evaluation ${data.runId}: steady progress in all four skills.`;
    const created = await api.request('teacher', 'POST', `/students/${student.id}/evaluations`, { classId: data.classId, content });
    data.evaluation = { id: created.id, content }; await save();
  }
  if (plan.evaluation) {
    const evaluations = await api.get('student', `/students/${student.id}/evaluations?classId=${data.classId}&limit=100`);
    assert.ok(evaluations.data.some(ev => ev.id === data.evaluation.id && ev.content === data.evaluation.content));
  }
  check(); progress('Du lieu san sang; dang mo Chrome.');
  return { ...data, api };
}

export async function listAttempts(data, item) {
  const response = await data.api.get('student', `/submissions?assignmentId=${item.id}&studentId=${data.studentId}&limit=100`);
  return response.data.filter(sub => sub.modules?.some(module => module.moduleId === item.moduleId)).sort((a, b) => b.attemptNumber - a.attemptNumber);
}

export async function latestAttempt(data, item, { submissionId, includeAnswers = true } = {}) {
  // The list DTO omits assignmentId. Match the verified assignment module,
  // then assert ownership/assignment again using the detail response.
  let attempts = [];
  const deadline = Date.now() + 10000;
  do {
    attempts = await listAttempts(data, item);
    if (attempts.length || Date.now() >= deadline) break;
    await delay(500);
  } while (Date.now() < deadline);
  assert.ok(attempts.length, `No API attempt exists for ${item.title}`);
  if (submissionId !== undefined) assert.ok(attempts.some(attempt => attempt.id === submissionId), 'The UI submission does not belong to this assignment');
  const submission = await data.api.get('student', `/submissions/${submissionId ?? attempts[0].id}`);
  assert.equal(submission.assignmentId, item.id);
  assert.equal(submission.studentId, data.studentId);
  let module = submission.modules.find(mod => mod.moduleId === item.moduleId);
  assert.ok(module, 'Submission detail must contain the expected assignment module');
  const completed = value => ['SUBMITTED', 'GRADED'].includes(value);
  if (includeAnswers && completed(submission.status) && completed(module.status)) module = await data.api.get('student', `/submission-modules/${module.id}`);
  return { submission, module, attempts };
}

export function verifySubmitted(snapshot, { text, audio = false, document = false, selectedOptionId, questionId } = {}) {
  const { submission, module } = snapshot;
  assert.ok(['SUBMITTED', 'GRADED'].includes(submission.status), `UI submission was not persisted: submission=${submission.status}, module=${module.status}`);
  assert.ok(['SUBMITTED', 'GRADED'].includes(module.status), `Module remained ${module.status}`);
  const answers = module.answers || [];
  if (selectedOptionId !== undefined) assert.ok(answers.some(answer => answer.questionId === questionId && answer.content?.selectedOptionIds?.length === 1 && answer.content.selectedOptionIds[0] === selectedOptionId), 'API did not retain the selected MCQ option for the expected question');
  if (text) assert.ok(answers.some(answer => answer.content?.text === text && (questionId === undefined || answer.questionId === questionId)), 'API did not retain the exact text entered through UI on the expected question');
  if (audio) assert.ok(answers.some(answer => answer.audioStorageKey && answer.audioUploadStatus === 'READY'), 'No READY audio recording stored after Speaking UI submission');
  if (document) assert.ok(answers.some(answer => answer.docStorageKey && answer.docUploadStatus === 'READY'), 'No READY document stored after Writing UI upload');
}
