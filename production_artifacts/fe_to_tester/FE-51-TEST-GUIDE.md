# [FE-51] Hướng Dẫn Kiểm Thử Hiển Thị Đoạn Text Thực Cho Highlight Chấm Điểm (Annotation Test Guide)

## 1. Thông Tin Chung
- **Ticket / Task ID**: [FE-51] (Khắc phục BUG-22)
- **Role thực hiện**: `fe-primary` (Assignee: `Maloque18705`)
- **Target Role tiếp nhận**: `tester` (Assignee: `Zawn-Tsu`)
- **Mục tiêu**: Xác thực việc hiển thị đoạn văn bản thực tế được trích xuất từ bài làm của học sinh (thay thế chuỗi kỹ thuật thô `[start-end]`), bảo đảm an toàn dữ liệu không crash khi offset không hợp lệ, triệt tiêu lỗi cắt chuỗi JSON serialized (`d":"goo` / `mini-2`), và xác thực căn chỉnh chính xác khi từ lặp lại nhiều lần.

---

## 2. Phạm Vi Kiểm Thử (Test Scope)

1. **Giao diện Kết quả Học sinh (`StudentSubmissionResult.tsx`)**:
   - Khung chi tiết điểm chữa lỗi (*"Đoạn văn bản gốc" / "Original Segment"*): Hiển thị đoạn text thực trích từ bài làm của học sinh theo `startOffset`/`endOffset`.
   - **Tuyệt đối không** còn xuất hiện chuỗi kỹ thuật vô nghĩa như `"Đoạn ký tự [10 - 12]"`.
   - Khi gặp trường hợp offset không hợp lệ (ngoài phạm vi văn bản, âm, hoặc `end <= start`), giao diện hiển thị fallback thân thiện `"Không xác định được đoạn văn bản"` (`t('studentResult.segmentUnavailable')`), không crash ứng dụng.

2. **Giao diện Giáo viên Chấm bài (`TeacherSubmissionDetails.tsx`)**:
   - Đối với bài nộp Speaking có dữ liệu `aiTranscript`: Tiện ích `extractTranscriptText` tự động giải mã chuỗi JSON và ghép thành bài nói thực tế.
   - Các đoạn trích trong thẻ chữa lỗi hiển thị chính xác các từ nói của học sinh (ví dụ: `"is have"`, `"people"`, `"like"`).
   - **Triệt tiêu hoàn toàn** lỗi hiển thị mảnh chuỗi JSON kỹ thuật thô như `d":"goo` và `mini-2`.

3. **Căn chỉnh từ trùng lặp (Speaking Multiple Occurrences)**:
   - Khi bài nói có các từ giống nhau ở nhiều câu (ví dụ từ `"is"` ở câu 1 và câu 3), hệ thống định vị độc lập:
     - Lỗi 1 trỏ đúng vào `"is"` ở câu 1 (*"My family **is** have..."*).
     - Lỗi 2 trỏ đúng vào `"is"` ở câu 3 (*"My father **is** work..."*).
     - Hai lỗi không bị gộp đè lên nhau.

4. **Ngôn ngữ nhận xét AI**:
   - Các nhận xét trong mục *"Nhận xét từ hệ thống AI"* và *"Lời khuyên/Gợi ý"* đều là **Tiếng Việt 100%**.

---

## 3. Kịch Bản Kiểm Thử Chi Tiết (Test Scenarios)

### Kịch bản 1: Kiểm tra giao diện Giáo viên xem bài nộp Speaking có nhiều annotation
- **Dữ liệu**: Bài nộp mẫu tại đường dẫn `/teacher/assignments/129/submissions/13` (Submission 270 / Module 933 / Answer 3463).
- **Thao tác**:
  1. Đăng nhập bằng tài khoản Giáo viên.
  2. Truy cập vào URL `/teacher/assignments/129/submissions/13`.
  3. Chọn module thi Nói (**SPEAKING**) và quan sát danh sách các điểm sửa lỗi (Segment Annotations) ở cột bên phải.
- **Kết quả kỳ vọng**:
  - Không có bất kỳ thẻ nào hiển thị chuỗi kỹ thuật `d":"goo`, `mini-2` hay `d":7`.
  - Annotation #810 hiển thị đoạn trích: `"peoples"` ➡️ Gợi ý: `people`.
  - Annotation #811 hiển thị đoạn trích: `"is"` ➡️ Nhận xét về lỗi *"My family is have"*.
  - Annotation #812 hiển thị đoạn trích: `"is"` ở câu 3 (*"My father is work"*) tại offset `[88 - 90]`.
  - Annotation #813 hiển thị đoạn trích: `"like"`.
  - Tất cả các trích dẫn đều nằm trong dấu ngoặc kép chuẩn `“...”`.

---

### Kịch bản 2: Kiểm tra giao diện Học sinh xem kết quả bài nộp Writing / Speaking
- **Dữ liệu**: Học sinh truy cập trang xem kết quả bài nộp `/student/submissions/:id`.
- **Thao tác**:
  1. Đăng nhập bằng tài khoản Học sinh.
  2. Mở bài làm đã được chấm có annotation được giáo viên duyệt (`ACCEPTED`).
  3. Bấm chọn lần lượt các điểm chữa lỗi trong danh sách.
- **Kết quả kỳ vọng**:
  - Tại ô *"Đoạn văn bản gốc (Original Segment)"*: Hiển thị đúng từ/cụm từ học sinh đã làm.
  - Không còn dòng chữ thô `"Đoạn ký tự [start-end]"`.
  - Khi bấm chọn giữa các chip lỗi khác nhau, nội dung đoạn văn bản gốc và gợi ý sửa thay đổi mượt mà.

---

### Kịch bản 3: Kiểm tra khả năng chịu lỗi (Resilience / Edge Cases)
- **Dữ liệu**: Bài làm có annotation giả lập lỗi offset:
  - Trường hợp 1: `startOffset: -10, endOffset: 5`
  - Trường hợp 2: `startOffset: 1000, endOffset: 2000` (vượt quá độ dài bài làm)
  - Trường hợp 3: `startOffset: 20, endOffset: 20` (end <= start)
- **Kết quả kỳ vọng**:
  - Ứng dụng không bị crash (không gặp lỗi `RangeError` hay `TypeError`).
  - Hiển thị văn bản thay thế an toàn: `"Không xác định được đoạn văn bản"` (hoặc `"Text segment unavailable"` nếu giao diện tiếng Anh).

---

## 4. Lệnh Kiểm Thử Tự Động (Automated Test Execution)

Tester có thể chạy ngay bộ kiểm thử tự động trên máy hoặc terminal:

```bash
# 1. Chạy toàn bộ 182 tests Frontend (bao gồm unit tests của annotation snippet)
npm --prefix frontend test

# 2. Chạy riêng bộ test trích xuất snippet và giải mã transcript
npm --prefix frontend test -- src/api/__tests__/annotationSnippet.test.ts

# 3. Kiểm tra kiểm thử tự động của AI Service trong container
docker exec englishhub-ai-service pytest tests/test_speaking_api.py -v

# 4. Kiểm tra build production không lỗi
npm --prefix frontend run build
```
