import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseOptions, classify } from '../admin/support/options.js';
import { assertOwned, assertStaging, resourcesFor, readUser, prepareFixtures } from '../admin/support/fixtures.js';
import { adminCases } from '../admin/cases/account-lifecycle.spec.js';
import { summarizeNetwork } from '../admin/support/network.js';
import { writeSuiteReport } from '../common/support/suite-reporter.js';
import { checkStagingAvailability } from '../admin/support/staging-health.js';
import { AdminPage } from '../admin/pages/AdminPage.js';
import { assertAccountRejected, assertProgressMetrics, assertGradingCells, assertAuditLogs, assertReportClassCells } from '../admin/support/assertions.js';
import { adminProcedures, detailedAdminSteps } from '../admin/cases/procedures.js';

test('published issue links survive report rendering without labelling scope review as a bug', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'adm-issue-links-'));
  try {
    const cases = ['ADM-036', 'ADM-041', 'ADM-050'].map(id => {
      const c = adminCases.find(c => c.id === id);
      return { id, title: c.title, issueRefs: c.issueRefs, status: 'BLOCKED', startedAt: new Date().toISOString() };
    });
    await writeSuiteReport(directory, { suite: { id: 'ADM-E2E', key: 'Admin.E2E', role: 'Admin' }, cases, selectedCases: cases.map(c => c.id), status: 'COMPLETED' });
    const html = await fs.readFile(path.join(directory, 'report.html'), 'utf8');
    for (const number of [190, 195, 196]) assert.ok(html.includes(`https://github.com/hotung9108/EnglishHub/issues/${number}`));
    const scope = JSON.parse(await fs.readFile(path.join(directory, 'evidence/ADM-050.json'), 'utf8'));
    assert.deepEqual(scope.issueRefs, []);
    const related = JSON.parse(await fs.readFile(path.join(directory, 'evidence/ADM-036.json'), 'utf8'));
    assert.equal(related.issueRefs[1].group, 'Related API diagnostic');
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});

test('every Admin case has numbered procedures matching the registry', () => {
  assert.equal(Object.keys(adminProcedures).length, adminCases.length);
  for (const c of adminCases) {
    const lines = c.steps.split('\n'); assert.ok(lines.length >= 3, `${c.id} missing detailed steps`);
    lines.forEach((line, i) => assert.ok(line.startsWith(`${i + 1}. `)));
    assert.equal(c.steps, detailedAdminSteps(c.id));
  }
  assert.throws(() => detailedAdminSteps('ADM-999'), /Missing/);
});

test('targeted retest validates every selected case and shares one fixture plan', () => {
  const selected = parseOptions(['--cases=003,014,ADM-025,39,040,003'], adminCases).selected;
  assert.deepEqual(selected.map(c => c.id), ['ADM-003', 'ADM-014', 'ADM-025', 'ADM-039', 'ADM-040']);
  assert.deepEqual([...resourcesFor(selected)].sort(), ['baseClass', 'student', 'teacher']);
  for (const value of ['--cases=003,999', '--cases=003,', '--cases=']) assert.throws(() => parseOptions([value], adminCases));
  assert.throws(() => parseOptions(['--case=003', '--cases=014'], adminCases));
});

test('Accounts creation verifies persisted role; selecting ADMIN cannot pass with a STUDENT record', async () => {
  for (const [id, wanted, actual, shouldPass] of [['ADM-036', 'ADMIN', 'STUDENT', false], ['ADM-036', 'ADMIN', 'ADMIN', true], ['ADM-037', 'TEACHER', 'TEACHER', true], ['ADM-038', 'STUDENT', 'STUDENT', true]]) {
    let roleValue = 'STUDENT'; const entered = [];
    const select = { findElements: async () => ['ADMIN', 'TEACHER', 'STUDENT'].map(value => ({ getAttribute: async () => value })), getAttribute: async () => roleValue };
    const p = { nav: async () => {}, button: async () => {}, visible: async () => ({}), field: async () => ({}), fill: async (_, value) => entered.push(value), select: async (_, value) => { roleValue = value; }, clickElement: async () => {}, driver: { findElements: async locator => locator.value === '.adm-drawer select' ? [select] : [] } };
    const data = { tag: 'abc123', names: { teacher: 'QA Admin Teacher abcdef' }, password: 'private-test-value', ledger: [], api: { get: async () => ({ data: [{ id: 90, email: `qa31-abc123-${wanted.toLowerCase()}-accounts-ui@example.invalid`, fullName: `QA Accounts ${wanted} abcdef`, role: actual }] }) } };
    const result = {}; const action = adminCases.find(c => c.id === id).run(p, data, result);
    if (shouldPass) await action; else await assert.rejects(action, /vai trò khác/);
    assert.equal(roleValue, wanted); assert.equal(result.readback.requested.role, wanted); assert.equal(result.readback.actual.user.role, actual);
    assert.equal(data.ledger[0].role, actual, 'Keep the actual wrongly created user traceable');
    assert.ok(!JSON.stringify(result).includes(data.password)); assert.equal(entered.length, 3);
  }
});
