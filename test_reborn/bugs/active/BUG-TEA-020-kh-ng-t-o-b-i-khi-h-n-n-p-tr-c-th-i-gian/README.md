# [BUG REPORT] [TEA-020] Không tạo bài khi hạn nộp trước thời gian mở

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-020
- **Tiêu đề**: Không tạo bài khi hạn nộp trước thời gian mở
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:17:59.657Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở form tạo bài QA → nhập tiêu đề/nội dung → đặt hạn nộp trước ngày mở → giao bài → kiểm tra lỗi và API không có bài mới.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Ở lại form, báo lỗi, không tạo assignment.

- **Thực tế (Actual Result)**:
  ```text
  Cannot set properties of undefined (setting 'api')
  ```
- **URL tại thời điểm lỗi**: `N/A`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

