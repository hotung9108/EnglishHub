import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { commonCases } from '../black-box/e2e/common/cases/auth-smoke.spec.js';
import { adminCases } from '../black-box/e2e/admin/cases/account-lifecycle.spec.js';
import { teacherCases } from '../black-box/e2e/teacher/cases/assignment-flow.spec.js';
import { studentCases } from '../black-box/e2e/student/cases/exam-taking.spec.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cell = text => String(text ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ').trim();

function formatPrerequisites(test) {
  if (test.required && Array.isArray(test.required)) {
    const map = {
      className: 'Lớp QA thuộc giáo viên',
      studentName: 'Học viên QA trong lớp',
      assignmentTitle: 'Bài tập QA đã xuất bản'
    };
    const reqs = test.required.map(r => map[r] || r);
    if (test.fixtureKey) reqs.push(`Fixture ${test.fixtureKey}`);
    return reqs.length ? reqs.join('; ') : 'Tài khoản theo role';
  }
  if (test.resources && Array.isArray(test.resources) && test.resources.length) {
    return test.resources.join(', ');
  }
  return 'Tài khoản theo role';
}

function generateMarkdownSection(title, description, cases) {
  const header = `\n## ${title} (${cases.length} cases)\n\n${description}\n\n| ID | Tên Test Case | Tiền điều kiện | Các bước thực hiện | Kết quả kỳ vọng |\n| :--- | :--- | :--- | :--- | :--- |\n`;
  const rows = cases.map(test => {
    const id = cell(test.id);
    const name = cell(test.title);
    const prereq = cell(formatPrerequisites(test));
    const steps = cell(test.steps || test.summary || 'Thực hiện luồng test chuẩn');
    const exp = cell(test.expected);
    return `| ${id} | ${name} | ${prereq} | ${steps} | ${exp} |`;
  }).join('\n');
  return header + rows + '\n';
}

async function run() {
  const total = commonCases.length + adminCases.length + teacherCases.length + studentCases.length;
  
  let md = `# EnglishHub Test Reborn — Danh Mục Test Cases Tự Động\n\n`;
  md += `> **Tài liệu sinh tự động từ Registry thực thi của Test Reborn**  \n`;
  md += `> Ngày cập nhật: ${new Date().toISOString().split('T')[0]}  \n`;
  md += `> Tổng số test cases E2E UI: **${total}**\n\n`;

  md += `### Thống kê tổng quan:\n\n`;
  md += `| Phân hệ / Role | Tiền tố ID | Số lượng test cases | Phạm vi kiểm thử |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  md += `| **Common / Auth** | \`COM-xxx\` | ${commonCases.length} | Giao diện login, xác thực session dùng chung |\n`;
  md += `| **Admin** | \`ADM-xxx\` | ${adminCases.length} | Quản trị users, classes, audit logs, system settings |\n`;
  md += `| **Teacher** | \`TEA-xxx\` | ${teacherCases.length} | Quản lý lớp, giao bài, chấm điểm, analytics 4 kỹ năng |\n`;
  md += `| **Student** | \`STU-xxx\` | ${studentCases.length} | Làm bài thi (4 kỹ năng), nộp bài, xem điểm, tiến độ |\n`;
  md += `| **TỔNG CỘNG** | | **${total}** | Toàn bộ các luồng nghiệp vụ UI E2E |\n`;

  md += generateMarkdownSection(
    'Common & Authentication Smoke Cases',
    'Các test case kiểm tra form đăng nhập và xác thực cơ bản độc lập role.',
    commonCases
  );

  md += generateMarkdownSection(
    'Admin Test Cases (ADM)',
    'Các luồng kiểm thử quản trị hệ thống, quản lý tài khoản, báo cáo và kiểm toán.',
    adminCases
  );

  md += generateMarkdownSection(
    'Teacher Test Cases (TEA)',
    'Các luồng kiểm thử nghiệp vụ giảng viên, quản lý lớp học, giao bài và chấm điểm.',
    teacherCases
  );

  md += generateMarkdownSection(
    'Student Test Cases (STU)',
    'Các luồng kiểm thử nghiệp vụ học viên, làm bài thi 4 kỹ năng và xem điểm số.',
    studentCases
  );

  const outputPath = path.resolve(__dirname, '../docs/TEST_CASES_CATALOG.md');
  await fs.writeFile(outputPath, md, 'utf-8');
  console.log(`Successfully documented ${total} cases to docs/TEST_CASES_CATALOG.md (Common: ${commonCases.length}, Admin: ${adminCases.length}, Teacher: ${teacherCases.length}, Student: ${studentCases.length}).`);
}

run().catch(err => {
  console.error('Failed to generate test case documentation:', err);
  process.exit(1);
});
