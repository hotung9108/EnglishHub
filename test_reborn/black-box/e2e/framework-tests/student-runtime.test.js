import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { root } from '../config/env.js';
import { prepareStudentRuntime, checkRuntimeDirectory, probeStudentBrowser } from '../student/support/runtime.js';
import { studentFailure } from '../student/support/failure-policy.js';
import { writeSuiteReport } from '../common/support/suite-reporter.js';

async function ownDirectory(t) {
  const base = path.resolve(root, '.cache/stu-runtime-tests');
  await fs.mkdir(base, { recursive: true });
  const directory = await fs.mkdtemp(path.join(base, 'test-'));
  t.after(async () => {
    assert.equal(path.dirname(path.resolve(directory)), base);
    await fs.rm(directory, { recursive: true, force: true });
  });
  return directory;
}

test('Chrome prefs startup failure blocks execution and stops the suite, never a product failure', () => {
  const actual = studentFailure(new Error('session not created: failed to write prefs file'), 'driver');
  assert.deepEqual(actual, { status: 'BLOCKED', classification: 'ENVIRONMENT_REVIEW', stopSuite: true });
  assert.deepEqual(studentFailure(Object.assign(new Error('disk full'), { code: 'ENOSPC' }), 'scenario'), actual);
  assert.deepEqual(studentFailure(new Error('invalid session id'), 'scenario'), actual);
});

test('Product assertions and fixture prerequisites keep their own verdicts', () => {
  assert.deepEqual(studentFailure({ code: 'ERR_ASSERTION' }, 'scenario'), { status: 'FAILED', classification: 'PRODUCT_CANDIDATE', stopSuite: false });
  assert.deepEqual(studentFailure({ code: 'QA30_PREREQUISITE' }, 'scenario'), { status: 'BLOCKED', classification: 'FIXTURE_REVIEW', stopSuite: false });
  assert.equal(studentFailure(new Error('stopped'), 'driver', true).status, 'ABORTED');
});

test('Preflight rejects zero free space before trying to write or start a browser', async () => {
  await assert.rejects(checkRuntimeDirectory('D:/synthetic', {
    statfs: async () => ({ bavail: 0, bsize: 4096 }),
    open: async () => assert.fail('must not write when space is exhausted'),
  }), e => (e.code === 'QA30_ENVIRONMENT' || e.code === 'STU_ENVIRONMENT') && e.message.includes('512 MiB'));
});

test('Preflight detects a failed real write and removes its own partial probe', async () => {
  const actions = [];
  await assert.rejects(checkRuntimeDirectory('D:/synthetic', {
    statfs: async () => ({ bavail: 1024 ** 3, bsize: 1 }),
    open: async () => ({ writeFile: async () => { throw Object.assign(new Error('full'), { code: 'ENOSPC' }); }, close: async () => actions.push('close') }),
    unlink: async () => actions.push('unlink'),
  }), e => (e.code === 'QA30_ENVIRONMENT' || e.code === 'STU_ENVIRONMENT') && e.message.includes('ENOSPC'));
  assert.deepEqual(actions, ['close', 'unlink']);
});

test('Workspace runtime reaches child processes, restores environment and cleans only its own directory', async t => {
  const directory = await ownDirectory(t);
  const keep = path.join(directory, 'keep.txt'); await fs.writeFile(keep, 'untouched');
  const env = { TEMP: 'C:/original-temp', TMP: 'C:/original-tmp' };
  const runtime = await prepareStudentRuntime(directory, env);
  assert.ok(runtime.directory.startsWith(path.join(directory, '.cache', 'qa30-runtime')) || runtime.directory.startsWith(path.join(directory, '.cache', 'stu-runtime')));
  assert.equal(env.TEMP, runtime.directory); assert.equal(env.TMP, runtime.directory);
  const child = execFileSync(process.execPath, ['--input-type=module', '-e', "import os from 'node:os'; process.stdout.write(os.tmpdir());"], { env: { ...process.env, ...env }, encoding: 'utf8', windowsHide: true });
  assert.equal(path.resolve(child), path.resolve(runtime.directory));
});
