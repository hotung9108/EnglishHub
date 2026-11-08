import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const root = path.resolve(__dirname, '..', '..');

export function loadLocalEnv() {
  const envFiles = [
    path.join(root, '.env'),
    path.join(__dirname, '.env'),
    path.resolve(root, '..', '.env')
  ];
  for (const f of envFiles) {
    if (fs.existsSync(f)) {
      if (typeof process.loadEnvFile === 'function') {
        try { process.loadEnvFile(f); } catch {}
      } else {
        try {
          const lines = fs.readFileSync(f, 'utf8').split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx > 0) {
              const k = trimmed.slice(0, eqIdx).trim();
              const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
              process.env[k] ??= v;
            }
          }
        } catch {}
      }
    }
  }
}

// Initial env load
loadLocalEnv();

export function resolveEnvName(rawEnv = process.env, argv = process.argv) {
  const cliEnv = argv.find(a => a.startsWith('--env='))?.slice(6)?.trim()?.toLowerCase();
  if (cliEnv === 'local' || cliEnv === 'staging') {
    process.env.TEST_ENV = cliEnv;
    return cliEnv;
  }
  const envVal = (rawEnv.TEST_ENV || 'staging').trim().toLowerCase();
  return envVal === 'local' ? 'local' : 'staging';
}

export function getFixturePaths(envName = resolveEnvName()) {
  const isLocal = envName === 'local';
  return {
    teacherLedger: path.join(root, isLocal ? 'fixtures/local.json' : 'fixtures/staging.json'),
    studentLedger: path.join(root, isLocal ? 'fixtures/qa30.local.json' : 'fixtures/qa30.json'),
    studentAccount: path.join(root, isLocal ? '.cache/qa30-account.local.json' : '.cache/qa30-account.json'),
    cleanupState: path.join(root, isLocal ? 'fixtures/cleanup-state.local.json' : 'fixtures/cleanup-state.json')
  };
}

const env = resolveEnvName();
const isLocal = env === 'local';
const isStaging = !isLocal;

export const config = {
  env,
  isLocal,
  isStaging,
  baseUrl: isLocal
    ? (process.env.LOCAL_BASE_URL || 'http://localhost:5173')
    : (process.env.STAGING_BASE_URL || process.env.SELENIUM_BASE_URL || 'https://staging.hotung9108.me'),
  apiBaseUrl: isLocal
    ? (process.env.LOCAL_API_URL || 'http://localhost:8080/api/v1')
    : (process.env.STAGING_API_URL || 'https://api-staging.hotung9108.me/api/v1'),
  fixtures: getFixturePaths(env),
  browser: {
    headless: process.env.HEADLESS !== 'false',
    timeout: parseInt(process.env.BROWSER_TIMEOUT_MS || '30000', 10),
    slowMo: parseInt(process.env.SLOW_MO || '0', 10)
  },
  credentials: {
    admin: {
      email: process.env.SELENIUM_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'hoang.thanh.ngan@utc-polyglot.edu.vn',
      password: process.env.SELENIUM_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'Password123!'
    },
    teacher: {
      email: process.env.SELENIUM_TEACHER_EMAIL || process.env.TEACHER_EMAIL || 'pham.dieu.anh@gmail.com',
      password: process.env.SELENIUM_TEACHER_PASSWORD || process.env.TEACHER_PASSWORD || 'Password123!'
    },
    student: {
      email: process.env.SELENIUM_STUDENT_EMAIL || process.env.STUDENT_EMAIL || 'ngo.thi.phuong@gmail.com',
      password: process.env.SELENIUM_STUDENT_PASSWORD || process.env.STUDENT_PASSWORD || 'Password123!'
    }
  },
  qase: {
    enabled: process.env.QASE_ENABLED === 'true',
    token: process.env.QASE_API_TOKEN || '5357cc1d83bbcd98ad4a81683f0fec9c23a7102cf1f2986c7b5ea28734d3eaf8',
    projectCode: process.env.QASE_PROJECT_CODE || 'EAM',
    runId: process.env.QASE_RUN_ID || ''
  }
};

export function loadConfig(rawEnv = process.env) {
  const envMap = { ...rawEnv };
  for (const [key, value] of Object.entries(envMap)) {
    if (key.startsWith('QA28_') || key.startsWith('QA29_') || key.startsWith('QA30_') || key.startsWith('QA31_')) {
      envMap[key.replace(/^QA\d+_/, 'SELENIUM_')] ??= value;
    }
  }

  const activeEnv = resolveEnvName(envMap);
  const activeIsLocal = activeEnv === 'local';

  const targetFrontendUrl = activeIsLocal
    ? (envMap.LOCAL_BASE_URL || 'http://localhost:5173')
    : (envMap.STAGING_BASE_URL || envMap.SELENIUM_BASE_URL || 'https://staging.hotung9108.me');

  const targetApiUrl = activeIsLocal
    ? (envMap.LOCAL_API_URL || 'http://localhost:8080/api/v1')
    : (envMap.STAGING_API_URL || envMap.API_BASE_URL || 'https://api-staging.hotung9108.me/api/v1');

  const base = new URL(targetFrontendUrl);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) {
    throw new Error('SELENIUM_BASE_URL must be an HTTP(S) URL without credentials');
  }
  if (base.pathname !== '/' || base.search || base.hash) {
    throw new Error('SELENIUM_BASE_URL must contain only the frontend origin');
  }

  const browser = envMap.SELENIUM_BROWSER || envMap.BROWSER || 'chrome';
  if (!['chrome', 'edge'].includes(browser)) throw new Error('SELENIUM_BROWSER must be chrome or edge');
  const headless = envMap.SELENIUM_HEADLESS ?? (envMap.HEADLESS !== 'false' ? 'true' : 'false');
  if (!['true', 'false'].includes(headless)) throw new Error('SELENIUM_HEADLESS must be true or false');
  const timeout = Number(envMap.SELENIUM_TIMEOUT_MS || envMap.BROWSER_TIMEOUT_MS || 30000);
  if (!Number.isInteger(timeout) || timeout < 1000 || timeout > 120000) {
    throw new Error('SELENIUM_TIMEOUT_MS must be an integer between 1000 and 120000');
  }

  const users = {
    admin: {
      email: envMap.SELENIUM_ADMIN_EMAIL || envMap.ADMIN_EMAIL || 'hoang.thanh.ngan@utc-polyglot.edu.vn',
      password: envMap.SELENIUM_ADMIN_PASSWORD || envMap.ADMIN_PASSWORD || 'Password123!'
    },
    teacher: {
      email: envMap.SELENIUM_TEACHER_EMAIL || envMap.TEACHER_EMAIL || 'pham.dieu.anh@gmail.com',
      password: envMap.SELENIUM_TEACHER_PASSWORD || envMap.TEACHER_PASSWORD || 'Password123!'
    },
    student: {
      email: envMap.SELENIUM_STUDENT_EMAIL || envMap.STUDENT_EMAIL || 'ngo.thi.phuong@gmail.com',
      password: envMap.SELENIUM_STUDENT_PASSWORD || envMap.STUDENT_PASSWORD || 'Password123!'
    }
  };

  return {
    env: activeEnv,
    isLocal: activeIsLocal,
    isStaging: !activeIsLocal,
    baseUrl: base.origin,
    apiBaseUrl: targetApiUrl,
    fixtures: getFixturePaths(activeEnv),
    browser,
    headless: headless === 'true',
    timeout,
    binary: envMap.SELENIUM_BROWSER_BINARY,
    driverPath: envMap.SELENIUM_DRIVER_PATH,
    gridUrl: envMap.SELENIUM_GRID_URL,
    users
  };
}
