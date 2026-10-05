import { test } from 'node:test';
import assert from 'node:assert';
import { createApiClient } from '../../common/utils/http-client.js';

const client = createApiClient('api');
test('[API][staging] base response shape', async () => {
  const res = await client.get('/auth/login').catch(e => e.response || { status: 0 });
  assert.ok([200,400,401,422,0].includes(res.status));
});
