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
