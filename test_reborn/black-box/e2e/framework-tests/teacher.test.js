import test from 'node:test';
import assert from 'node:assert/strict';
import { teacherData, missingInputs, teacherOptions } from '../teacher/support/config.js';
import { literal, TeacherPage } from '../teacher/pages/TeacherPage.js';
import { teacherCases } from '../teacher/cases/assignment-flow.spec.js';
import { TeacherExtendedPage } from '../teacher/pages/TeacherExtendedPage.js';
import { writeTeacherReport } from '../teacher/support/report.js';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

for (const settings of [false, true]) {
  test(`Phone ${settings ? 'settings' : 'profile'} reopens via menu and restores data on success or mismatch`, async () => {
    for (const mismatch of [false, true]) {
      let saved = false, restored = false, dashboardVisited = false, opens = 0;
      const evidence = [];
      const before = { fullName: 'QA Teacher Profile', phone: '0900000001', avatarUrl: '' };
      const data = {
        api: {
          get: async () => saved ? { ...before, phone: '0900000029' } : before,
          request: async (role, method, endpoint, body) => {
            assert.equal(role, 'profile'); assert.equal(method, 'PUT'); assert.equal(endpoint, '/users/me');
            assert.deepEqual(body, before); restored = true;
          },
        }
      };
      const page = new TeacherExtendedPage({ wait: async condition => assert.ok(await condition()) }, { timeout: 10, onEvidence: item => evidence.push(item) });
      page.profile = async () => { opens++; };
      page.path = async route => { if (route === '/teacher/dashboard') dashboardVisited = true; };
      page.fill = async () => {};
      page.click = async locator => {
        if (locator.value.includes('/teacher/settings')) opens++;
        if (locator.value.includes('Lưu thay đổi')) saved = true;
      };
      page.visible = async () => ({ getAttribute: async () => mismatch ? 'wrong-value' : '0900000029' });
      if (mismatch) await assert.rejects(page.phone(data, settings));
      else await page.phone(data, settings);
      assert.equal(dashboardVisited, true);
      assert.equal(opens, 2);
      assert.equal(restored, true);
      assert.ok(evidence.some(item => item.type === 'phone-save'));
      assert.equal(evidence.some(item => item.type === 'phone-reopen'), !mismatch);
    }
  });
}

test('Observation pacing is opt-in, validates arguments, and supports single-case runs', () => {
  assert.deepEqual(teacherOptions([]), { caseId: undefined, observeMs: 0, checkOnly: false, list: false });
  const opt = teacherOptions(['--watch', '--case=TEA-003', '--delay-ms=4000']);
  assert.equal(opt.caseId === 'TEA-003' || opt.caseId === 'QA29-003', true);
  assert.equal(opt.observeMs, 4000);
  assert.equal(opt.checkOnly, false);
  assert.equal(opt.list, false);
  assert.equal(teacherOptions(['--watch']).observeMs, 2500);
  for (const args of [['--delay-ms=4000'], ['--watch', '--delay-ms=NaN'], ['--watch', '--delay-ms=20000'], ['--case='], ['--watch', '--watch']]) assert.throws(() => teacherOptions(args));
});

test('Teacher config rejects invalid grade values before browser execution', () => {
  for (const value of ['NaN', 'Infinity', '-1', '11', '7.1']) {
    assert.throws(() => teacherData({ QA29_SCORE: value }), /QA29_SCORE/);
  }
  assert.equal(teacherData({ QA29_SCORE: '0' }).score, 0);
});

test('Data loading wait is bounded and configurable separately from action timeout', () => {
  assert.equal(teacherData({}).dataTimeoutMs, 180000);
});
