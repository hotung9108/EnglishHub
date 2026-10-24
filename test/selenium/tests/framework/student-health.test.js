import test from 'node:test';
import assert from 'node:assert/strict';
import { checkStagingAvailability } from '../../support/student/staging-health.js';
import { studentFailure } from '../../support/student/failure-policy.js';

const config = {baseUrl:'https://staging.hotung9108.me'};
test('Read-only readiness accepts a live frontend and authenticated-only API without credentials', async () => {
  const urls = [];
  const checks = await checkStagingAvailability(config, {request:async url => {urls.push(url); return url.includes('api-staging') ? 401 : 200;}});
  assert.equal(checks.length,2); assert.ok(checks.every(c => c.ready));
  assert.deepEqual(urls,[`${config.baseUrl}/`,'https://api-staging.hotung9108.me/api/v1/classes?limit=1']);
});
test('Actual API 530 pattern blocks before fixture setup and preserves both health responses', async () => {
  await assert.rejects(checkStagingAvailability(config, {request:async url => url.includes('api-staging') ? 530 : 200}), error => {
    assert.equal(error.code,'QA30_ENVIRONMENT'); assert.match(error.message,/api: HTTP 530/);
    assert.equal(error.healthChecks[0].status,200); assert.equal(error.healthChecks[1].status,530);
    assert.equal(studentFailure(error,'setup').status,'BLOCKED'); return true;
  });
});
test('Network errors and later API outages stop execution; HTTP 400 remains a setup/product review', async () => {
  await assert.rejects(checkStagingAvailability(config, {request:async () => {throw Object.assign(new Error('private transport detail'),{code:'ETIMEDOUT'});}}), error => {
    assert.match(error.message,/ETIMEDOUT/); assert.doesNotMatch(error.message,/private transport detail/); return true;
  });
  assert.equal(studentFailure({status:530},'scenario').stopSuite,true);
  assert.equal(studentFailure({status:400},'scenario').stopSuite,false);
  assert.equal(studentFailure(new Error('Transport error 28: student GET /classes'),'setup').classification,'ENVIRONMENT_REVIEW');
});
test('Readiness cannot silently probe production as a QA30 environment', async () => {
  await assert.rejects(checkStagingAvailability({baseUrl:'https://production.example.invalid'},{request:async () => assert.fail('must not make this request')}), /staging-only/);
});
