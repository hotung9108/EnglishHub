Nguồn: QA-32 — Vitest/React Testing Library, mã develop e8e85a4, ngày 22/10/2026. Mức độ đề xuất: **High**.

**Phạm vi bằng chứng:** đã chạy component trong jsdom với service mock; không phải Selenium/staging hoặc kiểm thử API thật. Tất cả ID/nội dung là fixture tổng hợp.

## Tiền điều kiện

Cài dependency trong frontend bằng npm ci, dùng Node 22.19+; checkout nhánh bàn giao QA-32.

## Các bước tái hiện

1. Render TeacherSubmissionDetails với grading PENDING và điểm hợp lệ 7/10.
2. Bấm Lưu bản nháp nhận xét.
3. Kiểm tra lời gọi gradingService.submitGrade và đối chiếu hợp đồng backend.

## Kết quả mong đợi

Lưu nháp phải giữ trạng thái nháp; không gọi endpoint hoàn tất chấm điểm. Nếu chưa có API nháp cần chốt thiết kế thay vì báo đã lưu nháp.

## Kết quả thực tế và bằng chứng

submitGrade được gọi với finalScore=7; source backend updateFinalGrade/withTeacherGrade chuyển COMPLETED. Đây là kiểm chứng lời gọi component và đọc source, chưa retest trạng thái backend thật.

Test đã chạy và fail tại assertion yêu cầu hành vi mong đợi: `saving a draft must not call the endpoint that completes grading`, file `frontend/src/__tests__/known-bugs/TeacherGrade.known-bugs.test.tsx`.

Lệnh: `npm run test:ui:known-bugs -- -t "saving a draft must not call the endpoint that completes grading"`. Suite known-bugs được tách khỏi acceptance/coverage; không dùng expect.fail để biến lỗi thành pass.

## Tiêu chí hoàn tất và retest

- [ ] Sửa hành vi trên, ca tái hiện chuyển Pass với assertion mong đợi giữ nguyên.
- [ ] Chạy test:ui và test:ui:types; retest tích hợp trên dữ liệu QA riêng.
- [ ] Khi đã sửa, chuyển test sang acceptance, không đưa lỗi đã hết vào danh sách tồn đọng.

<!-- QA32-issue-key:grade -->
