# [FE-50] Hướng Dẫn Kiểm Thử Luồng Nộp Bài Viết & Xem Lại Bài Nộp (Writing Submission Test Guide)

## 1. Thông tin chung
- **Ticket / Task ID**: [FE-50] (Khắc phục BUG-21)
- **Role**: `fe-primary` (Assignee: `Maloque18705`)
- **Target Role**: `tester` (Assignee: `Zawn-Tsu`)
- **Branch**: `fixbug/file-upload-writing`
- **Mục tiêu**: Xác thực luồng nộp bài phần thi Viết (Writing) có kèm tệp đính kèm (PDF/Word), luồng bảo vệ trạng thái bài đã nộp và điều hướng xem lại bài nộp từ danh sách bài tập.

---

## 2. Các điểm thay đổi chính cần kiểm thử (Test Scope)
1. **Trang Danh sách bài tập Học viên (`StudentAssignments.tsx`)**:
   - Đối với bài tập đang chờ chấm (`pending`) hoặc đang xử lý AI (`ai_processing`), nút *"Xem lại bài nộp"* (`btnReview`) điều hướng thẳng tới trang xem lại kết quả bài nộp `/student/submissions/:submissionId`.
   - Bấm vào toàn bộ thẻ card của bài đã nộp cũng kích hoạt hành động xem lại bài nộp thay vì mở lại trang làm bài thi.
2. **Trang Làm bài Viết (`StudentAssignmentWriting.tsx`)**:
   - **Tự động chuyển hướng**: Khi học viên truy cập URL `/student/assignments/:id` hoặc `/student/assignments/writing/:id` của một bài tập đã hoàn thành/đã nộp: hệ thống phát hiện và tự động chuyển hướng sang trang xem lại `/student/submissions/:completedSubId`.
   - **Vô hiệu hóa nút khi chưa sẵn sàng**: Nút *"Nộp bài"* bị vô hiệu hóa (`disabled`) khi dữ liệu bài thi đang tải hoặc khi không tìm thấy lượt làm bài hợp lệ.
   - **Nộp kèm tệp đính kèm (BUG-21)**:
     - Hỗ trợ tải tệp PDF (`.pdf`) và Word (`.docx`).
     - Tệp được tải trực tiếp lên MinIO storage an toàn.
     - Payload gửi lên backend chứa `storageKey`, tên tệp thực tế (`fileName`) và nội dung text.
     - Hỗ trợ cả 3 hình thức: chỉ nộp file, chỉ gõ text, hoặc kết hợp cả hai.

---

## 3. Kịch bản kiểm thử (Test Scenarios)

### Kịch bản 1: Nộp bài Viết có đính kèm file PDF
- **Dữ liệu**: Bài tập Writing ở trạng thái `OPEN`/`PUBLISHED`.
- **Thao tác**:
  1. Học viên vào làm bài viết.
  2. Kéo thả hoặc chọn tệp `.pdf` hợp lệ (< 10MB).
  3. Gõ thêm một đoạn văn bản ghi chú hoặc bài luận vào ô soạn thảo (hoặc để trống chỉ nộp file).
  4. Bấm *"Nộp bài (Submit Assignment)"*.
- **Kết quả kỳ vọng**:
  - Nút chuyển sang trạng thái loading *"Đang nộp bài..."*.
  - Tệp được tải lên thành công, bài nộp ghi nhận thành công và chuyển tiếp sang màn hình kết quả hoặc module tiếp theo.
  - Không gặp lỗi *"Không nhận được liên kết tải tệp"* hay lỗi mạng.

### Kịch bản 2: Bấm "Xem lại bài nộp" từ trang danh sách bài tập
- **Dữ liệu**: Bài tập đã nộp ở Kịch bản 1 (trạng thái hiển thị là "Chờ chấm điểm" / "Đang chấm").
- **Thao tác**:
  1. Học viên vào trang danh sách bài tập `/student/assignments`.
  2. Tìm bài tập vừa nộp.
  3. Bấm vào nút *"Xem lại bài nộp"* (hoặc bấm vào thẻ bài tập).
- **Kết quả kỳ vọng**:
  - Trình duyệt điều hướng chính xác đến `/student/submissions/:submissionId` (trang kết quả và phản hồi của bài nộp).
  - **Tuyệt đối không** điều hướng về trang làm bài `/student/assignments/:id`.

### Kịch bản 3: Ngăn chặn nộp lại bài khi truy cập trực tiếp URL làm bài
- **Dữ liệu**: Bài tập đã nộp ở Kịch bản 1 (không có quyền làm lại nhiều lần).
- **Thao tác**:
  1. Học viên sao chép và mở trực tiếp URL làm bài: `http://localhost:5173/student/assignments/:id` hoặc `http://localhost:5173/student/assignments/writing/:id`.
- **Kết quả kỳ vọng**:
  - Hệ thống tự động nhận diện bài nộp đã hoàn tất và chuyển hướng (replace) sang `/student/submissions/:submissionId`.
  - Học viên không bị rơi vào form trắng và không gặp thông báo lỗi *"Không tìm thấy thông tin phần thi bài viết để nộp."*.

### Kịch bản 4: Kiểm thử nộp file Word (.docx) & Lưu ý lỗi Backend
- **Dữ liệu**: File Word hợp lệ kết thúc bằng đuôi `.docx`.
- **Thao tác**: Tải file `.docx` và bấm nộp bài.
- **Lưu ý đặc biệt cho Tester**:
  > [!WARNING]
  > **Lỗi hệ thống Backend đã ghi nhận**: Chuỗi MIME type của file Word (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`) dài **71 ký tự**, trong khi cột `doc_mime_type` trong bảng `answers` của database PostgreSQL hiện bị giới hạn `VARCHAR(50)`.
  > Nếu Backend chưa áp dụng migration `ALTER TABLE answers ALTER COLUMN doc_mime_type TYPE VARCHAR(100);`, backend sẽ trả về lỗi **HTTP 500 Internal Server Error**. 
  > Frontend FE-50 đã gửi đúng chuẩn MIME type theo quy định và việc nộp file PDF hoàn toàn không bị ảnh hưởng (dài 15 ký tự). Tester cần xác nhận Backend đã cập nhật database trước khi nghiệm thu kịch bản nộp file `.docx`.

---

## 4. Lệnh kiểm tra tự động (Automated Verification)
```bash
# Chạy toàn bộ test suite frontend
npm --prefix frontend test

# Kiểm tra biên dịch TypeScript & production bundle
npm --prefix frontend run build

# Kiểm tra linter
npm --prefix frontend run lint
```
