Nguồn: QA-32 — Vitest/React Testing Library, mã develop e8e85a4, ngày 22/10/2026. Mức độ đề xuất: **High**.

**Phạm vi bằng chứng:** đã chạy component trong jsdom với service mock; không phải Selenium/staging hoặc kiểm thử API thật. Tất cả ID/nội dung là fixture tổng hợp.

## Tiền điều kiện

Cài dependency trong frontend bằng npm ci, dùng Node 22.19+; checkout nhánh bàn giao QA-32.

## Các bước tái hiện

1. Render Writing với query submissionId tổng hợp.
2. Mock getSubmission reject `Missing attempt`.
3. Nhập Essay, bấm Nộp bài và chờ xử lý kết thúc.

## Kết quả mong đợi

Chặn nộp hoặc báo lỗi tải lượt nộp, không chuyển trạng thái thành công.

## Kết quả thực tế và bằng chứng

Không có submission hợp lệ nhưng UI vẫn hiển thị `Nộp bài thành công!`.

Test đã chạy và fail tại assertion yêu cầu hành vi mong đợi: `must not report success without a submission attempt`, file `frontend/src/__tests__/known-bugs/StudentWriting.known-bugs.test.tsx`.

Lệnh: `npm run test:ui:known-bugs -- -t "must not report success without a submission attempt"`. Suite known-bugs được tách khỏi acceptance/coverage; không dùng expect.fail để biến lỗi thành pass.

## Tiêu chí hoàn tất và retest

- [ ] Sửa hành vi trên, ca tái hiện chuyển Pass với assertion mong đợi giữ nguyên.
- [ ] Chạy test:ui và test:ui:types; retest tích hợp trên dữ liệu QA riêng.
- [ ] Khi đã sửa, chuyển test sang acceptance, không đưa lỗi đã hết vào danh sách tồn đọng.

<!-- QA32-issue-key:attempt -->
