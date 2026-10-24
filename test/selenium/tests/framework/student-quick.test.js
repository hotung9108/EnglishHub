import test from 'node:test';
import assert from 'node:assert/strict';
import { reuseStudentFixture } from '../../support/student/quick-fixtures.js';
import { listAttempts, ensureStudentAssignment } from '../../support/student/fixtures.js';

function context({ used = false, wrongOwner = false } = {}) {
  const calls = [];
  const data = { classId: 10, className: 'QA30-Student-synthetic', studentId: 7, teacherId: 8, assignments: {
    writing: { id: 20, moduleId: 30, title: 'QA30-original-writing', skill: 'WRITING', ready: true },
    draft: { id: 21, title: 'QA30-untouched-draft', ready: true },
  } };
  const api = {
    sessions: {},
    login: async role => {
      calls.push(`login:${role}`);
      const user = role === 'student' ? { id: 7, role: 'STUDENT', fullName: 'QA Student Automation' } : { id: 8 };
      api.sessions[role] = { user }; return user;
    },
    get: async (_role, endpoint) => {
      calls.push(endpoint);
      if (endpoint === '/classes/10') return { name: data.className, teacherId: wrongOwner ? 999 : 8 };
      if (endpoint === '/assignments/20') return { title: data.assignments.writing.title, modules: [{ id: 30 }] };
      if (endpoint.startsWith('/submissions?')) return { data: used ? [{ id: 40, status: 'SUBMITTED', modules: [{ moduleId: 30 }] }] : [] };
      throw new Error(`Unexpected quick-mode request: ${endpoint}`);
    },
    request: async (role, method, endpoint) => {
      calls.push(`${role}:${method}:${endpoint}`);
      if (endpoint === '/classes/10/assignments') return { id: 22 };
      if (endpoint === '/assignments/22/modules') return { id: 32 };
      if (endpoint === '/modules/32/questions') return { id: 42 };
      if (endpoint === '/assignments/22/status') return {};
      throw new Error('Quick mode attempted an unrelated mutation');
    },
  };
  return { calls, data, config: { users: {} }, account: { email: 'qa30-0123456789ab@example.invalid', password: 'synthetic-password' }, api };
}

test('Quick Overview uses cached data with four auth/read calls and no mutation', async () => {
  const c = context();
  const result = await reuseStudentFixture(c.config, { ...c, caseId: 'QA30-007', list: listAttempts, create: () => assert.fail('must not create a full fixture set'), save: () => assert.fail('must not rewrite cached data') });
  assert.equal(result.classId, 10);
  assert.equal(c.calls.length, 4);
  assert.deepEqual(c.calls.slice(0, 3), ['login:student', '/classes/10', '/assignments/20']);
});

test('Quick Overview replaces only a used selected assignment with the real fixture builder', async () => {
  const c = context({ used: true }); let saves = 0;
  const untouched = structuredClone(c.data.assignments.draft);
  await reuseStudentFixture(c.config, { ...c, caseId: 'QA30-007', list: listAttempts, create: ensureStudentAssignment, save: async () => { saves++; } });
  assert.equal(c.data.assignments.writing.id, 22);
  assert.equal(c.data.assignments.writing.moduleId, 32);
  assert.equal(c.data.assignments.writing.taskType, 'ESSAY');
  assert.equal(c.data.assignments.writing.questionId, undefined);
  assert.equal(c.data.assignments.writing.ready, true);
  assert.notEqual(c.data.assignments.writing.title, 'QA30-original-writing');
  assert.deepEqual(c.data.assignments.draft, untouched);
  assert.ok(saves > 0);
  assert.equal(c.calls.some(call => call.includes('admin') || call === 'teacher:POST:/classes'), false);
});

test('Quick reuse rejects a mismatched owner before creating or editing anything', async () => {
  const c = context({ wrongOwner: true });
  await assert.rejects(reuseStudentFixture(c.config, { ...c, caseId: 'QA30-007', list: listAttempts, create: () => assert.fail('must not mutate another owner'), save: () => {} }));
  assert.deepEqual(c.calls, ['login:student', '/classes/10']);
});
