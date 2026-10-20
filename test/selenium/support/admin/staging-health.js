import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { environmentError } from './runtime.js';

const execute = promisify(execFile);
export async function probeHttpStatus(url) {
  const { stdout } = await execute(process.platform === 'win32' ? 'curl.exe' : 'curl', [
    '--silent', '--show-error', '--connect-timeout', '5', '--max-time', '12',
    '--output', process.platform === 'win32' ? 'NUL' : '/dev/null',
    '--write-out', '%{http_code}', url,
  ], { windowsHide: true, timeout: 15000, maxBuffer: 8192 });
  return Number(stdout.trim());
}

// Unauthenticated GET probes only. No credentials, fixture setup or retrying mutations.
export async function checkStagingAvailability(config, { request = probeHttpStatus } = {}) {
  if (config.baseUrl !== 'https://staging.hotung9108.me') throw environmentError('QA31 availability checks are staging-only');
  const endpoints = [
    { name: 'frontend', url: `${config.baseUrl}/`, accepted: [200] },
    { name: 'api', url: 'https://api-staging.hotung9108.me/api/v1/classes?limit=1', accepted: [200, 401, 403] },
  ];
  const checks = await Promise.all(endpoints.map(async endpoint => {
    const start = Date.now();
    try {
      const status = await request(endpoint.url);
      return { name: endpoint.name, url: endpoint.url, status, ready: endpoint.accepted.includes(status), elapsedMs: Date.now() - start };
    } catch (error) {
      return { name: endpoint.name, url: endpoint.url, ready: false, transportError: String(error.code || error.name), elapsedMs: Date.now() - start };
    }
  }));
  const failed = checks.filter(check => !check.ready);
  if (failed.length) {
    const reason = failed.map(check => `${check.name}: ${check.status ? `HTTP ${check.status}` : check.transportError || 'no response'}`).join('; ');
    throw Object.assign(environmentError(`Staging unavailable (${reason}). No test cases have run; check staging connectivity before retrying.`), { healthChecks: checks });
  }
  return checks;
}
