# [BUG REPORT] [TEA-051] Sửa điện thoại ở Cài đặt, mở lại qua menu và khôi phục

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-051
- **Tiêu đề**: Sửa điện thoại ở Cài đặt, mở lại qua menu và khôi phục
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:18:18.792Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Đăng nhập giáo viên QA riêng → mở Cài đặt → đổi điện thoại → lưu → đọc lại API → vào Dashboard bằng menu → mở lại form bằng menu, kiểm tra số đã lưu → khôi phục số cũ.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  API và form cài đặt lưu đúng trên tài khoản QA riêng.

- **Thực tế (Actual Result)**:
  ```text
  Cannot set properties of undefined (setting 'api')
  ```
- **URL tại thời điểm lỗi**: `N/A`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

