Nguồn: QA-32 — Vitest/React Testing Library, mã develop e8e85a4, ngày 22/10/2026. Mức độ đề xuất: **High**.

**Phạm vi bằng chứng:** đã chạy component trong jsdom với service mock; không phải Selenium/staging hoặc kiểm thử API thật. Tất cả ID/nội dung là fixture tổng hợp.

## Tiền điều kiện

Cài dependency trong frontend bằng npm ci, dùng Node 22.19+; checkout nhánh bàn giao QA-32.

## Các bước tái hiện

1. Render Writing với submission IN_PROGRESS và nháp tổng hợp `Unsaved essay`.
2. Mock submitModule thành công; mock submitSubmission reject `Finalize failed`.
3. Bấm Nộp bài, chờ luồng xử lý kết thúc.

## Kết quả mong đợi

Giữ nháp, hiển thị lỗi có thể thử lại và không báo nộp thành công.

## Kết quả thực tế và bằng chứng

Nháp bị xóa (nhận null thay vì `Unsaved essay`); UI báo nộp thành công.

Test đã chạy và fail tại assertion yêu cầu hành vi mong đợi: `preserves draft and reports failure when finalization fails`, file `frontend/src/__tests__/known-bugs/StudentWriting.known-bugs.test.tsx`.

Lệnh: `npm run test:ui:known-bugs -- -t "preserves draft and reports failure when finalization fails"`. Suite known-bugs được tách khỏi acceptance/coverage; không dùng expect.fail để biến lỗi thành pass.

## Tiêu chí hoàn tất và retest

- [ ] Sửa hành vi trên, ca tái hiện chuyển Pass với assertion mong đợi giữ nguyên.
- [ ] Chạy test:ui và test:ui:types; retest tích hợp trên dữ liệu QA riêng.
- [ ] Khi đã sửa, chuyển test sang acceptance, không đưa lỗi đã hết vào danh sách tồn đọng.

<!-- QA32-issue-key:finalize -->
