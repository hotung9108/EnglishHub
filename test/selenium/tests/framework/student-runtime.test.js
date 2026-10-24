import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { root } from '../../config/env.js';
import { prepareStudentRuntime, checkRuntimeDirectory, probeStudentBrowser } from '../../support/student/runtime.js';
import { studentFailure } from '../../support/student/failure-policy.js';
import { writeSuiteReport } from '../../utils/suite-reporter.js';

async function ownDirectory(t) {
  const base = path.resolve(root, '.cache/qa30-runtime-tests');
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
  assert.deepEqual(actual, {status:'BLOCKED',classification:'ENVIRONMENT_REVIEW',stopSuite:true});
  assert.deepEqual(studentFailure(Object.assign(new Error('disk full'), {code:'ENOSPC'}), 'scenario'), actual);
  assert.deepEqual(studentFailure(new Error('invalid session id'), 'scenario'), actual);
});

test('Product assertions and fixture prerequisites keep their own verdicts', () => {
  assert.deepEqual(studentFailure({code:'ERR_ASSERTION'}, 'scenario'), {status:'FAILED',classification:'PRODUCT_CANDIDATE',stopSuite:false});
  assert.deepEqual(studentFailure({code:'QA30_PREREQUISITE'}, 'scenario'), {status:'BLOCKED',classification:'FIXTURE_REVIEW',stopSuite:false});
  assert.equal(studentFailure(new Error('stopped'), 'driver', true).status, 'ABORTED');
});

test('Preflight rejects zero free space before trying to write or start a browser', async () => {
  await assert.rejects(checkRuntimeDirectory('D:/synthetic', {
    statfs:async () => ({bavail:0,bsize:4096}),
    open:async () => assert.fail('must not write when space is exhausted'),
  }), e => e.code === 'QA30_ENVIRONMENT' && e.message.includes('512 MiB'));
});

test('Preflight detects a failed real write and removes its own partial probe', async () => {
  const actions = [];
  await assert.rejects(checkRuntimeDirectory('D:/synthetic', {
    statfs:async () => ({bavail:1024**3,bsize:1}),
    open:async () => ({writeFile:async () => {throw Object.assign(new Error('full'),{code:'ENOSPC'});},close:async () => actions.push('close')}),
    unlink:async () => actions.push('unlink'),
  }), e => e.code === 'QA30_ENVIRONMENT' && e.message.includes('ENOSPC'));
  assert.deepEqual(actions, ['close','unlink']);
});

test('Workspace runtime reaches child processes, restores environment and cleans only its own directory', async t => {
  const directory = await ownDirectory(t);
  const keep = path.join(directory, 'keep.txt'); await fs.writeFile(keep, 'untouched');
  const env = {TEMP:'C:/original-temp',TMP:'C:/original-tmp'};
  const runtime = await prepareStudentRuntime(directory, env);
  assert.ok(runtime.directory.startsWith(path.join(directory, '.cache', 'qa30-runtime')));
  assert.equal(env.TEMP, runtime.directory); assert.equal(env.TMP, runtime.directory);
  const child = execFileSync(process.execPath, ['--input-type=module','-e', "import os from 'node:os'; process.stdout.write(os.tmpdir());"], {env:{...process.env,...env},encoding:'utf8',windowsHide:true});
  assert.equal(path.resolve(child), path.resolve(runtime.directory));
  await runtime.cleanup();
  assert.deepEqual(env, {TEMP:'C:/original-temp',TMP:'C:/original-tmp'});
  assert.equal(await fs.readFile(keep,'utf8'), 'untouched');
  await assert.rejects(fs.stat(runtime.directory), {code:'ENOENT'});
});

test('Browser preflight reports startup/cleanup errors and closes a successful probe', async () => {
  let closed = false;
  const config = {headless:false,captureNetwork:true};
  assert.deepEqual(await probeStudentBrowser(config, async received => {
    assert.equal(received.headless,true); assert.equal(received.captureNetwork,false);
    return {getCapabilities:async () => new Map([['browserVersion','synthetic']]),quit:async () => {closed=true;}};
  }), {browserVersion:'synthetic'});
  assert.equal(closed,true); assert.equal(config.headless,false);
  await assert.rejects(probeStudentBrowser(config, async () => {throw new Error('failed to write prefs file');}), e => e.code === 'QA30_ENVIRONMENT');
  await assert.rejects(probeStudentBrowser(config, async () => ({getCapabilities:async () => new Map(),quit:async () => {throw new Error('cannot close');}})), /cleanup failed/);
});

test('Interrupted execution report preserves product failures and marks the rest not run', async t => {
  const directory = await ownDirectory(t);
  await writeSuiteReport(directory, {status:'BLOCKED',selectedCases:['QA30-007','QA30-013','QA30-014'],cases:[
    {id:'QA30-007',status:'FAILED',classification:'PRODUCT_CANDIDATE'},
    {id:'QA30-013',status:'BLOCKED',phase:'driver',classification:'ENVIRONMENT_REVIEW'},
  ]});
  const report = JSON.parse(await fs.readFile(path.join(directory,'summary.json')));
  assert.equal(report.counts.FAILED,1); assert.equal(report.counts.BLOCKED,1);
  assert.deepEqual(report.notRun,['QA30-014']);
  assert.match(await fs.readFile(path.join(directory,'junit.xml'),'utf8'), /tests="3" failures="1" skipped="2"/);
});
