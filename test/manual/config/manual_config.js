const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const BASE_URL = process.env.MANUAL_BASE_URL || 'https://staging.hotung9108.me';

module.exports = {
  baseUrl: BASE_URL,
  rootDir: ROOT_DIR,
  screenshotsDir: path.join(ROOT_DIR, 'screenshots'),
  reportsDir: path.join(ROOT_DIR, 'reports'),
  timeouts: {
    pageLoad: 30000,
    elementWait: 10000,
    actionDelay: 800
  },
  viewports: {
    desktop: { width: 1920, height: 1080, name: 'Desktop FHD (1920x1080)' },
    tablet: { width: 768, height: 1024, name: 'Tablet iPad (768x1024)' },
    mobile: { width: 375, height: 812, name: 'Mobile iPhone (375x812)' }
  },
  accounts: {
    student: {
      email: process.env.SELENIUM_STUDENT_EMAIL || '',
      password: process.env.SELENIUM_STUDENT_PASSWORD || '',
      fullName: 'Ngô Thị Phương',
      role: 'student'
    },
    teacher: {
      email: process.env.SELENIUM_TEACHER_EMAIL || '',
      password: process.env.SELENIUM_TEACHER_PASSWORD || '',
      fullName: 'Phạm Diệu Anh',
      role: 'teacher'
    },
    admin: {
      email: process.env.SELENIUM_ADMIN_EMAIL || '',
      password: process.env.SELENIUM_ADMIN_PASSWORD || '',
      fullName: 'Hoàng Thanh Ngân',
      role: 'admin'
    }
  }
};
