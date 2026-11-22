# Hướng Dẫn Kiểm Thử: [FE-94] Tích Hợp Rich Text Toolbar Cho Bài Thi Writing

- **Người thực hiện**: Trần Tiến Sơn (@Maloque18705 - Frontend Developer Primary)
- **Thẻ Trello**: `[FE-94] Tích hợp Rich Text Toolbar Hoạt Động Thật Cho Bài Thi Writing` (`6af7e31f23c8d470f5afffdd`)
- **Nhánh phát triển**: `feat/FE-94-writing-rich-text-toolbar`
- **Người nghiệm thu**: Nguyễn Văn Tú (@zawntsu / Zawn-Tsu - Tester)

---

## 1. Mục tiêu kiểm thử
Xác nhận thanh công cụ định dạng Rich Text Toolbar trong trang làm bài thi Viết (`/student/assignments/writing/:id`) hoạt động mượt mà, đúng chuẩn nghiệp vụ:
1. Định dạng văn bản hoạt động: In đậm, In nghiêng, Gạch chân, Danh sách dấu đầu dòng, Danh sách số, Căn giữa/Căn trái.
2. Phím tắt hoạt động: `Ctrl+B`, `Ctrl+I`, `Ctrl+U`, `Ctrl+Z`, `Ctrl+Y`.
3. Chế độ Xem trước định dạng (Preview tab) hiển thị đúng Markdown được biên dịch.
4. Bộ đếm từ real-time hoạt động chuẩn xác, không bị tính sai do các ký tự cú pháp markdown.
5. Khi nộp bài hoặc lưu bản nháp, định dạng được bảo lưu nguyên vẹn.

---

## 2. Kịch bản kiểm thử chi tiết

### Kịch bản 1: Định dạng văn bản bằng nút bấm trên Toolbar
1. Đăng nhập với tài khoản học viên (`student@example.com` / `Student@123`).
2. Vào một bài tập có kỹ năng Viết (hoặc truy cập `/student/assignments/writing/12`).
3. Gõ nội dung văn bản vào ô soạn thảo.
4. Bôi đen một cụm từ và bấm nút **In đậm (B)** -> Cụm từ được bọc `**...**`. Bấm lại lần nữa -> Cụm từ được mở bọc về bình thường.
5. Tương tự kiểm tra với nút **In nghiêng (I)**, **Gạch chân (U)**.
6. Bôi đen nhiều dòng và bấm **Danh sách dấu đầu dòng**, **Danh sách số** -> Các dòng được thêm tiền tố tương ứng.
7. Bấm **Căn giữa** -> Đoạn văn được căn giữa qua thẻ căn lề chuẩn.

### Kịch bản 2: Phím tắt bàn phím (Keyboard Shortcuts)
1. Trong ô soạn thảo, bôi đen chữ và nhấn `Ctrl+B` -> Chữ đổi sang in đậm.
2. Bôi đen chữ và nhấn `Ctrl+I` -> Chữ đổi sang in nghiêng.
3. Bôi đen chữ và nhấn `Ctrl+U` -> Chữ đổi sang gạch chân.
4. Nhấn `Ctrl+Z` (Undo) -> Hoàn tác thao tác trước đó.
5. Nhấn `Ctrl+Y` hoặc `Ctrl+Shift+Z` (Redo) -> Phục hồi thao tác vừa hoàn tác.

### Kịch bản 3: Tab "Xem trước" (Preview tab)
1. Nhập văn bản có định dạng tiêu đề `###`, in đậm `**`, in nghiêng `*`, danh sách `- `.
2. Bấm vào tab **"Xem trước"** trên góc phải Toolbar.
3. Kiểm tra xem nội dung được hiển thị dưới dạng văn bản định dạng đẹp mắt (MarkdownView).
4. Các nút công cụ trên Toolbar được làm mờ/vô hiệu hóa trong chế độ xem trước.
5. Bấm lại tab **"Soạn thảo"** -> Trở về ô nhập liệu bình thường.

### Kịch bản 4: Bộ đếm từ và Lưu nháp / Nộp bài
1. Quan sát thẻ đếm từ ở góc trên ô nhập liệu: Thẻ đếm từ cập nhật số từ thực tế, loại trừ các ký tự cú pháp (`**`, `*`, `<u>`, v.v.).
2. Bấm **"Lưu bản nháp"** -> Hiện thông báo thành công màu xanh "Đã lưu bản nháp!".
3. Tải lại trang (F5) -> Toàn bộ văn bản và định dạng vẫn được khôi phục nguyên vẹn.
4. Nộp bài (`Nộp bài (Submit)`) -> Hệ thống đóng gói bài làm thành tệp đính kèm và gửi lên hệ thống thành công.
