# [BUG REPORT] [ADM-032] Settings hồ sơ Admin chỉ đọc

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-ADM-032
- **Tiêu đề**: Settings hồ sơ Admin chỉ đọc
- **Phân hệ / Vai trò**: ADMIN
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-06T13:33:59.951Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
1. Đăng nhập bằng Admin cấu hình.
2. Bấm Cài đặt, chờ /admin/settings.
3. Đọc ô email và so với email Admin đăng nhập; không nhập/lưu thay đổi.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Email hiển thị đúng; không lưu hồ sơ hoặc đổi mật khẩu.

- **Thực tế (Actual Result)**:
  ```text
  Waiting for element to be located By(css selector, main input[type=email])
Wait timed out after 30200ms
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/admin/settings`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)
- **DOM Snapshot HTML**: [evidence/page-dom.html](evidence/page-dom.html)

