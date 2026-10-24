import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { root } from '../../config/env.js';

const lockPath = path.join(root, '.cache/qa29-run.lock');
const alive = pid => { try { process.kill(pid, 0); return true; } catch (error) { return error.code !== 'ESRCH'; } };
export async function acquireRunLock() {
  await fs.mkdir(path.dirname(lockPath), { recursive: true });
  const parentPid = Number(process.env.QA29_PARENT_LOCK_PID);
  if (parentPid) {
    const lock = JSON.parse(await fs.readFile(lockPath, 'utf8'));
    if (lock.pid !== parentPid || !alive(parentPid)) throw new Error('Invalid inherited QA29 lock');
    return async () => {};
  }
  // Includes old runner versions that did not create a lock file.
  if (process.platform === 'win32') {
    const command = `$ErrorActionPreference='Stop'; Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.ProcessId -ne ${process.pid} -and $_.CommandLine -match '(run-teacher|prepare-fixtures|cleanup-fixtures)\\.js' } | ForEach-Object { $_.ProcessId }`;
    const { stdout } = await promisify(execFile)('powershell.exe', ['-NoProfile', '-Command', command], { windowsHide: true });
    if (stdout.trim()) throw new Error('Một lượt QA29 khác đang chạy. Dừng lượt đó trước khi dọn hoặc retest.');
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const handle = await fs.open(lockPath, 'wx');
      await handle.writeFile(JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
      await handle.close();
      return async () => {
        const current = JSON.parse(await fs.readFile(lockPath, 'utf8'));
        if (current.pid === process.pid) await fs.unlink(lockPath);
      };
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const current = JSON.parse(await fs.readFile(lockPath, 'utf8'));
      if (alive(current.pid)) throw new Error('QA29 đang chạy; không được dọn dữ liệu của lượt đang hoạt động.');
      await fs.unlink(lockPath); // Only the verified stale lock, never any report/data directory.
    }
  }
  throw new Error('Cannot acquire QA29 run lock');
}
