import fs from 'node:fs/promises';
import { teacherCases } from '../tests/teacher/cases.js';

// Documentation generation only: no driver, login, API or test execution.
const cell = value => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
const prerequisites = test => [
  'Tài khoản giáo viên QA',
  ...test.required.map(key => ({ className: 'lớp QA thuộc giáo viên', studentName: 'học viên QA trong lớp', assignmentTitle: 'bài Writing QA đã nộp' })[key]),
  ...(test.expanded ? ['ledger fixtures/staging.json và setup API mở rộng'] : test.needsApi ? ['ledger fixtures/staging.json và đăng nhập API giáo viên'] : []),
  ...(test.fixtureKey ? [`fixture ${test.fixtureKey} chuẩn bị thành công`] : []),
  ...(test.loginAs === 'profile' ? ['session tài khoản profile QA riêng'] : []),
].join('; ');
const header = `# QA-29 — Danh sách test case\n\n**51 case tự động; lượt staging ngày 15/10/2026: 41 Passed / 7 Failed / 3 Blocked. Kết quả lịch sử trước khi tích hợp vào repo.** Đây là tài liệu sinh từ registry mà runner sử dụng; không chạy Selenium khi tạo tài liệu.\n\nXem [QA29-README.md](QA29-README.md) để chuẩn bị và chạy. Mỗi case mở session mới, đăng nhập và kiểm tra role trước quy trình dưới đây. Những case phụ thuộc provider/control có thể Blocked, không tính Pass.\n\n| ID | Test case | Tiền điều kiện | Bước thực hiện | Kết quả kỳ vọng |\n| --- | --- | --- | --- | --- |\n`;
const rows = teacherCases.map(test => [test.id, test.title, prerequisites(test), test.steps, test.expected].map(cell).join(' | '));
await fs.writeFile(new URL('../QA29-TEST-CASES.md', import.meta.url), header + rows.map(row => `| ${row} |`).join('\n') + '\n');
console.log(`Documented ${teacherCases.length} cases; no tests executed.`);
