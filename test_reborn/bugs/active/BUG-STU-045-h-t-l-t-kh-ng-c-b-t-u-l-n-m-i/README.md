# [BUG REPORT] [STU-045] Hết lượt: không được bắt đầu lần mới

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-STU-045
- **Tiêu đề**: Hết lượt: không được bắt đầu lần mới
- **Phân hệ / Vai trò**: STUDENT
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: [object Object]
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:20:40.793Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở Overview bài đã chấm có maxSubmissions=1 và một lượt đã hoàn tất.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Số lượt khớp API, không còn nút bắt đầu được bật; không tạo thêm lượt.

- **Thực tế (Actual Result)**:
  ```text
  Cannot read properties of undefined (reading 'className')
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/student/classes`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

