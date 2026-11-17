import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Load environment variables safely from .env if present
 */
function tryLoadEnv() {
  const envCandidates = [
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../../.env')
  ];

  for (const envPath of envCandidates) {
    if (fs.existsSync(envPath)) {
      try {
        if (typeof process.loadEnvFile === 'function') {
          process.loadEnvFile(envPath);
        } else {
          // Manual fallback parser for key=value
          const content = fs.readFileSync(envPath, 'utf8');
          for (const line of content.split(/\r?\n/)) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx > 0) {
              const k = trimmed.slice(0, eqIdx).trim();
              let v = trimmed.slice(eqIdx + 1).trim();
              if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
                v = v.slice(1, -1);
              }
              if (!process.env[k]) process.env[k] = v;
            }
          }
        }
      } catch (e) {
        // Continue to next candidate
      }
    }
  }
}

tryLoadEnv();

export const NEGATIVE_TEST_CREDS = {
  invalidPassword: 'InvalidPassword_999!',
  unregisteredEmail: 'unregistered_unknown_999@englishhub.com',
  whitespaceEmail: ' hoang.thanh.ngan@hotung9108.me ',
  mismatchNewPassword: 'NewSecret123!',
  mismatchConfirmPassword: 'MismatchSecret999!'
};

export function generateTestUserCredentials(role = 'STUDENT') {
  const ts = Date.now();
  return {
    name: `${role === 'TEACHER' ? 'Giáo viên' : 'Học viên'} Test Auto ${ts}`,
    email: `${role.toLowerCase()}_test_${ts}@englishhub.com`,
    password: `TempPass_${ts}!Aa`,
    phone: '09' + Math.floor(10000000 + Math.random() * 90000000),
    role
  };
}

/**
 * Retrieves validated configuration.
 * Throws explicit error if any required password is missing.
 */
export function getValidatedConfig() {
  const baseUrl = process.env.SELENIUM_BASE_URL || process.env.STAGING_FE_URL || process.env.BASE_URL || 'https://staging.hotung9108.me';
  const apiBaseUrl = process.env.SELENIUM_API_BASE_URL || process.env.STAGING_BE_URL || process.env.API_BASE_URL || 'https://api-staging.hotung9108.me/api/v1';
  const headless = process.env.SELENIUM_HEADLESS !== 'false';
  const timeoutMs = parseInt(process.env.SELENIUM_TIMEOUT_MS || '20000', 10);

  const adminPassword = process.env.SELENIUM_ADMIN_PASSWORD || process.env.STAGING_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  const teacherPassword = process.env.SELENIUM_TEACHER_PASSWORD || process.env.STAGING_TEACHER_PASSWORD || process.env.TEACHER_PASSWORD;
  const studentPassword = process.env.SELENIUM_STUDENT_PASSWORD || process.env.STAGING_STUDENT_PASSWORD || process.env.STUDENT_PASSWORD;

  const missing = [];
  if (!adminPassword) missing.push('SELENIUM_ADMIN_PASSWORD (hoặc STAGING_ADMIN_PASSWORD / ADMIN_PASSWORD)');
  if (!teacherPassword) missing.push('SELENIUM_TEACHER_PASSWORD (hoặc STAGING_TEACHER_PASSWORD / TEACHER_PASSWORD)');
  if (!studentPassword) missing.push('SELENIUM_STUDENT_PASSWORD (hoặc STAGING_STUDENT_PASSWORD / STUDENT_PASSWORD)');

  if (missing.length > 0) {
    throw new Error(
      `\n❌ [SECURITY P0 CONFIG ERROR] Không tìm thấy mật khẩu cấu hình bắt buộc trong biến môi trường:\n` +
      missing.map(m => `   - ${m}`).join('\n') +
      `\n👉 Vui lòng thiết lập biến môi trường hoặc tệp .env theo mẫu .env.example trước khi chạy kiểm thử!\n`
    );
  }

  return {
    baseUrl,
    apiBaseUrl,
    headless,
    timeout: timeoutMs,
    users: {
      admin: {
        email: process.env.SELENIUM_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'hoang.thanh.ngan@hotung9108.me',
        password: adminPassword,
        role: 'ADMIN'
      },
      teacher: {
        email: process.env.SELENIUM_TEACHER_EMAIL || process.env.TEACHER_EMAIL || 'tran.anh.thang@gmail.com',
        password: teacherPassword,
        role: 'TEACHER'
      },
      student: {
        email: process.env.SELENIUM_STUDENT_EMAIL || process.env.STUDENT_EMAIL || 'nguyen.dieu.mai@gmail.com',
        password: studentPassword,
        role: 'STUDENT'
      },
      lockedUser: {
        email: process.env.SELENIUM_LOCKED_USER_EMAIL || 'student_test_1794664155476@englishhub.com',
        password: studentPassword,
        role: 'STUDENT',
        id: 8
      }
    }
  };
}
