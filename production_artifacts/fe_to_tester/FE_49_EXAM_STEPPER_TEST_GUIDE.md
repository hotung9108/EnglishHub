# [FE-49] Hướng Dẫn Kiểm Thử Bộ Chuyển Tiếp Module Thi Nhiều Kỹ Năng (Exam Stepper Test Guide)

## 1. Thông tin chung
- **Ticket / Task ID**: [FE-49] (Khắc phục BUG-20)
- **Role**: `fe-primary` (Assignee: `Maloque18705`)
- **Target Role**: `tester` (Assignee: `Zawn-Tsu`)
- **Branch**: `fixbug/exam-stepper`
- **Mục tiêu**: Xác thực bộ chuyển tiếp (Exam Stepper) giữa các module trong 1 assignment nhiều kỹ năng, đảm bảo học sinh làm lần lượt hết các module (Nghe/Nói/Đọc/Viết) trong bài thi tích hợp và không bị kẹt ở module đầu tiên.

---

## 2. Các điểm thay đổi chính cần kiểm thử (Test Scope)
1. **Màn hình Tổng quan (`StudentAssignmentOverview.tsx`)**:
   - Hiển thị component `ExamStepper` dạng Timeline các phần thi.
   - Các module tương lai bị khóa (`LOCKED` - icon Lock) nếu các module trước chưa hoàn thành.
   - Nút *"Làm phần này"* ở các module sau bị vô hiệu hóa kèm thông báo nhắc nhở.
   - Bắt đầu bài làm (`handleStartAttempt`) không còn dùng regex quét tiêu đề; tự động mở đúng module đầu tiên chưa nộp.
2. **Màn hình Làm bài 4 kỹ năng (`Listening`, `Reading`, `Writing`, `Speaking`)**:
   - Header hiển thị `ExamStepper` tinh gọn (`variant="compact"`) thể hiện vị trí hiện tại của học sinh và trạng thái các module khác.
   - Nộp một module thành công:
     - Tự động hiển thị thông báo chuyển tiếp mượt mà: *"Đã hoàn thành phần thi [A]! Đang chuyển tiếp sang [B]..."*.
     - Sau 1.5s tự động điều hướng sang module kế tiếp kèm `submissionId`.
   - Nộp module cuối cùng trong bài thi:
     - Tự động gọi hoàn tất bài nộp (`submitSubmission`).
     - Chuyển hướng tới màn hình kết quả `StudentSubmissionResult`.
3. **Định tuyến (`App.tsx`)**:
   - Hỗ trợ cả 2 route cho Writing: `/student/assignments/:id` và `/student/assignments/writing/:id`.

---

## 3. Kịch bản kiểm thử (Test Scenarios)

### Kịch bản 1: Tiêu đề bài thi không làm sai lệch thứ tự module
- **Dữ liệu**: Tạo bài thi 4 kỹ năng có tiêu đề chứa từ *"Nói"*, *"Speaking"*, hoặc *"Writing"*, ví dụ: *"Đề thi tốt nghiệp 4 kỹ năng (Nghe - Nói - Đọc - Viết)"* với danh sách modules: `[Listening, Reading, Writing, Speaking]`.
- **Thao tác**: Học sinh bấm nút *"Bắt đầu làm bài"*.
- **Kết quả kỳ vọng**: Hệ thống chuyển vào phần thi **Nghe (Listening)** đầu tiên, **không** bị nhảy cóc sang Speaking hay Writing.

### Kịch bản 2: Khóa tuần tự trên Stepper (Sequential Lock)
- **Dữ liệu**: Bài thi 4 kỹ năng đang ở trạng thái chưa hoàn thành Phần 1.
- **Thao tác**: Tại màn hình tổng quan, học sinh thử bấm vào thẻ hoặc nút của Phần 2 (Reading) hoặc Phần 4 (Speaking).
- **Kết quả kỳ vọng**: Nút bị vô hiệu hóa (disabled), hiển thị trạng thái *"Chưa mở"* kèm tooltip/thông báo *"Vui lòng hoàn thành Phần 1 trước"*.

### Kịch bản 3: Tự động chuyển tiếp tuần tự qua 4 module
- **Thao tác**:
  1. Học sinh làm bài và nộp Phần 1 (Listening).
  2. Quan sát thông báo thành công và chuyển tiếp sang Phần 2 (Reading).
  3. Làm bài và nộp Phần 2 (Reading) -> Tự động chuyển sang Phần 3 (Writing).
  4. Làm bài và nộp Phần 3 (Writing) -> Tự động chuyển sang Phần 4 (Speaking).
  5. Thu âm và nộp Phần 4 (Speaking).
- **Kết quả kỳ vọng**:
  - Tại mỗi phần, thanh Stepper trên header hiển thị đúng kỹ năng đang làm (Active) và các kỹ năng đã xong (Check xanh).
  - Sau khi nộp Phần 4, hệ thống chuyển thẳng đến màn hình kết quả bài thi `StudentSubmissionResult` hiển thị trạng thái bài nộp thành công.

### Kịch bản 4: Trạng thái Overview sau khi hoàn tất toàn bộ bài thi
- **Dữ liệu**: Bài thi đã hoàn thành và nộp tất cả các kỹ năng (`SUBMITTED` hoặc `GRADED`), không còn bài làm dở dang (`in-progress`).
- **Thao tác**: Học viên quay lại trang tổng quan `StudentAssignmentOverview` (`/student/assignments/overview/:id`).
- **Kết quả kỳ vọng**:
  - Tất cả các kỹ năng trên Timeline hiển thị trạng thái **"Đã hoàn thành"** (COMPLETED) với nút **"Xem lại"**.
  - **Không** còn kỹ năng nào hiển thị trạng thái sai lệch *"Đang làm bài"* (ACTIVE) hay nút *"Tiếp tục làm"*.
  - Nhấp vào nút *"Xem lại"* điều hướng thẳng tới trang xem lại kết quả bài nộp `/student/submissions/:submissionId`.

### Kịch bản 5: Không hiển thị đồng hồ đếm ngược mock
- **Kiểm tra**: Vào trang làm bài Reading (`/student/assignments/reading/:id`) hoặc Listening (`/student/assignments/listening/:id`).
- **Kết quả kỳ vọng**: Không hiển thị widget đồng hồ đếm ngược tĩnh (30:00 / 40:00) giả lập trên header, tuân thủ nguyên tắc zero-bloat của UI Standards do API/DB schema không có trường duration/countdown.

---

## 4. Lệnh kiểm tra tự động (Automated Verification)
```bash
# Chạy toàn bộ test suite frontend
npm --prefix frontend test

# Kiểm tra biên dịch TypeScript & bundle
npm --prefix frontend run build

# Kiểm tra linter
npm --prefix frontend run lint
```
