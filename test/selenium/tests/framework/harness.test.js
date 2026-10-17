import test from 'node:test';
import assert from 'node:assert/strict';
import { StagingApi } from '../../support/teacher/expanded-api.js';
import { sanitize } from '../../utils/reporter.js';
import { classifyFailure } from '../../support/teacher/classification.js';

test('API helper retries a rejected authenticated request once with a new session', async () => {
  const api = new StagingApi({ users: { teacher: { email: 'qa@example.invalid', password: 'synthetic-password' } } });
  api.sessions.teacher = { accessToken: 'old-test-token' };
  const calls = [];
  api.send = async (_role, _method, endpoint) => {
    calls.push([endpoint, api.sessions.teacher.accessToken]);
    if (endpoint === '/auth/login') return { accessToken: 'new-test-token', user: { id: 4 } };
    if (api.sessions.teacher.accessToken === 'old-test-token') { const error = new Error('HTTP 401'); error.status = 401; throw error; }
    return { finalScore: 7 };
  };
  assert.equal((await api.get('teacher', '/gradings/1')).finalScore, 7);
  assert.deepEqual(calls, [['/gradings/1', 'old-test-token'], ['/auth/login', 'old-test-token'], ['/gradings/1', 'new-test-token']]);
});

test('API helper renews expiring session before the call; a 403 is not retried', async () => {
  const api = new StagingApi({ users: { teacher: { email: 'qa@example.invalid', password: 'synthetic-password' } } });
  api.sessions.teacher = { accessToken: `header.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 10 })).toString('base64url')}.signature` };
  const calls = [];
  api.send = async (_role, _method, endpoint) => {
    calls.push(endpoint);
    if (endpoint === '/auth/login') return { accessToken: 'renewed-test-token', user: { id: 4 } };
    const error = new Error('HTTP 403'); error.status = 403; throw error;
  };
  await assert.rejects(api.get('teacher', '/ai-suggestion'), error => error.status === 403);
  assert.deepEqual(calls, ['/auth/login', '/ai-suggestion']);
});

test('Assertion error redaction removes JWT, bearer credentials and ANSI colors', () => {
  const fakeJwt = 'eyJhbGciOiJub25lIn0.eyJzdWIiOiJxYSJ9.synthetic_signature';
  const redacted = sanitize(`\x1b[32mactual\x1b[39m ${fakeJwt} Bearer opaque-test-token`);
  assert.ok(!redacted.includes(fakeJwt));
  assert.ok(!redacted.includes('opaque-test-token'));
  assert.ok(!redacted.includes('\x1b'));
});

test('Triage hints do not label generic failures as confirmed product bugs', () => {
  assert.equal(classifyFailure(new Error('locator timeout'), 'scenario'), 'NEEDS_REVIEW');
  assert.equal(classifyFailure({ message: 'HTTP 401', status: 401 }, 'scenario'), 'API_AUTH_REVIEW');
  assert.equal(classifyFailure({ message: 'UI feedback mismatch', code: 'QA29_PRODUCT_CANDIDATE' }, 'scenario'), 'PRODUCT_CANDIDATE');
});
