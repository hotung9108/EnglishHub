Nguồn: QA-32 — Vitest/React Testing Library, mã develop e8e85a4, ngày 22/10/2026. Mức độ đề xuất: **Medium**.

**Phạm vi bằng chứng:** đã chạy component trong jsdom với service mock; không phải Selenium/staging hoặc kiểm thử API thật. Tất cả ID/nội dung là fixture tổng hợp.

## Tiền điều kiện

Cài dependency trong frontend bằng npm ci, dùng Node 22.19+; checkout nhánh bàn giao QA-32.

## Các bước tái hiện

1. Đặt timezone test Asia/Ho_Chi_Minh.
2. Đóng băng thời gian tại 2026-10-22T03:00:00.000Z (10:00 giờ địa phương).
3. Render form và đọc hai input datetime-local.

## Kết quả mong đợi

Giờ mở mặc định 22/10/2026 10:00 và hạn mặc định 29/10/2026 10:00 theo giờ địa phương.

## Kết quả thực tế và bằng chứng

Form hiển thị 03:00 cho cả hai ngày, lệch 7 giờ. Test nhận 2026-10-22T03:00 thay vì 2026-10-22T10:00.

Test đã chạy và fail tại assertion yêu cầu hành vi mong đợi: `initializes datetime-local defaults with local time rather than UTC clock text`, file `frontend/src/__tests__/known-bugs/TeacherCreate.known-bugs.test.tsx`.

Lệnh: `npm run test:ui:known-bugs -- -t "initializes datetime-local defaults with local time rather than UTC clock text"`. Suite known-bugs được tách khỏi acceptance/coverage; không dùng expect.fail để biến lỗi thành pass.

## Tiêu chí hoàn tất và retest

- [ ] Sửa hành vi trên, ca tái hiện chuyển Pass với assertion mong đợi giữ nguyên.
- [ ] Chạy test:ui và test:ui:types; retest tích hợp trên dữ liệu QA riêng.
- [ ] Khi đã sửa, chuyển test sang acceptance, không đưa lỗi đã hết vào danh sách tồn đọng.

<!-- QA32-issue-key:timezone -->
