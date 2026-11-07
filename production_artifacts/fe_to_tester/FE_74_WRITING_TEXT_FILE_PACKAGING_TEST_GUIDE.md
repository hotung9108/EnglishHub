# FE-74 Hướng dẫn Kiểm thử (FE to Tester)

## 1. Thông tin chung
- **Task ID**: [FE-74] Đóng gói bài làm Writing dạng văn bản thành file và tích hợp luồng upload presigned URL, xóa bỏ gửi text trực tiếp
- **Branch**: `feat/FE-74-writing-text-file-packaging-presigned-upload`
- **Developer**: Maloque18705 (@fe-primary)
- **Reviewer / Tester**: Zawn-Tsu (@tester)

## 2. Mục tiêu thay đổi
1. **Writing**:
   - Khi học sinh nhập văn bản trong editor và nhấn nộp bài, frontend tự động đóng gói văn bản thành `essay.txt` (`text/plain;charset=utf-8`).
   - Yêu cầu presigned upload URL cho file document thông qua `submissionService.getWritingUploadUrl(assignmentId, moduleId, 'essay.txt', 'text/plain')`.
   - Upload file trực tiếp lên MinIO/S3 bằng `submissionService.uploadDocument`.
   - Gọi `submitModule` với `{ storageKey, answers: [] }` (loại bỏ hoàn toàn việc gửi `content: { text: ... }`).
   - Nếu học sinh đính kèm file có sẵn (PDF, DOCX, TXT), luồng upload file vẫn hoạt động bình thường qua `submissionService.uploadDocument`.
2. **Speaking**:
   - Tích hợp `submissionService.uploadAudio` sử dụng presigned URL chuẩn.
   - Khi học sinh không ghi âm / không có file audio mà bấm nộp bài: hiển thị modal cảnh báo "Nộp bài không có bản ghi âm?". Nếu học sinh chọn xác nhận tiếp tục, nộp payload rỗng (`answers: []`, `storageKey: null`) thành công.
3. **Teacher & Student Review**:
   - `TeacherSubmissionDetails.tsx` và `StudentSubmissionResult.tsx`: Nhận biết file `.txt` / `essay.txt`, tải nội dung qua `submissionService.getDocumentFileBlob` và hiển thị trực tiếp nội dung bài viết dạng văn bản cho giáo viên và học sinh xem, đồng thời hiển thị highlight AI annotation đầy đủ.
4. **Backend (Hỗ trợ)**:
   - Cập nhật `SubmissionService.java` cho phép MIME type `text/plain` tương ứng với extension `txt` khi sinh presigned URL cho tài liệu.

## 3. Các bước kiểm thử (Testing Steps)

### Kịch bản 1: Học sinh làm bài Writing dạng text và nộp bài
1. Đăng nhập tài khoản Student.
2. Vào một bài tập Writing (dạng essay/văn bản).
3. Nhập bài luận vào khung soạn thảo (Rich Text / Plain text).
4. Nhấn "Nộp bài" hoặc "Hoàn thành phần thi":
   - **Kỳ vọng**: 
     - Không có lỗi 400 Bad Request.
     - Kiểm tra Network tab:
       - Có request `POST /api/submissions/upload-url/document` với `filename: "essay.txt"` và `mimeType: "text/plain"`.
       - Có request `PUT <presigned-minio-url>` đẩy nội dung `essay.txt`.
       - Có request `POST /api/submissions/modules/{moduleId}/submit` với `{ storageKey: "...", answers: [] }`.

### Kịch bản 2: Học sinh nộp bài Speaking trống
1. Đăng nhập tài khoản Student.
2. Vào bài tập Speaking nhưng không thực hiện ghi âm.
3. Nhấn "Nộp bài":
   - **Kỳ vọng**:
     - Hiển thị Modal xác nhận: "Bạn chưa thực hiện bản ghi âm nào. Bạn có chắc chắn muốn nộp bài mà không có file âm thanh?".
     - Nhấn "Xem lại": modal đóng, ở lại màn hình ghi âm.
     - Nhấn "Xác nhận nộp bài": Nộp thành công và chuyển sang phần thi tiếp theo hoặc kết thúc bài làm.

### Kịch bản 3: Giáo viên xem chi tiết bài làm Writing đã nộp
1. Đăng nhập tài khoản Teacher.
2. Vào chi tiết bài nộp của học sinh ở Kịch bản 1 (`/teacher/submissions/{id}`).
3. Kiểm tra phần Writing:
   - **Kỳ vọng**: File `essay.txt` được liệt kê trong danh sách tệp đính kèm; nội dung văn bản bài viết được tự động tải và hiển thị trực tiếp trong khung xem bài luận mà không bị lỗi.

### Kịch bản 4: Học sinh xem kết quả bài làm Writing
1. Đăng nhập tài khoản Student.
2. Vào xem kết quả bài làm (`/student/results/{submissionId}`).
3. **Kỳ vọng**: Nội dung bài viết `essay.txt` hiển thị chính xác cùng với các gợi ý/chấm điểm của AI.

## 4. Bằng chứng kiểm thử tự động (Automated Test Evidence)
- **Backend**:
  - `SubmissionServiceTest`: `getDocumentUploadUrl_generatesPresignedUrlForTextPlain` -> **PASSED**
  - `SubmissionUploadUrlApiIntegrationTest`: `submitModule_marksEssayAnswerReadyWhenTextPlainDocumentUploaded` -> **PASSED**
- **Frontend**:
  - `StudentAssignmentWriting.test.tsx` (42 tests): Toàn bộ các case upload `essay.txt`, storage failure handling, upload document đính kèm -> **PASSED**
  - `writing-document.test.ts`: Mapping mimeType `text/plain` và payload submit -> **PASSED**
  - `npm test`: 200/200 tests -> **PASSED**
  - `npm run build`: TypeScript checking & bundle -> **PASSED** (0 errors)
  - `npm run lint`: ESLint check -> **PASSED** (0 errors, 0 warnings)
