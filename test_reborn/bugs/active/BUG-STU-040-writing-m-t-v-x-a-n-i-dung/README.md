# [BUG REPORT] [STU-040] Writing: đếm từ và xóa nội dung

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-STU-040
- **Tiêu đề**: Writing: đếm từ và xóa nội dung
- **Phân hệ / Vai trò**: STUDENT
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: [object Object]
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:20:23.757Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Nhập 5 từ vào editor, kiểm tra bộ đếm rồi xóa về rỗng.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Đếm 5 rồi 0; nội dung chưa bị nộp.

- **Thực tế (Actual Result)**:
  ```text
  Cannot read properties of undefined (reading 'api')
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/student/dashboard`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

