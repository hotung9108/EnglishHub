import test from 'node:test';
import assert from 'node:assert/strict';
import { teacherData, missingInputs, teacherOptions } from '../../support/teacher/config.js';
import { literal, TeacherPage } from '../../pages/teacher/TeacherPage.js';
import { teacherCases } from '../teacher/cases.js';
import { TeacherExtendedPage } from '../../pages/teacher/TeacherExtendedPage.js';
import { writeTeacherReport } from '../../support/teacher/report.js';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

for (const settings of [false, true]) {
  test(`Phone ${settings ? 'settings' : 'profile'} reopens via menu and restores data on success or mismatch`, async () => {
    for (const mismatch of [false, true]) {
      let saved = false, restored = false, dashboardVisited = false, opens = 0;
      const evidence = [];
      const before = { fullName: 'QA Teacher Profile', phone: '0900000001', avatarUrl: '' };
      const data = { api: {
        get: async () => saved ? { ...before, phone: '0900000029' } : before,
        request: async (role, method, endpoint, body) => {
          assert.equal(role, 'profile'); assert.equal(method, 'PUT'); assert.equal(endpoint, '/users/me');
          assert.deepEqual(body, before); restored = true;
        },
      } };
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
  assert.deepEqual(teacherOptions([]), { caseId: undefined, observeMs: 0 });
  assert.deepEqual(teacherOptions(['--watch', '--case=QA29-003', '--delay-ms=4000']), { caseId: 'QA29-003', observeMs: 4000 });
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
  assert.equal(teacherData({ QA29_DATA_TIMEOUT_MS: '240000' }).dataTimeoutMs, 240000);
  for (const value of ['NaN', '-1', '0', '300001', '1.5']) assert.throws(() => teacherData({ QA29_DATA_TIMEOUT_MS: value }), /QA29_DATA_TIMEOUT_MS/);
});

test('Data wait polls for the real visible fixture and continues immediately when ready', async () => {
  const evidence = [];
  const element = { isDisplayed: async () => true };
  let polls = 0;
  const driver = {
    findElements: async () => ++polls === 1 ? [] : [element],
    wait: async (condition, timeout) => {
      assert.equal(timeout, 180000);
      assert.equal(await condition(), false);
      return condition();
    },
  };
  const page = new TeacherPage(driver, { timeout: 30000, dataTimeoutMs: 180000, onEvidence: item => evidence.push(item) });
  assert.equal(await page.waitForData({}, 'bài QA'), element);
  assert.equal(polls, 2);
  assert.equal(evidence[0].status, 'READY');
});

test('A missing fixture is still a failure with evidence after the data wait limit', async () => {
  const evidence = [];
  const timeout = Object.assign(new Error('Fixture not loaded'), { name: 'TimeoutError' });
  const page = new TeacherPage({ wait: async () => { throw timeout; } }, { timeout: 30000, onEvidence: item => evidence.push(item) });
  await assert.rejects(page.waitForData({}, 'bài QA'), error => error.code === 'QA29_DATA_TIMEOUT');
  assert.equal(evidence[0].status, 'FAILED');
});

test('Prerequisites never silently count missing teacher credentials or fixtures as pass', () => {
  assert.deepEqual(missingInputs(['className', 'studentName', 'assignmentTitle'], { users: { teacher: {} } }, {}),
    ['SELENIUM_TEACHER_EMAIL', 'SELENIUM_TEACHER_PASSWORD', 'QA29_CLASS_NAME', 'QA29_STUDENT_NAME', 'QA29_ASSIGNMENT_TITLE']);
});

test('XPath fixture names support apostrophes and quotation marks', () => {
  assert.equal(literal('Class A'), "'Class A'");
  assert.equal(literal("Teacher's class"), '"Teacher\'s class"');
  assert.equal(literal('A\'s "class"'), 'concat(\'A\', "\'", \'s "class"\')');
});

test('Case IDs are unique and all case prerequisites have known fixture keys', () => {
  assert.equal(new Set(teacherCases.map(item => item.id)).size, teacherCases.length);
  assert.ok(teacherCases.length >= 50);
  for (const item of teacherCases) for (const key of item.required) {
    assert.ok(['className', 'studentName', 'assignmentTitle'].includes(key));
  }
});

test('Report preserves failure evidence, links issue draft back to case, and escapes HTML', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'qa29-report-'));
  try {
    const report = { startedAt: '2026-10-14', status: 'FAILED', cases: [
      { id: 'QA29-010', title: '<script>alert(1)</script>', status: 'FAILED', reason: 'Feedback mismatch', steps: 'Reopen', expected: 'Saved feedback', screenshot: 'QA29-010.png' },
    ] };
    await writeTeacherReport(directory, report);
    const html = await fs.readFile(path.join(directory, 'report.html'), 'utf8');
    assert.ok(html.includes('&lt;script&gt;'));
    assert.ok(html.includes('issues/QA29-010.md'));
    const issue = await fs.readFile(path.join(directory, 'issues/QA29-010.md'), 'utf8');
    assert.ok(issue.includes('Test case: QA29-010'));
    assert.ok(issue.includes('../QA29-010.png'));
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});

test('Report distinguishes incomplete runs and redacts tokens in every artifact', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'qa29-report-'));
  try {
    const fakeJwt = 'eyJhbGciOiJub25lIn0.eyJzdWIiOiJxYSJ9.synthetic_signature';
    await writeTeacherReport(directory, { startedAt: '2026-10-14T00:00:00Z', status: 'ABORTED', selectedCases: ['QA29-047', 'QA29-048'], cases: [
      { id: 'QA29-047', title: 'Logout', status: 'FAILED', classification: 'PRODUCT_CANDIDATE', reason: fakeJwt, evidence: [{ accidentalToken: fakeJwt }] },
    ] });
    const summary = JSON.parse(await fs.readFile(path.join(directory, 'summary.json'), 'utf8'));
    assert.deepEqual(summary.notRun, ['QA29-048']);
    assert.equal(summary.counts.PASSED, 0);
    for (const relative of ['summary.json', 'report.html', 'issues/QA29-047.md', 'evidence/QA29-047.json', 'junit.xml', 'TRIAGE.md']) {
      assert.ok(!(await fs.readFile(path.join(directory, relative), 'utf8')).includes(fakeJwt));
    }
    assert.match(await fs.readFile(path.join(directory, 'junit.xml'), 'utf8'), /tests="2" failures="1" skipped="1"/);
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});
