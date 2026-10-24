import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../../config/env.js';
import { sanitize } from '../../utils/reporter.js';

test('defaults point to user-provided frontend and headless Chrome', () => {
  const cfg = loadConfig({});
  assert.equal(cfg.baseUrl, 'https://staging.hotung9108.me');
  assert.equal(cfg.headless, true);
});
test('reject malformed URLs, timeouts and browser settings', () => {
  for (const env of [
    { SELENIUM_BASE_URL: 'file:///etc/passwd' }, { SELENIUM_BASE_URL: 'https://user:pass@example.com' },
    { SELENIUM_BASE_URL: 'https://example.com/login' }, { SELENIUM_TIMEOUT_MS: 'NaN' },
    { SELENIUM_TIMEOUT_MS: '0' }, { SELENIUM_BROWSER: 'unknown' }, { SELENIUM_HEADLESS: 'no' },
  ]) assert.throws(() => loadConfig(env));
});
test('report redacts configured credentials', () => {
  assert.equal(sanitize('mail@example.com passwordSecret', { admin: { email: 'mail@example.com', password: 'passwordSecret' } }), '[REDACTED] [REDACTED]');
});

test('QA28 local settings remain usable while SELENIUM settings take precedence', () => {
  const env = {
    QA28_BASE_URL: 'https://legacy.example.invalid', QA28_HEADLESS: 'false',
    QA28_TEACHER_EMAIL: 'legacy@example.invalid', QA28_TEACHER_PASSWORD: 'synthetic-legacy',
    SELENIUM_BASE_URL: 'https://canonical.example.invalid',
    SELENIUM_TEACHER_PASSWORD: 'synthetic-canonical',
  };
  const config = loadConfig(env);
  assert.equal(config.baseUrl, 'https://canonical.example.invalid');
  assert.equal(config.headless, false);
  assert.deepEqual(config.users.teacher, { email: 'legacy@example.invalid', password: 'synthetic-canonical' });
  assert.equal(env.SELENIUM_TEACHER_EMAIL, undefined, 'Loading config must not mutate the input environment');
});
