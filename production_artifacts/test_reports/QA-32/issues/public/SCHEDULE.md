Nguồn: QA-32 — Vitest/React Testing Library, mã develop e8e85a4, ngày 22/10/2026. Mức độ đề xuất: **Medium**.

**Phạm vi bằng chứng:** đã chạy component trong jsdom với service mock; không phải Selenium/staging hoặc kiểm thử API thật. Tất cả ID/nội dung là fixture tổng hợp.

## Tiền điều kiện

Cài dependency trong frontend bằng npm ci, dùng Node 22.19+; checkout nhánh bàn giao QA-32.

## Các bước tái hiện

1. Render form Writing hợp lệ.
2. Chọn giờ mở 08/11/2026 09:00 và giờ đóng 01/11/2026 09:00.
3. Bấm Giao bài tập.

## Kết quả mong đợi

Chặn trước khi gọi API và báo ngày đóng phải sau ngày mở.

## Kết quả thực tế và bằng chứng

createAssignment vẫn được gọi với closeAt trước openAt.

Test đã chạy và fail tại assertion yêu cầu hành vi mong đợi: `rejects a closing date before the opening date`, file `frontend/src/__tests__/known-bugs/TeacherCreate.known-bugs.test.tsx`.

Lệnh: `npm run test:ui:known-bugs -- -t "rejects a closing date before the opening date"`. Suite known-bugs được tách khỏi acceptance/coverage; không dùng expect.fail để biến lỗi thành pass.

## Tiêu chí hoàn tất và retest

- [ ] Sửa hành vi trên, ca tái hiện chuyển Pass với assertion mong đợi giữ nguyên.
- [ ] Chạy test:ui và test:ui:types; retest tích hợp trên dữ liệu QA riêng.
- [ ] Khi đã sửa, chuyển test sang acceptance, không đưa lỗi đã hết vào danh sách tồn đọng.

<!-- QA32-issue-key:schedule -->
