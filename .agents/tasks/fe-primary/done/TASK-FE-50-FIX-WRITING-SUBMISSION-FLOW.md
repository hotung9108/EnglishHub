---
id: TASK-FE-50-FIX-WRITING-SUBMISSION-FLOW
title: "[FE-50] Sửa luồng nộp bài Viết bị bỏ quên file đính kèm & Bảo vệ trạng thái nộp bài"
role: fe-primary
assignee: Maloque18705
status: "Done"
created_at: 2026-10-23T09:00:00+07:00
updated_at: 2026-10-23T20:45:00+07:00
completed_at: 2026-10-23T20:45:00+07:00
priority: P1
tags: [frontend, student, teacher, writing, file-upload, navigation, BUG-21, fe-50, convention-fe, docx-mime-bug]
---

# [FE-50] Sửa luồng nộp bài Viết bị bỏ quên file đính kèm & Bảo vệ trạng thái nộp bài

## 1. Bối cảnh & Mục tiêu (Context & Objective)
- **Ticket / Bug Tracker**: [FE-50] (Khắc phục BUG-21 trong luồng làm và nộp bài Viết).
- **Vấn đề thực tế (Problem)**:
  1. **Lỗi bỏ quên file đính kèm**: Khi học sinh kéo thả hoặc chọn file Word (.docx) hoặc PDF trong `StudentAssignmentWriting.tsx`, hàm submit trước đây chỉ gửi `editorText`, bỏ quên tệp đính kèm (`uploadedFile`), khiến giáo viên và AI không nhận được bài nộp dạng file.
  2. **Lỗi điều hướng xem lại bài nộp**: Từ trang `StudentAssignments.tsx`, đối với bài tập đã nộp đang chờ chấm (`pending`) hoặc đang phân tích (`ai_processing`), nút *"Xem lại bài nộp"* (`btnReview`) lại điều hướng sai về trang làm bài `/student/assignments/:id`.
  3. **Lỗi văng ngoại lệ khi nộp bài đã nộp**: Khi học sinh bị điều hướng sang trang làm bài của bài tập đã nộp, nếu bấm *"Nộp bài"* thì hệ thống văng thông báo *"Không tìm thấy thông tin phần thi bài viết để nộp."* do không tìm thấy lượt làm bài `IN_PROGRESS`.
- **Mục tiêu hoàn thành**:
  - Tải file đính kèm (Word/PDF) trực tiếp lên MinIO/S3 lưu trữ an toàn trước khi submit module.
  - Gửi `storageKey` cùng thông tin file (`fileName`, `hasAttachedFile`) và nội dung text lên backend.
  - Hỗ trợ cả 3 trường hợp: chỉ gõ text, chỉ đính kèm file, hoặc kết hợp cả hai.
  - Sửa hàm điều hướng `getStudentAssignmentActionRoute` đảm bảo bài đã nộp điều hướng đúng tới `/student/submissions/:submissionId`.
  - Bảo vệ trạng thái trang làm bài: Tự động chuyển hướng sang xem kết quả nếu bài đã nộp, và vô hiệu hóa nút nộp bài khi chưa sẵn sàng.
- **Tiêu chuẩn áp dụng**: Tuân thủ nghiêm ngặt `.agents/rules/convention-fe.md` và `.agents/private/frontend-ui-standards`.

---

## 2. Các thay đổi đã thực hiện (Implementation Details)

### 2.1. Chuẩn hóa Định tuyến & Xem lại bài nộp (`StudentAssignments.tsx` & `examStepper.utils.ts`)
- **Tập trung hóa logic điều hướng**: Xây dựng hàm helper chuẩn `getStudentAssignmentActionRoute(assignment)` tại `frontend/src/utils/examStepper.utils.ts`.
- **Phân luồng chính xác**:
  - `status === 'graded' | 'pending' | 'ai_processing'`: Điều hướng tới `/student/submissions/:submissionId` (hoặc `/student/assignments/:id/result`).
  - `status === 'not_started'`: Điều hướng tới `/student/assignments/:id/overview`.
  - `status === 'in_progress'`: Điều hướng vào đúng kỹ năng đang thi kèm query `?submissionId=...`.
- Tối giản hóa code tại `StudentAssignments.tsx`: thay thế khối if-else rườm rà bằng một lời gọi duy nhất `navigate(getStudentAssignmentActionRoute(assignment))`.

### 2.2. Bảo vệ Trạng thái & Xử lý Nộp bài (`StudentAssignmentWriting.tsx`)
- **Phát hiện bài đã nộp**: Trong `loadData()`, kiểm tra danh sách submission của học sinh:
  - Nếu đã có bài `SUBMITTED` hoặc `GRADED` và không có bài `IN_PROGRESS`: tự động điều hướng sang `/student/submissions/:completedSubId` (replace history).
  - Nếu đường dẫn có `?submissionId=...` của bài đã nộp: tự động điều hướng sang trang kết quả `/student/submissions/:id`.
- **Kiểm soát nút Nộp bài**:
  - `disabled={isSubmitting || isLoading || !submission}`: ngăn chặn học sinh bấm nộp khi lượt thi chưa sẵn sàng hoặc không hợp lệ.
- **Tải tệp đính kèm an toàn (BUG-21)**:
  - Chuẩn hóa MIME type file qua `getBackendDocumentMimeType` (hỗ trợ cả `.pdf` và `.docx`).
  - Lấy Presigned PUT URL từ backend: `submissionService.getDocumentUploadUrl(subModuleId, mimeType)`.
  - Upload trực tiếp file lên MinIO storage qua `submissionService.uploadDirectToStorage`.
  - Gọi `submissionService.submitModule(subModuleId, { storageKey, answers: [...] })` gửi kèm `fileName` và `hasAttachedFile`.

### 2.3. Kiểm thử Tự động (Unit Tests)
- Bổ sung test suite tại `frontend/src/api/__tests__/writing-document.test.ts`:
  - Kiểm tra chuẩn hóa MIME type cho các biến thể PDF và DOCX.
  - Kiểm tra hàm `getStudentAssignmentActionRoute` điều hướng chính xác cho tất cả trạng thái (`pending`, `ai_processing`, `graded`, `not_started`, `in_progress`).
  - Kiểm tra payload submit module gửi đúng `storageKey`, `fileName`, và `hasAttachedFile`.

---

## 3. Kết quả Kiểm thử (Verification & DoD)
- **Unit Tests**: 144/144 tests passing (100% pass, 0 fail).
- **TypeScript & Build**: `tsc -b && vite build` hoàn thành thành công trong < 1.0s, 0 lỗi, 0 cảnh báo type.
- **Linter**: `eslint .` chạy toàn bộ dự án frontend sạch sẽ 100% (0 errors, 0 warnings).
- **Tuân thủ tiêu chuẩn**:
  - TypeScript Strict Mode, không sử dụng `any`.
  - Tái sử dụng CSS variables hệ thống Royal Academic, zero inline styles.
  - Tinh gọn tối giản theo `frontend-ui-standards`.

---

## 4. Phát hiện Lỗi Liên kết Backend / Database (Blocker Cần Bàn Giao `@be-primary`)
Trong quá trình hoàn thiện FE-50 và kiểm thử nộp file Word (.docx), phát hiện một lỗi nghiêm trọng ở tầng Backend & Database:
- **Tên lỗi**: `[Bug] Lỗi HTTP 500 khi nộp bài Writing đính kèm file Word (.docx) do vượt quá độ dài cột doc_mime_type VARCHAR(50)`.
- **Nguyên nhân gốc rễ**:
  1. Frontend gửi MIME chuẩn: `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (độ dài **71 ký tự**).
  2. Backend `SubmissionService.java` (dòng 371) cũng định nghĩa ứng viên docx đúng chuẩn chuỗi 71 ký tự này.
  3. Tuy nhiên, bảng `answers` trong database PostgreSQL (`V1__init_schema.sql` dòng 377) và JPA Entity `Answer.java` (dòng 69) chỉ khai báo:
     ```sql
     doc_mime_type VARCHAR(50)
     ```
  4. Do $71 > 50$, câu lệnh `INSERT INTO answers` của Hibernate bị PostgreSQL từ chối (`SQLState: 22001 - value too long for type character varying(50)`), làm máy chủ ném lỗi HTTP 500 Internal Server Error.
- **Yêu cầu xử lý cho Backend Dev (`@be-primary`)**:
  - Tạo migration Flyway `V5__increase_doc_mime_type_length.sql`: `ALTER TABLE answers ALTER COLUMN doc_mime_type TYPE VARCHAR(100);`.
  - Cập nhật entity `Answer.java`: `@Column(name = "doc_mime_type", length = 100)`.
  - Đã lập ticket theo dõi độc lập tại [.agents/tasks/bugs/BUG-DOCX-MIME-TYPE-OVERFLOW.yaml](file:///d:/Coding/EnglishHub/.agents/tasks/bugs/BUG-DOCX-MIME-TYPE-OVERFLOW.yaml).
