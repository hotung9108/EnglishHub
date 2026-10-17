import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { root, loadConfig, loadLocalEnv } from '../config/env.js';

loadLocalEnv();
const config = loadConfig();
const fixture = JSON.parse(await fs.readFile(path.join(root, 'fixtures/cleanup-state.json'), 'utf8'));
const output = path.join(root, 'postman/QA29-039');
await fs.mkdir(output, { recursive: true });
const pre = `
pm.variables.unset('qa039Token');
pm.variables.unset('qa039Ready');
const base = 'https://api-staging.hotung9108.me/api/v1';
async function send(request) {
  return new Promise((resolve, reject) => pm.sendRequest(request, (err, res) => err ? reject(new Error('Setup network error')) : resolve(res)));
}
async function login(prefix) {
  const email = pm.environment.get(prefix + 'Email');
  const password = pm.environment.get(prefix + 'Password');
  if (!email || !password) throw new Error('Missing credentials for ' + prefix);
  const res = await send({ url: base + '/auth/login', method: 'POST', header: { 'Content-Type': 'application/json' }, body: { mode: 'raw', raw: JSON.stringify({ email, password }) } });
  if (res.code !== 200) throw new Error(prefix + ' login HTTP ' + res.code);
  const data = res.json();
  if (!data.accessToken || !data.user?.id) throw new Error(prefix + ' login missing identity/token');
  return data;
}
try {
  if (pm.environment.get('apiBaseUrl') !== base) throw new Error('Staging environment required');
  const classId = String(pm.environment.get('foreignClassId'));
  if (!/^\\d+$/.test(classId)) throw new Error('Invalid foreignClassId');
  const a = await login('teacherA');
  const b = await login('teacherB');
  if (a.user.id === b.user.id) throw new Error('A and B must be different teachers');
  if (String(b.user.id) !== String(pm.environment.get('expectedOwnerId'))) throw new Error('Unexpected teacher B identity');
  const own = await send({ url: base + '/classes/' + classId, method: 'GET', header: { Authorization: 'Bearer ' + b.accessToken } });
  if (own.code !== 200) throw new Error('Owner cannot read fixture: HTTP ' + own.code + '; class must exist before access test');
  const detail = own.json();
  const ownerId = detail.teacherId ?? detail.teacher?.id;
  if (String(detail.id) !== classId || ownerId !== b.user.id || ownerId === a.user.id) throw new Error('Class ownership mismatch');
  pm.test('SETUP: class exists, belongs to B, requester A is different', () => pm.expect(ownerId).to.eql(b.user.id));
  pm.variables.set('qa039Token', a.accessToken);
  pm.variables.set('qa039Ready', 'yes');
  pm.variables.set('qa039RequesterId', a.user.id);
} catch (error) {
  pm.test('SETUP FAILED — QA29-039 not executed', () => { throw error; });
  pm.execution.skipRequest();
}
`;
const post = `
pm.test('QA29-039: teacher A cannot read class owned by B (403/404)', () => {
  pm.expect(pm.variables.get('qa039Ready')).to.eql('yes');
  pm.expect(pm.response.code, '200 means API allowed access; review API contract/deployed build').to.be.oneOf([403, 404]);
});
pm.variables.unset('qa039Token');
pm.variables.unset('qa039Ready');
`;
const collection = {
  info: { _postman_id: crypto.randomUUID(), name: 'QA29-039 — Staging — Teacher class access', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json', description: 'One case. Send directly or Run once. Pre-request logs in A/B and verifies existing class ownership with B token. Main request uses A token. No resource creation/deletion. Setup failure is not a product failure. API-only; no UI verdict.' },
  item: [{ name: 'QA29-039 — A must not read B class', event: [
    { listen: 'prerequest', script: { type: 'text/javascript', exec: pre.trim().split('\n') } },
    { listen: 'test', script: { type: 'text/javascript', exec: post.trim().split('\n') } },
  ], request: { method: 'GET', auth: { type: 'noauth' }, header: [{ key: 'Authorization', value: 'Bearer {{qa039Token}}' }], url: '{{apiBaseUrl}}/classes/{{foreignClassId}}' } }],
};
const inputs = {
  apiBaseUrl: 'https://api-staging.hotung9108.me/api/v1',
  foreignClassId: String(fixture.foreignClassId), expectedOwnerId: String(fixture.teacherId),
  teacherAEmail: config.users.teacher.email, teacherAPassword: config.users.teacher.password,
  teacherBEmail: process.env.QA29_OUTSIDER_EMAIL, teacherBPassword: process.env.QA29_OUTSIDER_PASSWORD,
};
if (Object.values(inputs).some(value => !value)) throw new Error('Missing local fixture/credentials');
const environment = { id: crypto.randomUUID(), name: 'QA29-039 — STAGING LOCAL', values: Object.entries(inputs).map(([key, value]) => ({ key, value, enabled: true, type: key.endsWith('Password') ? 'secret' : 'default' })), _postman_variable_scope: 'environment' };
await fs.writeFile(path.join(output, 'QA29-039.postman_collection.json'), JSON.stringify(collection, null, 2));
await fs.writeFile(path.join(output, 'QA29-039.local.postman_environment.json'), JSON.stringify(environment, null, 2));
await fs.writeFile(path.join(output, '.gitignore'), '*.local.postman_environment.json\n');
console.log('Generated QA29-039 collection + local environment. Credentials omitted from console.');
