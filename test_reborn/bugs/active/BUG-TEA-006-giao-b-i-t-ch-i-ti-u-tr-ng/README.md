# [BUG REPORT] [TEA-006] Giao bài: từ chối tiêu đề trống

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-006
- **Tiêu đề**: Giao bài: từ chối tiêu đề trống
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:17:51.559Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở Giao bài tập mới → chọn lớp QA → để trống tiêu đề → Giao bài tập.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Báo Title cannot be empty; vẫn ở form tạo bài.

- **Thực tế (Actual Result)**:
  ```text
  Cannot read properties of undefined (reading 'className')
  ```
- **URL tại thời điểm lỗi**: `N/A`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

