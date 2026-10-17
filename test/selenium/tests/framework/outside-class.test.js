import test from 'node:test';
import assert from 'node:assert/strict';
import { TeacherExtendedPage } from '../../pages/teacher/TeacherExtendedPage.js';

function scenario({ allowed = true, uiDenied = true, owner = 5 } = {}) {
  const visited = [], evidence = [], calls = [];
  const data = { extra: { foreignClass: 126, foreignAssignment: { title: 'Private QA assignment' } }, api: {
    sessions: { teacher: { user: { id: 4 } }, outsider: { user: { id: 5 } } },
    get: async (role, endpoint) => {
      calls.push([role, endpoint]);
      if (endpoint === '/users/me') return { id: 4 };
      if (role === 'admin') return { id: 126, teacherId: owner, name: 'Private QA class' };
      if (!allowed) throw Object.assign(new Error('Forbidden'), { status: 403 });
      return { id: 126, teacherId: owner, name: 'Private QA class' };
    },
  } };
  const page = new TeacherExtendedPage({
    get: async url => visited.push(url),
    findElement: async () => ({ getText: async () => uiDenied ? 'Không có quyền' : 'Private QA class' }),
    wait: async condition => { if (!await condition()) throw new Error('UI did not deny access'); },
  }, { baseUrl: 'https://staging.hotung9108.me', timeout: 1, onEvidence: item => evidence.push(item) });
  page.visible = async () => {};
  page.step = async () => {};
  return { page, data, visited, evidence, calls };
}

test('039 still visits UI when class API allows access, then reports API separately', async () => {
  const s = scenario();
  await assert.rejects(s.page.outside(s.data, 'class'));
  assert.equal(s.visited.length, 1, 'Watch must navigate to foreign class before verdict');
  assert.ok(s.evidence.some(item => item.type === 'authorization-ui' && item.denied));
  assert.ok(s.calls.some(([role, endpoint]) => role === 'teacher' && endpoint === '/classes/126'));
});

test('039 passes only when API and UI both deny the verified foreign class', async () => {
  const s = scenario({ allowed: false });
  await s.page.outside(s.data, 'class');
  assert.equal(s.visited.length, 1);
});

test('039 rejects an incorrectly owned fixture before judging product access', async () => {
  const s = scenario({ owner: 4 });
  await assert.rejects(s.page.outside(s.data, 'class'), error => error.code === 'QA29_BLOCKED');
  assert.equal(s.visited.length, 0);
});

test('039 records UI failure even when API correctly denies access', async () => {
  const s = scenario({ allowed: false, uiDenied: false });
  await assert.rejects(s.page.outside(s.data, 'class'));
  assert.ok(s.evidence.some(item => item.type === 'authorization-ui' && item.denied === false));
});
