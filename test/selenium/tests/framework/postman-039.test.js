import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const collection = JSON.parse(await fs.readFile(new URL('../../postman/QA29-039/QA29-039.postman_collection.json', import.meta.url)));
const [pre, post] = collection.item[0].event.map(event => event.script.exec.join('\n'));
async function run(status, ownerStatus = 200) {
  const vars = new Map(), results = [], calls = [];
  let skipped = false;
  const env = { apiBaseUrl: 'https://api-staging.hotung9108.me/api/v1', foreignClassId: '126', expectedOwnerId: '5', teacherAEmail: 'a@example.invalid', teacherAPassword: 'fake', teacherBEmail: 'b@example.invalid', teacherBPassword: 'fake' };
  const expect = value => ({ to: { eql: expected => assert.deepEqual(value, expected), be: { oneOf: expected => assert.ok(expected.includes(value)) } } });
  const pm = {
    environment: { get: key => env[key] },
    variables: { get: key => vars.get(key), set: (key, value) => vars.set(key, value), unset: key => vars.delete(key) },
    test: (name, fn) => { try { fn(); results.push({ name, pass: true }); } catch { results.push({ name, pass: false }); } },
    expect, execution: { skipRequest: () => { skipped = true; } },
    sendRequest: (request, cb) => {
      calls.push(request);
      const login = request.url.endsWith('/auth/login');
      const isA = login && JSON.parse(request.body.raw).email === env.teacherAEmail;
      const json = login ? { user: { id: isA ? 4 : 5 }, accessToken: isA ? 'token-A' : 'token-B' } : { id: 126, teacherId: 5 };
      cb(null, { code: login ? 200 : ownerStatus, json: () => json });
    },
    response: { code: status },
  };
  await vm.runInNewContext(`(async () => { ${pre} })()`, { pm });
  if (!skipped) {
    assert.equal(vars.get('qa039Token'), 'token-A');
    assert.equal(calls[2].header.Authorization, 'Bearer token-B');
    vm.runInNewContext(post, { pm });
    assert.equal(vars.has('qa039Token'), false);
  }
  return { results, skipped };
}
for (const status of [403, 404]) test(`Postman 039 accepts denied HTTP ${status} after ownership check`, async () => {
  const { results, skipped } = await run(status);
  assert.equal(skipped, false);
  assert.ok(results.every(item => item.pass));
});
test('Postman 039 fails HTTP 200 instead of hiding access regression', async () => {
  const { results } = await run(200);
  assert.equal(results.at(-1).pass, false);
});
test('Postman 039 skips main request if fixture owner cannot read the class', async () => {
  const { results, skipped } = await run(404, 404);
  assert.equal(skipped, true);
  assert.equal(results[0].pass, false);
});
