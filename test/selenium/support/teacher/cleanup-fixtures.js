import { loadConfig, loadLocalEnv } from '../../config/env.js';
import { cleanupFixtures } from './cleanup.js';
import { acquireRunLock } from './run-lock.js';
import { sanitize } from '../../utils/reporter.js';

loadLocalEnv();
const config = loadConfig();
let release;
try {
  if (process.argv.slice(2).some(arg => arg !== '--apply')) throw new Error('Usage: cleanup-fixtures.js [--apply] (default is inventory only)');
  release = await acquireRunLock();
  const result = await cleanupFixtures(config, { apply: process.argv.includes('--apply') });
  console.log(JSON.stringify({ status: result.status || 'PLAN_ONLY', actions: result.actions.length, retained: result.retained, failures: result.failures, directory: result.directory }));
} catch (error) { console.error(sanitize(error.message, config.users)); process.exitCode = 1; }
finally { if (release) await release(); }
