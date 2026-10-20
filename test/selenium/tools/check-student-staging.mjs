// Read-only connectivity check; no login, browser scenarios or fixture creation.
import { loadConfig, loadLocalEnv } from '../config/env.js';
import { checkStagingAvailability } from '../support/student/staging-health.js';
loadLocalEnv();
try {
  console.log(JSON.stringify({status:'READY',checks:await checkStagingAvailability(loadConfig())}, null, 2));
} catch (error) {
  console.log(JSON.stringify({status:'BLOCKED',reason:error.message,checks:error.healthChecks}, null, 2));
  process.exitCode = 2;
}
