import assert from 'node:assert/strict';
import test from 'node:test';
import { MockHttpClient } from './helpers/mock-http-client';
import { GradingChangeLogService } from '../services/grading-change-log.service';

async function assertEndpointCall(
  action: (service: GradingChangeLogService) => Promise<unknown>,
  expectedCall: MockHttpClient['calls'][number]
): Promise<void> {
  const http = new MockHttpClient();
  const service = new GradingChangeLogService(http);

  await action(service);
  assert.deepStrictEqual(http.calls, [expectedCall]);
}

test('GradingChangeLogService #57 - GET grading change logs', async () => {
  const options = { signal: new AbortController().signal };
  await assertEndpointCall(service => service.getChangeLogs(5, options), {
    method: 'GET',
    url: '/gradings/5/change-logs',
    options,
  });
});
