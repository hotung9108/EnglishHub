Nguồn: QA-32 — Vitest/React Testing Library, mã develop e8e85a4, ngày 22/10/2026. Mức độ đề xuất: **High**.

**Phạm vi bằng chứng:** đã chạy component trong jsdom với service mock; không phải Selenium/staging hoặc kiểm thử API thật. Tất cả ID/nội dung là fixture tổng hợp.

## Tiền điều kiện

Cài dependency trong frontend bằng npm ci, dùng Node 22.19+; checkout nhánh bàn giao QA-32.

## Các bước tái hiện

1. Render form có lớp, tiêu đề và Writing prompt hợp lệ.
2. Mock createAssignment thành công (ID tổng hợp 42), createModule reject `Module failed`.
3. Bấm Giao bài tập, chờ xử lý kết thúc.

## Kết quả mong đợi

Dừng publish và hiển thị lỗi khi module chưa được lưu.

## Kết quả thực tế và bằng chứng

updateAssignmentStatus(42, 'PUBLISHED') vẫn được gọi; UI báo tạo thành công.

Test đã chạy và fail tại assertion yêu cầu hành vi mong đợi: `does not publish an assignment whose module failed to save`, file `frontend/src/__tests__/known-bugs/TeacherCreate.known-bugs.test.tsx`.

Lệnh: `npm run test:ui:known-bugs -- -t "does not publish an assignment whose module failed to save"`. Suite known-bugs được tách khỏi acceptance/coverage; không dùng expect.fail để biến lỗi thành pass.

## Tiêu chí hoàn tất và retest

- [ ] Sửa hành vi trên, ca tái hiện chuyển Pass với assertion mong đợi giữ nguyên.
- [ ] Chạy test:ui và test:ui:types; retest tích hợp trên dữ liệu QA riêng.
- [ ] Khi đã sửa, chuyển test sang acceptance, không đưa lỗi đã hết vào danh sách tồn đọng.

<!-- QA32-issue-key:create -->
