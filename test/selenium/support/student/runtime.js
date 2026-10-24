import fs from 'node:fs/promises';
import path from 'node:path';
import { createDriver } from '../../utils/browser-factory.js';

const minimumFreeBytes = 512 * 1024 * 1024;
const tempKeys = ['TEMP', 'TMP', 'TMPDIR'];
export const environmentError = message => Object.assign(new Error(message), { code: 'QA30_ENVIRONMENT' });

export async function checkRuntimeDirectory(directory, io = fs) {
  try {
    const space = await io.statfs(directory);
    const freeBytes = space.bavail * space.bsize;
    if (freeBytes < minimumFreeBytes) throw environmentError(`QA30 runtime has only ${Math.floor(freeBytes / 1024 / 1024)} MiB free; requires at least 512 MiB: ${directory}`);
    const probe = path.join(directory, '.write-check');
    let handle;
    try { handle = await io.open(probe, 'wx'); await handle.writeFile(Buffer.alloc(4096)); }
    finally {
      if (handle) { try { await handle.close(); } finally { await io.unlink(probe); } }
    }
    return { freeBytes, minimumFreeBytes };
  } catch (error) {
    if (error.code === 'QA30_ENVIRONMENT') throw error;
    throw environmentError(`QA30 cannot write runtime files (${error.code || error.name}): ${directory}`);
  }
}

// Environment changes affect only this Node process and its children, not Windows settings.
export async function prepareStudentRuntime(root, env = process.env) {
  const base = path.resolve(root, '.cache/qa30-runtime');
  let directory;
  try {
    await fs.mkdir(base, { recursive: true });
    directory = await fs.mkdtemp(path.join(base, 'run-'));
  } catch (error) { throw environmentError(`QA30 cannot create workspace runtime (${error.code || error.name}): ${base}`); }
  const previous = Object.fromEntries(tempKeys.map(key => [key, env[key]]));
  let activated = false;
  const cleanup = async () => {
    if (activated) for (const key of tempKeys) {
      if (previous[key] === undefined) delete env[key]; else env[key] = previous[key];
    }
    // Only remove the unique directory this invocation created, beneath its own base.
    const target = path.resolve(directory);
    if (path.dirname(target) !== base || !path.basename(target).startsWith('run-')) throw environmentError('Refusing to clean an unowned runtime directory');
    await fs.rm(target, { recursive: true, force: true });
  };
  try {
    const storage = await checkRuntimeDirectory(directory);
    for (const key of tempKeys) env[key] = directory;
    activated = true;
    return { directory, storage, cleanup };
  } catch (error) {
    await cleanup().catch(() => {});
    throw error;
  }
}

export async function probeStudentBrowser(config, makeDriver = createDriver) {
  let browser;
  try {
    browser = await makeDriver({ ...config, headless: true, captureNetwork: false });
    return { browserVersion: (await browser.getCapabilities()).get('browserVersion') };
  } catch (error) {
    throw environmentError(`QA30 browser preflight failed before fixture setup: ${error.message}`);
  } finally {
    if (browser) {
      try { await browser.quit(); }
      catch (error) { throw environmentError(`QA30 browser preflight cleanup failed: ${error.message}`); }
    }
  }
}
