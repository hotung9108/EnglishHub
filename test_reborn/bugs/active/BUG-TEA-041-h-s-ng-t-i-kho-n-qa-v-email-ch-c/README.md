# [BUG REPORT] [TEA-041] Hồ sơ đúng tài khoản QA và email chỉ đọc

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-041
- **Tiêu đề**: Hồ sơ đúng tài khoản QA và email chỉ đọc
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:18:12.819Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Đăng nhập giáo viên QA riêng → mở hồ sơ → đối chiếu email với API users/me → kiểm tra email chỉ đọc.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Email khớp API users/me và readonly.

- **Thực tế (Actual Result)**:
  ```text
  Cannot set properties of undefined (setting 'api')
  ```
- **URL tại thời điểm lỗi**: `N/A`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

