import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { root } from '../../../../common/config/env.js';

const lockPath = path.join(root, '.cache/teacher-e2e.lock');
const alive = pid => { try { process.kill(pid, 0); return true; } catch (error) { return error.code !== 'ESRCH'; } };

export async function acquireRunLock() {
  await fs.mkdir(path.dirname(lockPath), { recursive: true });
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const handle = await fs.open(lockPath, 'wx');
      await handle.writeFile(JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
      await handle.close();
      return async () => {
        try {
          const current = JSON.parse(await fs.readFile(lockPath, 'utf8'));
          if (current.pid === process.pid) await fs.unlink(lockPath);
        } catch {}
      };
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      try {
        const current = JSON.parse(await fs.readFile(lockPath, 'utf8'));
        if (alive(current.pid)) throw new Error('Teacher runner is already executing. Close old process or remove .cache/teacher-e2e.lock');
        await fs.unlink(lockPath);
      } catch (e) {
        if (e.message.includes('already executing')) throw e;
        await fs.unlink(lockPath).catch(() => {});
      }
    }
  }
  throw new Error('Could not acquire Teacher run lock');
}
