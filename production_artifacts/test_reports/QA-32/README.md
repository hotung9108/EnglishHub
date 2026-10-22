# QA-32 — Bàn giao Vitest và React Testing Library

Nhánh: feature/qa-32-ui-components, base develop e8e85a4d6ffa54a1bc8e107c61a8a82c44028ded.
Ngày kiểm chứng: 22/10/2026, Windows / Node 22.19.0 / npm 10.9.3 / jsdom / TZ Asia/Ho_Chi_Minh.

## Kết quả

- Acceptance: **102 Pass / 2 todo / 0 Fail** (104 ca tổng).
- Known-bugs riêng: **9 Fail đúng assertion mong đợi**, không tính acceptance hoặc coverage.
- API client/utility hiện có: **139 Pass / 0 Fail**.
- npm ci từ lockfile: Pass. Typecheck test và production build: Pass (có cảnh báo bundle >500 kB).
- ESLint: exit 0, một cảnh báo sẵn có react-hooks/exhaustive-deps tại TeacherSubmissionDetails.tsx:311; không sửa source ứng dụng trong task QA.
- Cấu hình ngưỡng >=80% cho từng chỉ số, riêng từng màn hình.

| File | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| Tổng | 94.64% | 85.3% | 90% | 95.08% |
| Login.tsx | 100% | 92.72% | 100% | 100% |
| StudentAssignmentWriting.tsx | 92.75% | 81.59% | 91.66% | 92.63% |
| TeacherCreateAssignment.tsx | 93.05% | 90.04% | 82.35% | 92.22% |
| TeacherSubmissionDetails.tsx | 96.51% | 82.74% | 94.64% | 98.43% |

Dữ liệu đối chiếu không chứa đường dẫn máy: [evidence/summary.json](evidence/summary.json). Coverage HTML được sinh bằng npm run test:ui trong frontend/coverage; artifact thô và bản zip cũ giữ riêng ngoài Git.

npm audit ghi nhận 4 mục High ở brace-expansion 5.0.9, follow-redirects 1.16.0, source-map-js 1.2.1 và vite 8.2.2. Đã đối chiếu lockfile base: cả bốn phiên bản đã có nguyên trạng trước QA-32; chưa nâng dependency ứng dụng trong phạm vi task này.

## Phạm vi bàn giao

Bổ sung dependency/config/scripts, setup/helpers, test component, suite tái hiện lỗi, CI và tài liệu. Không sửa source ứng dụng hoặc backend. Giữ cấu hình proxy storage mới nhất của develop.

Login chống gửi lặp, Reading/Listening lưu câu hỏi và Writing chờ upload URL đã hoạt động trên develop mới, được kiểm tra như hồi quy acceptance. Không tiếp tục báo chúng là lỗi chỉ vì bản zip dựa trên mã cũ từng fail.

Test dùng API mock nên không chứng minh DB lưu bài, presigned URL thật, AI provider hoặc quyền backend chạy đúng. Chưa chạy Selenium/staging trong lượt bàn giao này. API client tests cũng không phải integration server thật.

## Ngoại lệ DoD và trạng thái

Giữ QA-32 **In Progress**, bộ test sẵn sàng review qua PR. UI duyệt annotation chưa có (#214) theo quyết định người dùng chỉ ghi nhận chức năng thiếu; không tự bổ sung ứng dụng. Bước điểm 0.5 so với thập phân khác cần chốt spec (#215), không coi 0.1 bị invalid là bug đã xác nhận.

Hai mục là todo, không Pass. Các lỗi sản phẩm được giao issue riêng, không chữa acceptance bằng assertion khẳng định hành vi sai. CI xanh không đồng nghĩa toàn bộ DoD sản phẩm đã hoàn tất.

## Chạy và retest

Xem [hướng dẫn](../../../docs/FRONTEND_UI_TESTING.md). Chạy npm ci rồi test:ui, test:ui:types, npm test, lint, build trong frontend. test:ui:known-bugs hiện phải trả exit 1 với 9 ca đỏ đã ghi nhận; dùng cho dev retest từng issue.

[Danh sách issue và nội dung dán Trello](ISSUE-LINKS-2026-10-22.md). Tài liệu này thay thế số liệu cũ khi bàn giao nhánh develop mới; ZIP trước đó là snapshot lịch sử, không dùng làm bằng chứng của nhánh này.
