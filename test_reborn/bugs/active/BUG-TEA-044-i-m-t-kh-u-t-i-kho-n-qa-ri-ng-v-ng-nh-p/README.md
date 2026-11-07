# [BUG REPORT] [TEA-044] Đổi mật khẩu tài khoản QA riêng và đăng nhập lại

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-044
- **Tiêu đề**: Đổi mật khẩu tài khoản QA riêng và đăng nhập lại
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:18:14.802Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Đăng nhập giáo viên QA riêng → mở Bảo mật & Mật khẩu → nhập mật khẩu hiện tại/mới/xác nhận khớp nhau → lưu → kiểm tra đăng nhập bằng mật khẩu mới → khôi phục mật khẩu gốc.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Mật khẩu mới login được; khôi phục mật khẩu gốc trong finally.

- **Thực tế (Actual Result)**:
  ```text
  Cannot set properties of undefined (setting 'api')
  ```
- **URL tại thời điểm lỗi**: `N/A`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

