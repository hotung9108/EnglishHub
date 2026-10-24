import test from 'node:test';
import assert from 'node:assert/strict';
import { isQaClass, isQaAssignment, isQaProfile, cleanupFixtures } from '../../support/teacher/cleanup.js';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

test('Cleanup identifies only the exact fixture naming formats, not arbitrary QA29 mentions', () => {
  const stamp = '2026-10-14T14-07-29-421Z';
  assert.ok(isQaClass(`QA29-Teacher-${stamp}`));
  assert.ok(isQaClass(`QA29X-Outside-${stamp}`));
  for (const name of ['English B1', 'QA29-real-class', 'My QA29 class', `QA29-Teacher-${stamp}-other`]) assert.equal(isQaClass(name), false);
  for (const prefix of ['QA29-Writing-Grading', 'QA29-DRAFT', 'QA29-PUBLISH', 'QA29X-READING-UI', 'QA29X-WRITING-Edited', 'QA29X-SPEAKING-Grade']) assert.ok(isQaAssignment(`${prefix}-${stamp}`));
  for (const title of ['Weekly assignment', 'QA29 homework', 'QA29X-Cancel', 'QA29X-WRITING-UI-no-date']) assert.equal(isQaAssignment(title), false);
});

test('Cleanup profile predicate excludes real teachers and shared seed accounts', () => {
  const user = { email: 'qa29-012345abcdef@example.invalid', fullName: 'QA Teacher Profile', role: 'TEACHER' };
  assert.ok(isQaProfile(user));
  assert.equal(isQaProfile({ ...user, email: 'teacher@example.com' }), false);
  assert.equal(isQaProfile({ ...user, fullName: 'Real Teacher' }), false);
  assert.equal(isQaProfile({ ...user, role: 'ADMIN' }), false);
});

test('Dry-run inventories only QA assignments in verified QA-owned classes and never mutates API data', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'qa29-cleanup-'));
  const stamp = '2026-10-14T14-07-29-421Z';
  const className = `QA29-Teacher-${stamp}`;
  const calls = [];
  const api = {
    base: 'https://api-staging.hotung9108.me/api/v1', sessions: {},
    login: async role => { api.sessions[role] = { user: { id: { admin: 1, teacher: 4, student: 12, outsider: 5 }[role] } }; },
    get: async (_role, endpoint) => {
      calls.push(endpoint);
      if (endpoint.startsWith('/classes?')) return { data: [{ id: 120, name: className }, { id: 99, name: 'Real Class' }] };
      if (endpoint === '/classes/120') return { id: 120, name: className, teacherId: 4 };
      if (endpoint.startsWith('/classes/120/assignments?')) return { data: [{ id: 1330, title: `QA29-Writing-Grading-${stamp}` }, { id: 1331, title: 'Real student homework' }] };
      if (endpoint.startsWith('/admin/users?')) return { data: [{ id: 682, email: 'qa29-012345abcdef@example.invalid', fullName: 'QA Teacher Profile', role: 'TEACHER' }, { id: 12, email: 'qa29-012345abcdef@example.invalid', fullName: 'QA Teacher Profile', role: 'TEACHER' }] };
      throw new Error('Unexpected endpoint');
    },
    request: async () => { throw new Error('A dry-run must not mutate anything'); },
  };
  try {
    const result = await cleanupFixtures({ baseUrl: 'https://staging.hotung9108.me', users: {} }, { api, fixtureLedger: { teacherId: 4, studentId: 12, classId: 120 }, directory });
    assert.deepEqual(result.assignments.map(item => item.id), [1330]);
    assert.deepEqual(result.users.map(item => item.id), [682]);
    assert.equal(result.classes[0].hasUnownedAssignments, true);
    assert.ok(!calls.includes('/classes/99'));
    assert.equal(result.actions.length, 0);
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});
