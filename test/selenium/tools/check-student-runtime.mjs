// Local browser startup check only: no staging navigation, login or fixture creation.
import { root, loadConfig, loadLocalEnv } from '../config/env.js';
import { prepareStudentRuntime, probeStudentBrowser } from '../support/student/runtime.js';
let runtime;
try {
  loadLocalEnv();
  runtime = await prepareStudentRuntime(root);
  console.log(`Local browser temp: ${runtime.directory}`);
  const browser = await probeStudentBrowser(loadConfig());
  console.log(JSON.stringify({ status: 'READY', browserVersion: browser.browserVersion, freeMiB: Math.floor(runtime.storage.freeBytes / 1024 / 1024), stagingRequests: 0 }));
} catch (error) {
  console.error(`QA30 local preflight: ${error.message}`);
  process.exitCode = 2;
} finally {
  if (runtime) try { await runtime.cleanup(); }
  catch (error) { console.error(`Runtime cleanup: ${error.code || error.message}`); process.exitCode = 2; }
}
