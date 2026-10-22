Nguồn: QA-32 — Vitest/React Testing Library, mã develop e8e85a4, ngày 22/10/2026. Mức độ đề xuất: **Medium**.

**Phạm vi bằng chứng:** đã chạy component trong jsdom với service mock; không phải Selenium/staging hoặc kiểm thử API thật. Tất cả ID/nội dung là fixture tổng hợp.

## Tiền điều kiện

Cài dependency trong frontend bằng npm ci, dùng Node 22.19+; checkout nhánh bàn giao QA-32.

## Các bước tái hiện

1. Render route /student/writing/invalid?submissionId=40 với API service mock.
2. Theo dõi assignmentService.getAssignment.

## Kết quả mong đợi

Hiển thị ID không hợp lệ hoặc điều hướng về danh sách; không tải một bài khác.

## Kết quả thực tế và bằng chứng

getAssignment(1) được gọi khi Number(id) không hữu hạn.

Test đã chạy và fail tại assertion yêu cầu hành vi mong đợi: `invalid assignment IDs must not silently load assignment 1`, file `frontend/src/__tests__/known-bugs/StudentWriting.known-bugs.test.tsx`.

Lệnh: `npm run test:ui:known-bugs -- -t "invalid assignment IDs must not silently load assignment 1"`. Suite known-bugs được tách khỏi acceptance/coverage; không dùng expect.fail để biến lỗi thành pass.

## Tiêu chí hoàn tất và retest

- [ ] Sửa hành vi trên, ca tái hiện chuyển Pass với assertion mong đợi giữ nguyên.
- [ ] Chạy test:ui và test:ui:types; retest tích hợp trên dữ liệu QA riêng.
- [ ] Khi đã sửa, chuyển test sang acceptance, không đưa lỗi đã hết vào danh sách tồn đọng.

<!-- QA32-issue-key:route -->
