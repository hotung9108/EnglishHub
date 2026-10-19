import fs from 'node:fs/promises';
import { studentCases } from '../tests/student/cases.js';

const cell = text => String(text).replaceAll('|', '\\|').replaceAll('\n', ' ');
const header = `# QA30 — Test case Học viên\n\n${studentCases.length} case từ registry thực thi. Mỗi case có browser session mới và đăng nhập đúng role STUDENT. Fixture API chỉ tạo dữ liệu QA và đọc lại kết quả; thao tác nghiệp vụ chạy bằng Selenium.\n\nXem [QA30-README.md](QA30-README.md) để cấu hình/chạy và report thực tế. Số case không đồng nghĩa bao phủ 100% chức năng.\n\n| ID | Nội dung | Bước thực hiện | Kỳ vọng |\n| --- | --- | --- | --- |\n`;
await fs.writeFile(new URL('../QA30-TEST-CASES.md', import.meta.url), header + studentCases.map(test => '| ' + [test.id, test.title, test.steps, test.expected].map(cell).join(' | ') + ' |').join('\n') + '\n');
console.log(`Documented ${studentCases.length} student cases; no staging/browser actions.`);
