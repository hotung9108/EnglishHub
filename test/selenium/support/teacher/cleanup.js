import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { root } from '../../config/env.js';
import { StagingApi } from './expanded-api.js';

const stamp = '\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}-\\d{3}Z';
export const isQaClass = name => new RegExp(`^QA29(?:-Teacher|X-Outside)-${stamp}$`).test(name || '');
export const isQaAssignment = title => new RegExp(`^QA29(?:-Writing-Grading|-DRAFT|-PUBLISH|X-(?:WRITING|READING|LISTENING|SPEAKING)-(?:Edit|Edited|Grade|Outside|UI))-${stamp}$`).test(title || '');
export const isQaProfile = user => /^qa29-[0-9a-f]{12}@example\.invalid$/.test(user.email || '') && user.fullName === 'QA Teacher Profile' && user.role?.toUpperCase() === 'TEACHER';

async function listAll(api, role, endpoint) {
  const items = [];
  for (let page = 1; page <= 100; page++) {
    const result = await api.get(role, `${endpoint}${endpoint.includes('?') ? '&' : '?'}page=${page}&limit=100`);
    assert.ok(Array.isArray(result.data), 'Cleanup list must provide data array');
    items.push(...result.data);
    if (result.data.length < 100 || items.length >= result.pagination?.total) return items;
  }
  throw new Error('Cleanup pagination exceeded limit');
}

export async function cleanupFixtures(config, { apply = false, directory, resetBaseline = true, api: suppliedApi, fixtureLedger } = {}) {
  assert.equal(config.baseUrl, 'https://staging.hotung9108.me', 'Cleanup is staging-only');
  const api = suppliedApi || new StagingApi(config);
  assert.equal(api.base, 'https://api-staging.hotung9108.me/api/v1');
  await api.login('admin'); await api.login('teacher'); await api.login('student');
  const protectedIds = new Set(Object.values(api.sessions).map(session => session.user.id));
  const owners = new Map([[api.sessions.teacher.user.id, 'teacher']]);
  config.users.outsider = { email: process.env.QA29_OUTSIDER_EMAIL, password: process.env.QA29_OUTSIDER_PASSWORD };
  if (config.users.outsider.email && config.users.outsider.password) {
    await api.login('outsider'); protectedIds.add(api.sessions.outsider.user.id);
    assert.notEqual(api.sessions.outsider.user.id, api.sessions.teacher.user.id);
    owners.set(api.sessions.outsider.user.id, 'outsider');
  }
  const ledgerPath = path.join(root, 'fixtures/staging.json');
  let ledger = fixtureLedger;
  if (ledger === undefined) {
    try { ledger = JSON.parse(await fs.readFile(ledgerPath, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  if (ledger) {
    assert.equal(ledger.teacherId, api.sessions.teacher.user.id);
    assert.equal(ledger.studentId, api.sessions.student.user.id);
  }
  const plan = { startedAt: new Date().toISOString(), mode: apply ? 'APPLY' : 'DRY_RUN', protectedUserIds: [...protectedIds], assignments: [], classes: [], users: [], retained: [], skipped: [], actions: [], failures: [] };
  const classes = await listAll(api, 'admin', '/classes');
  for (const item of classes.filter(cls => isQaClass(cls.name))) {
    const detail = await api.get('admin', `/classes/${item.id}`);
    const owner = detail.teacherId ?? detail.teacher?.id;
    if (!owners.has(owner)) { plan.skipped.push({ type: 'class', id: item.id, reason: 'Owner is not a configured QA teacher' }); continue; }
    const role = owners.get(owner);
    const assignments = await listAll(api, role, `/classes/${item.id}/assignments`);
    const foreign = assignments.filter(assignment => !isQaAssignment(assignment.title));
    for (const assignment of assignments.filter(assignment => isQaAssignment(assignment.title))) {
      plan.assignments.push({ id: assignment.id, title: assignment.title, classId: item.id, role });
    }
    plan.classes.push({ id: item.id, name: item.name, owner, role, hasUnownedAssignments: foreign.length > 0 });
  }
  const users = await listAll(api, 'admin', '/admin/users?q=qa29-&role=TEACHER');
  plan.users = users.filter(user => isQaProfile(user) && !protectedIds.has(user.id)).map(user => ({ id: user.id, email: user.email, fullName: user.fullName }));
  const output = directory || path.join(root, 'reports', `cleanup-${plan.startedAt.replace(/[:.]/g, '-')}`);
  await fs.mkdir(output, { recursive: true });
  const save = () => fs.writeFile(path.join(output, 'cleanup.json'), JSON.stringify(plan, null, 2));
  await save();
  console.log(`QA29 cleanup ${plan.mode}: ${plan.assignments.length} assignments, ${plan.users.length} temporary profiles; ${plan.classes.length} QA class containers. Plan: ${output}`);
  if (!apply) return { ...plan, directory: output };
  // Validate the whole inventory before the first DELETE. No title-only/global deletes.
  for (const assignment of plan.assignments) {
    const current = await api.get(assignment.role, `/assignments/${assignment.id}`);
    assert.equal(current.title, assignment.title, 'Assignment changed since cleanup plan');
  }
  for (const assignment of plan.assignments) {
    try {
      await api.request(assignment.role, 'DELETE', `/assignments/${assignment.id}`);
      plan.actions.push({ type: 'assignment', id: assignment.id, result: 'SOFT_DELETED' });
    } catch (error) {
      if (error.status === 404) plan.actions.push({ type: 'assignment', id: assignment.id, result: 'ALREADY_ABSENT' });
      else plan.failures.push({ type: 'assignment', id: assignment.id, reason: error.message });
    }
    await save();
  }
  for (const user of plan.users) {
    try {
      // Re-read exact identity and protect all configured/seed accounts.
      const matches = await listAll(api, 'admin', `/admin/users?q=${encodeURIComponent(user.email)}&role=TEACHER`);
      assert.ok(matches.some(current => current.id === user.id && isQaProfile(current)) && !protectedIds.has(user.id));
      await api.request('admin', 'DELETE', `/admin/users/${user.id}`);
      plan.actions.push({ type: 'user', id: user.id, result: 'DELETED' });
    } catch (error) { plan.failures.push({ type: 'user', id: user.id, reason: error.message }); }
    await save();
  }
  // Keep/reuse one main and one outside class. Assignment DELETE is soft-delete;
  // classes can remain referenced in DB and must never be force-purged with SQL.
  const outside = plan.classes.find(cls => cls.role === 'outsider' && !cls.hasUnownedAssignments);
  for (const cls of plan.classes) {
    if (cls.id === ledger?.classId || cls.id === outside?.id || cls.hasUnownedAssignments) {
      plan.retained.push({ type: 'class', id: cls.id, reason: 'Reusable container or contains non-QA assignments' });
      continue;
    }
    try {
      await api.request('admin', 'DELETE', `/classes/${cls.id}`);
      plan.actions.push({ type: 'class', id: cls.id, result: 'DELETED' });
    } catch (error) {
      if (error.status === 409) plan.retained.push({ type: 'class', id: cls.id, reason: 'API refuses deletion because related records remain' });
      else plan.failures.push({ type: 'class', id: cls.id, reason: error.message });
    }
    await save();
  }
  await fs.mkdir(path.join(root, 'fixtures'), { recursive: true });
  if (outside) await fs.writeFile(path.join(root, 'fixtures/cleanup-state.json'), JSON.stringify({ foreignClassId: outside.id, name: outside.name, teacherId: outside.owner }, null, 2));
  if (!plan.failures.length && resetBaseline && ledger) {
    await fs.copyFile(ledgerPath, path.join(output, 'previous-staging.json'));
    const exists = plan.classes.some(cls => cls.id === ledger.classId);
    if (!exists) { delete ledger.classId; delete ledger.memberId; }
    for (const key of ['assignmentId', 'moduleId', 'submissionId', 'submissionModuleId', 'gradingId', 'verifiedAt']) delete ledger[key];
    ledger.assignmentTitle = `QA29-Writing-Grading-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    await fs.writeFile(ledgerPath, JSON.stringify(ledger, null, 2));
  }
  // Verify active assignment lists are clean, not just HTTP DELETE responses.
  for (const cls of plan.classes) {
    try {
      const remaining = await listAll(api, cls.role, `/classes/${cls.id}/assignments`);
      const ids = remaining.filter(item => isQaAssignment(item.title)).map(item => item.id);
      if (ids.length) plan.failures.push({ type: 'verification', classId: cls.id, remainingAssignmentIds: ids });
    } catch (error) { if (error.status !== 404) plan.failures.push({ type: 'verification', classId: cls.id, reason: error.message }); }
  }
  plan.finishedAt = new Date().toISOString();
  plan.status = plan.failures.length ? 'INCOMPLETE' : 'COMPLETED';
  await save();
  if (plan.failures.length) throw new Error(`QA29 cleanup incomplete; no new fixture setup should run. Read ${output}/cleanup.json`);
  return { ...plan, directory: output };
}
