import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));

export function loadConfig(env = process.env) {
  const defaultUrl = env.TEST_ENV === 'dev' ? 'http://localhost:5173' : 'https://staging.hotung9108.me';
  const base = new URL(env.SELENIUM_BASE_URL || defaultUrl);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) {
    throw new Error('SELENIUM_BASE_URL must be an HTTP(S) URL without credentials');
  }
  if (base.pathname !== '/' || base.search || base.hash) {
    throw new Error('SELENIUM_BASE_URL must contain only the frontend origin');
  }
  const browser = env.SELENIUM_BROWSER || 'chrome';
  if (!['chrome', 'edge'].includes(browser)) throw new Error('SELENIUM_BROWSER must be chrome or edge');
  const headless = env.SELENIUM_HEADLESS || 'true';
  if (!['true', 'false'].includes(headless)) throw new Error('SELENIUM_HEADLESS must be true or false');
  const timeout = Number(env.SELENIUM_TIMEOUT_MS || 30000);
  if (!Number.isInteger(timeout) || timeout < 1000 || timeout > 120000) {
    throw new Error('SELENIUM_TIMEOUT_MS must be an integer between 1000 and 120000');
  }
  return {
    baseUrl: base.origin, browser, headless: headless === 'true', timeout,
    binary: env.SELENIUM_BROWSER_BINARY, driverPath: env.SELENIUM_DRIVER_PATH,
    gridUrl: env.SELENIUM_GRID_URL,
    users: Object.fromEntries(['admin', 'teacher', 'student'].map(role => [role, {
      email: env[`SELENIUM_${role.toUpperCase()}_EMAIL`],
      password: env[`SELENIUM_${role.toUpperCase()}_PASSWORD`],
    }])),
  };
}

export function loadLocalEnv() {
  const filename = path.join(root, '.env');
  if (fs.existsSync(filename)) process.loadEnvFile(filename);
}
