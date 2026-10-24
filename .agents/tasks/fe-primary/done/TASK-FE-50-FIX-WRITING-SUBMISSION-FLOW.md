---
id: TASK-FE-50-FIX-WRITING-SUBMISSION-FLOW
title: "[FE-50] Sửa luồng nộp bài Viết bị bỏ quên file đính kèm & Bảo vệ trạng thái nộp bài"
role: fe-primary
assignee: Maloque18705
status: "Done"
created_at: 2026-10-23T09:00:00+07:00
updated_at: 2026-10-24T10:18:00+07:00
completed_at: 2026-10-24T10:18:00+07:00
priority: P1
tags: [frontend, student, teacher, writing, file-upload, navigation, BUG-21, fe-50, convention-fe, docx-mime-bug, vitest, qa-32]
---

# [FE-50] Sửa luồng nộp bài Viết bị bỏ quên file đính kèm & Bảo vệ trạng thái nộp bài

## 1. Bối cảnh & Mục tiêu (Context & Objective)
- **Ticket / Bug Tracker**: [FE-50] (Khắc phục BUG-21 trong luồng làm và nộp bài Viết).
- **Vấn đề thực tế (Problem)**:
  1. **Lỗi bỏ quên file đính kèm**: Khi học sinh kéo thả hoặc chọn file Word (.docx) hoặc PDF trong `StudentAssignmentWriting.tsx`, hàm submit trước đây chỉ gửi `editorText`, bỏ quên tệp đính kèm (`uploadedFile`), khiến giáo viên và AI không nhận được bài nộp dạng file.
  2. **Lỗi điều hướng xem lại bài nộp**: Từ trang `StudentAssignments.tsx`, đối với bài tập đã nộp đang chờ chấm (`pending`) hoặc đang phân tích (`ai_processing`), nút *"Xem lại bài nộp"* (`btnReview`) lại điều hướng sai về trang làm bài `/student/assignments/:id`.
  3. **Lỗi văng ngoại lệ khi nộp bài đã nộp**: Khi học sinh bị điều hướng sang trang làm bài của bài tập đã nộp, nếu bấm *"Nộp bài"* thì hệ thống văng thông báo *"Không tìm thấy thông tin phần thi bài viết để nộp."* do không tìm thấy lượt làm bài `IN_PROGRESS`.
  4. **Hồi quy kiểm thử & Cấu hình Docker (Phát hiện sau khi merge develop)**:
     - `vite.config.ts` import từ `'vitest/config'` làm sập Vite dev server trong môi trường container Docker khi thiếu package `vitest`.
     - 11 lỗi kiểm thử trong bộ Vitest UI suite (`StudentAssignmentWriting.test.tsx` và `TeacherSubmissionDetails.test.tsx`) do lệch chuỗi validation rỗng, cấu trúc payload submit, phương thức upload, và chuỗi toast.
     - Thẻ thống kê MetricCard *"Độ dài bài nộp"* bị thừa thãi trên giao diện chấm bài của giáo viên, vi phạm nguyên tắc Zero-Bloat.
- **Mục tiêu hoàn thành**:
  - Tải file đính kèm (Word/PDF) trực tiếp lên MinIO/S3 lưu trữ an toàn trước khi submit module.
  - Gửi `storageKey` cùng thông tin file (`fileName`, `hasAttachedFile`) và nội dung text lên backend theo đúng kiểu `SubmitModulePayload`.
  - Hỗ trợ cả 3 trường hợp: chỉ gõ text, chỉ đính kèm file, hoặc kết hợp cả hai.
  - Sửa hàm điều hướng `getStudentAssignmentActionRoute` đảm bảo bài đã nộp điều hướng đúng tới `/student/submissions/:submissionId`.
  - Phân tách cấu hình độc lập: `vite.config.ts` (Vite thuần) và `vitest.config.ts` (Vitest test runner).
  - Khắc phục toàn bộ 11 lỗi kiểm thử Vitest UI, vượt qua cổng Code Coverage > 80% trên mọi tiêu chí.
  - Tối giản hóa giao diện theo nguyên tắc Zero-Bloat của `frontend-ui-standards`.
- **Tiêu chuẩn áp dụng**: Tuân thủ nghiêm ngặt `.agents/rules/convention-fe.md` và `.agents/private/frontend-ui-standards`.

---

## 2. Nhật ký Commit & Chi tiết thay đổi (Git Commits & Implementation)

### 2.1. Danh sách Commit
- **`cc77cb0`**: `fixbug: Writing submission` — Luồng upload file Word/PDF cho học sinh, lưu trữ MinIO/S3 và hiển thị tệp đính kèm cho giáo viên.
- **`4ed27f0`**: `fix(frontend): resolve writing submission test suite failures and decouple vitest config` — Tách biệt `vite.config.ts` / `vitest.config.ts`, sửa 11 lỗi kiểm thử UI Vitest, chuẩn hóa payload submit và phương thức upload trực tiếp `fetch`.
- **`8fb8ee1`**: `refactor(teacher): remove redundant word count metric card per ui standards` — Xóa MetricCard *"Độ dài bài nộp"* thừa thãi, tối ưu hóa lưới `.tsd-metrics-grid` theo 8px scale, nâng độ phủ nhánh `TeacherSubmissionDetails.tsx` lên 82.22%.

---

### 2.2. Chi tiết kỹ thuật từng phần

#### A. Chuẩn hóa Kiến trúc Cấu hình Vite & Vitest (Commit `4ed27f0`)
- **`frontend/vite.config.ts`**: Chuyển về sử dụng thuần `import { defineConfig } from 'vite'`, loại bỏ hoàn toàn khối `test`. Đảm bảo Vite dev server trong môi trường Docker khởi động tức thì, không bị lỗi `UNRESOLVED_IMPORT: Could not resolve 'vitest/config'`.
- **`frontend/vitest.config.ts`**: Tạo tệp cấu hình chuyên dụng cho Vitest runner, kế thừa cấu hình từ `vite.config.ts` thông qua `mergeConfig`, thiết lập jsdom, setupFiles, TZ `Asia/Ho_Chi_Minh` và ngưỡng kiểm soát độ phủ code coverage 80%.
- **`frontend/vitest.known-bugs.config.ts`**: Trỏ import cấu hình sang `./vitest.config.ts`.

#### B. Sửa luồng làm bài & nộp bài Writing (`StudentAssignmentWriting.tsx` - Commits `cc77cb0`, `4ed27f0`)
- **Tải tệp đính kèm an toàn (BUG-21)**:
  - Chuẩn hóa MIME type qua `getBackendDocumentMimeType` (hỗ trợ cả `.pdf` và `.docx`).
  - Lấy Presigned PUT URL từ backend: `submissionService.getDocumentUploadUrl(subModuleId, mimeType)`.
  - Thực thi upload tệp trực tiếp bằng `fetch(targetUrl, { method: 'PUT', body: uploadedFile, headers: { 'Content-Type': uploadedFile.type || 'application/octet-stream' } })`, tương thích với cơ chế kiểm thử Vitest và proxy `/s3-upload` cho container Docker.
- **Đóng gói Payload nộp bài chuẩn**:
  - Tách bạch cấu trúc: Chỉ gửi trường `storageKey` khi có file upload thật sự.
  - Khi nộp bài chỉ có text thuần: gửi `content: { text: trimmedText }` không kèm key dư thừa, khớp 100% với kiểu `SubmitModulePayload`.
- **Kiểm tra hợp lệ & Trạng thái nút**:
  - Khôi phục chính xác thông báo validation rỗng: `"Vui lòng nhập nội dung bài luận hoặc tải lên tệp bài làm trước khi nộp."`.
  - Truy vấn lượt làm bài: `submissionService.listSubmissions({ assignmentId: numericId, studentId: user.id, status: 'IN_PROGRESS', limit: 1 })`.
  - Đặt nút Nộp bài `disabled={isSubmitting}` để cho phép học sinh click kích hoạt validation khi bài tập đã đóng (`CLOSED`).

#### C. Chuẩn hóa Giao diện Chấm bài Giáo viên (`TeacherSubmissionDetails.tsx` - Commits `cc77cb0`, `4ed27f0`, `8fb8ee1`)
- **Thông báo tải tài liệu**: Đặt Toast thông báo đúng chuẩn kiểm thử: `"Preparing download..."` (tiếng Anh) và `"Đang tạo liên kết tải tài liệu..."` (tiếng Việt).
- **Trích xuất nội dung bài làm**: Cập nhật hàm `studentAnswerText` hỗ trợ trích xuất an toàn từ object `text ?? essay ?? answer ?? content` với fallback `JSON.stringify(obj)` cho các cấu trúc dữ liệu mở rộng.
- **Thông báo fallback khi tải bài lỗi**: Hiển thị `"Học viên đã nộp bài tập trực tuyến."` / `"Student submitted the online assignment."` khi chưa tải được chi tiết câu trả lời.
- **Xóa phần tử thừa theo chuẩn Zero-Bloat (Commit `8fb8ee1`)**:
  - Loại bỏ thẻ `MetricCard` *"Độ dài bài nộp"* (`Word Count`) dư thừa phía trên vì số từ đã hiển thị tự nhiên trong khung bài làm học viên (`.tsd-answer-wordcount` và `.tsd-answer-footer`).
  - Cập nhật `.tsd-metrics-grid` trong `frontend/src/styles/teacher.css`: `grid-template-columns: repeat(auto-fill, minmax(260px, 360px))` với khoảng cách `--spacing-md` (16px), tạo bố cục tinh gọn, không kéo giãn tràn màn hình.
  - Loại bỏ các nhánh rẽ điều kiện ternary không cần thiết, giúp nâng độ phủ nhánh lên 82.22% và độ phủ hàm đạt 100%.

#### D. Chuẩn hóa Định tuyến & Xem lại bài nộp (`StudentAssignments.tsx` & `examStepper.utils.ts` - Commit `cc77cb0`)
- Hàm `getStudentAssignmentActionRoute`:
  - `status === 'graded' | 'pending' | 'ai_processing'`: Điều hướng tới `/student/submissions/:submissionId`.
  - `status === 'not_started'`: Điều hướng tới `/student/assignments/:id/overview`.
  - `status === 'in_progress'`: Điều hướng vào kỹ năng đang làm dở kèm `?submissionId=...`.

---

## 3. Kết quả Kiểm thử & Nghiệm thu (Verification & DoD)

| Hạng mục kiểm tra | Tiêu chuẩn đạt | Kết quả thực tế | Trạng thái |
| :--- | :--- | :--- | :---: |
| **Vitest UI Suite** (`npm run test:ui`) | 100% test cases pass, 0 fail | **102 passed, 2 todo, 0 failed** (4/4 test files) | **ĐẠT** |
| **Coverage Gate (Threshold > 80%)** | Statements, Branch, Funcs, Lines > 80% | **Stmts: 93.96% \| Branch: 84.66% \| Funcs: 92.20% \| Lines: 94.42%** | **ĐẠT** |
| **Coverage `StudentAssignmentWriting.tsx`** | Branch > 80% | **Stmts: 89.38% \| Branch: 80.34% \| Funcs: 91.66% \| Lines: 88.99%** | **ĐẠT** |
| **Coverage `TeacherSubmissionDetails.tsx`** | Branch > 80% | **Stmts: 97.16% \| Branch: 82.22% \| Funcs: 100% \| Lines: 99.29%** | **ĐẠT** |
| **API Unit Tests** (`npm test`) | 100% unit tests pass | **144/144 passed** (0 fail) | **ĐẠT** |
| **ESLint** (`npm run lint`) | 0 errors, 0 warnings | **Clean 100%** | **ĐẠT** |
| **Production Build** (`npm run build`) | `tsc -b && vite build` thành công | **Built in 1.24s** (0 type errors) | **ĐẠT** |

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
