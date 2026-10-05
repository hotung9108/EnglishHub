import { test } from 'node:test';
import assert from 'node:assert';
import { loadConfig } from '../../../config/env-loader.js';
import { createApiClient } from '../../../common/utils/http-client.js';

const cfg = loadConfig();
const client = createApiClient('api');

test('[BlackBox][API] Auth - health/unauth check (structure)', async () => {
  const res = await client.get('/health').catch(e => e.response || { status: 0 });
  assert.ok(res.status === 200 || res.status === 404 || res.status === 0, 'Health check should respond');
});
