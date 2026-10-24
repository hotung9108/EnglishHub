# FE-50: Sửa luồng nộp bài Viết kèm file & Chuẩn hóa điều hướng bài đã nộp

## 1. Tổng quan
- **Mã tính năng / Task**: `[FE-50]` (Khắc phục BUG-21).
- **Phạm vi**: Giao diện Học viên (`StudentAssignments.tsx`, `StudentAssignmentWriting.tsx`, `examStepper.utils.ts`).
- **Phụ trách**: `@fe-primary` (`Maloque18705`).

---

## 2. Các vấn đề được giải quyết
1. **Khắc phục lỗi bỏ quên file đính kèm (BUG-21)**:
   - Trước đây khi học viên kéo thả hoặc chọn file Word (.docx) hoặc PDF, hàm submit chỉ gửi nội dung text, bỏ sót file.
   - Giải pháp: Chuẩn hóa MIME qua `getBackendDocumentMimeType`, upload trực tiếp lên kho lưu trữ MinIO/S3 bằng Presigned PUT URL và gửi `storageKey` cùng `{ text, fileName, hasAttachedFile }`.
2. **Sửa lỗi điều hướng từ danh sách bài tập (`StudentAssignments.tsx`)**:
   - Khi bài tập có trạng thái `pending` (chờ chấm điểm), `ai_processing` (đang xử lý AI), hoặc `graded` (đã chấm), nút *"Xem lại bài nộp"* (`btnReview`) điều hướng chuẩn xác tới `/student/submissions/:submissionId`.
   - Loại bỏ hoàn toàn lỗi điều hướng nhầm vào trang làm bài `/student/assignments/:id`.
3. **Bảo vệ trạng thái nộp bài (`StudentAssignmentWriting.tsx`)**:
   - Tự động phát hiện nếu bài tập đã được nộp (`SUBMITTED` | `GRADED`) và không còn lượt `IN_PROGRESS` -> Tự động chuyển hướng sang xem kết quả.
   - Kiểm tra chặt chẽ `subModuleId` và `submission` trước khi cho phép nộp bài. Vô hiệu hóa nút nộp bài khi form chưa sẵn sàng.

---

## 3. Kiến trúc luồng xử lý
```text
Học viên vào /student/assignments
    │
    ├─► Bài đã nộp (status: pending / ai_processing / graded)
    │      └─► Bấm "Xem lại bài nộp" ──► /student/submissions/:submissionId
    │
    ├─► Bài chưa làm (status: not_started)
    │      └─► Bấm "Bắt đầu làm bài" ──► /student/assignments/:id/overview
    │
    └─► Bài đang làm (status: in_progress)
           └─► Bấm "Tiếp tục"        ──► /student/assignments/writing/:id?submissionId=...
```

---

## 4. Lưu ý Phụ thuộc Backend & Database (DOCX MIME Type Overflow)
- **Vấn đề**: Chuỗi MIME type của file Word (.docx) là `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (dài **71 ký tự**).
- **Hạn chế Database**: Cột `doc_mime_type` trong bảng `answers` (PostgreSQL `V1__init_schema.sql` dòng 377) và entity `Answer.java` (dòng 69) hiện bị giới hạn `VARCHAR(50)`.
- **Hệ quả**: Khi học sinh nộp file Word .docx, câu lệnh SQL INSERT bị lỗi `value too long for type character varying(50)` và Backend phản hồi lỗi HTTP 500.
- **Hành động khắc phục**: Backend cần bổ sung migration Flyway `ALTER TABLE answers ALTER COLUMN doc_mime_type TYPE VARCHAR(100);` và cập nhật `Answer.java`.

---

## 5. Tài liệu liên quan
- Task Tracker: [.agents/tasks/fe-primary/done/TASK-FE-50-FIX-WRITING-SUBMISSION-FLOW.md](file:///d:/Coding/EnglishHub/.agents/tasks/fe-primary/done/TASK-FE-50-FIX-WRITING-SUBMISSION-FLOW.md)
- Bug Ticket Backend: [.agents/tasks/bugs/BUG-DOCX-MIME-TYPE-OVERFLOW.yaml](file:///d:/Coding/EnglishHub/.agents/tasks/bugs/BUG-DOCX-MIME-TYPE-OVERFLOW.yaml)
- Hướng dẫn kiểm thử cho Tester: [production_artifacts/fe_to_tester/FE_50_WRITING_SUBMISSION_FLOW_TEST_GUIDE.md](file:///d:/Coding/EnglishHub/production_artifacts/fe_to_tester/FE_50_WRITING_SUBMISSION_FLOW_TEST_GUIDE.md)
- Unit Tests: `frontend/src/api/__tests__/writing-document.test.ts`
