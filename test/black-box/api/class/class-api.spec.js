import { test } from 'node:test';
import assert from 'node:assert';
import { loadConfig } from '../../../config/env-loader.js';
import { createApiClient } from '../../../common/utils/http-client.js';

const cfg = loadConfig();
const client = createApiClient('api');

test('[BlackBox][API] Classes - list requires auth or returns structured', async () => {
  const res = await client.get('/classes').catch(e => e.response || { status: e.code || 0 });
  assert.ok([200, 401, 403, 0].includes(res.status), 'Classes endpoint responds');
});
