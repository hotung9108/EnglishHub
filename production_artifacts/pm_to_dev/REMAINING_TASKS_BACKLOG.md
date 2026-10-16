# EnglishHub - Bảng Tổng Hợp Nhiệm Vụ Cần Giao (PM to Dev Backlog)

> **Tệp phân tích chi tiết & tiêu chí nghiệm thu (Acceptance Criteria)**: Xem tại [`docs/PROJECT_REMAINING_TASKS_BY_ROLE.md`](file:///d:/Codin/utc-code/HK4_1/Project1/EnglishHub/docs/PROJECT_REMAINING_TASKS_BY_ROLE.md)  
> **Người lập**: Antigravity Technical Assistant  
> **Người tiếp nhận**: Project Manager (`@pm` - `hotung9108`)  
> **Ngày lập**: 11/10/2026  
> **Căn cứ**: Audit trực tiếp 100% mã nguồn thực tế (React 19, Spring Boot, FastAPI, GitHub Actions).

---

## 1. Danh Sách Task Phân Bổ Cho Frontend (`@fe-primary`, `@fe-secondary`)

1. **`TASK-FE-20` (P0 - Blocker)**: Khắc phục lỗi mất trắng câu hỏi khi tạo & sửa bài tập Reading/Listening (`TeacherCreateAssignment.tsx`, `TeacherEditAssignment.tsx`).
2. **`TASK-FE-21` (P0 - Blocker)**: Hiện thực tải file audio thật & audio player cho đề bài Listening (`SkillListeningEditor.tsx`, `StudentAssignmentListening.tsx`).
3. **`TASK-FE-22` (P0 - Blocker)**: Thu âm Web Audio thật & upload S3 Presigned URL cho bài Speaking (`StudentAssignmentSpeaking.tsx`, `useAudioRecorder.ts`).
4. **`TASK-FE-23` (P1 - High)**: Tải tệp tài liệu bài luận (.docx/.pdf) lên S3 trực tiếp trong bài Writing (`StudentAssignmentWriting.tsx`).
5. **`TASK-FE-24` (P0 - Blocker)**: Bảng điều khiển duyệt lỗi AI & nghe audio học sinh cho Giáo viên (`TeacherSubmissionDetails.tsx`, `TeacherAnnotationReviewPanel.tsx`).
6. **`TASK-FE-25` (P1 - High)**: Trực quan hóa highlight sửa lỗi tương tác phía học viên (`StudentSubmissionResult.tsx`).
7. **`TASK-FE-26` (P1 - High)**: Bổ sung các nút hành động Publish, Close, Delete bài tập cho Giáo viên (`TeacherAssignments.tsx`, `TeacherAssignmentDetails.tsx`).
8. **`TASK-FE-27` (P1 - High)**: Xây dựng bộ chạy bài thi đa kỹ năng tuần tự Multi-Module Exam Runner (`StudentAssignmentRunner.tsx` tại `/student/assignments/:id/take`).
9. **`TASK-FE-28` (P2 - Medium)**: Bổ sung chức năng ghi danh học sinh vào lớp phía Giáo viên (`TeacherClassProgress.tsx`).

---

## 2. Danh Sách Task Phân Bổ Cho Backend & AI (`@be-primary`, `@be-secondary`)

1. **`TASK-BE-20` (P0 - Blocker)**: Bổ sung endpoint lấy Presigned GET URL cho audio & tài liệu bài nộp của học sinh (`SubmissionController.java`, `SubmissionService.java`).
2. **`TASK-BE-21` (P0 - Blocker)**: Bổ sung endpoint Stream / Tải file âm thanh module Listening cho học sinh (`ModuleController.java`).
3. **`TASK-BE-22` (P1 - High)**: Bổ sung thông tin `skills` trong `AssignmentSummaryResponse` để Frontend không phải đoán mò qua tiêu đề bài tập.
4. **`TASK-BE-23` (P1 - High)**: Đóng gói FFmpeg trong `ai-service/Dockerfile` và tự động chuyển đổi audio đa trình duyệt `audio/webm` sang chuẩn `wav` 16kHz.
5. **`TASK-BE-24` (P1 - High)**: Tích hợp gửi email thật qua SMTP cho luồng quên mật khẩu và nhận OTP (`AuthService.java`, `EmailService.java`).

---

## 3. Danh Sách Task Phân Bổ Cho DevOps (`@devops-primary`, `@devops-secondary`)

1. **`TASK-OPS-04` (P0 - Blocker)**: Bổ sung bước kiểm thử tự động `npm test` vào workflow `.github/workflows/ci-frontend.yml`.
2. **`TASK-OPS-05` (P1 - High)**: Kiểm tra & cập nhật toàn bộ GitHub Repository Secrets phục vụ CD Staging & Production (`cd-backend.yml`, `cd-ai-service.yml`, `cd-frontend.yml`).
3. **`TASK-OPS-06` (P2 - Medium)**: Thiết lập tự động sao lưu Postgres (`pg_dump`) trước khi deploy Flyway migrations mới trên VPS.

---

## 4. Danh Sách Task Phân Bổ Cho QA / Tester (`@tester` - `Zawn-Tsu`)

1. **`TASK-QA-03` (P0 - Blocker)**: Khởi tạo 8 vé báo lỗi chính thức vào thư mục `.agents/tasks/bugs/` (`BUG-001.yaml` đến `BUG-008.yaml`).
2. **`TASK-QA-01` (P0 - Blocker)**: Thiết lập Vitest & React Testing Library cho Frontend Components (`coverage >= 80%`).
3. **`TASK-QA-02` (P0 - Blocker)**: Xây dựng bộ kịch bản kiểm thử tự động E2E luồng liên thông 5 bước (Playwright) phục vụ nghiệm thu đồ án.
