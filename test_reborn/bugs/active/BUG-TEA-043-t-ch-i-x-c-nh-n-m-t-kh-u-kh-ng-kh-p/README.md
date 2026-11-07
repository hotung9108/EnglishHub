# [BUG REPORT] [TEA-043] Từ chối xác nhận mật khẩu không khớp

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-043
- **Tiêu đề**: Từ chối xác nhận mật khẩu không khớp
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:18:14.265Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Đăng nhập giáo viên QA riêng → mở Bảo mật & Mật khẩu → nhập mật khẩu hiện tại/mới/xác nhận không khớp → kiểm tra thông báo từ chối.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Thông báo không khớp, không đổi mật khẩu.

- **Thực tế (Actual Result)**:
  ```text
  Cannot set properties of undefined (setting 'api')
  ```
- **URL tại thời điểm lỗi**: `N/A`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

