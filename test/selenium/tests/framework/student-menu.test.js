import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('Windows PowerShell menu resolves the real registry and keeps normal preparation', { skip: process.platform !== 'win32' }, () => {
  const script = fileURLToPath(new URL('../../tools/Test-Student-Menu.ps1', import.meta.url));
  const output = execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script], { encoding: 'utf8', windowsHide: true, timeout: 15000 });
  assert.match(output, /Student menu OK: 45 rows/);
});
