# [BUG REPORT] [ADM-033] Settings bảo mật có trường mật khẩu

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-ADM-033
- **Tiêu đề**: Settings bảo mật có trường mật khẩu
- **Phân hệ / Vai trò**: ADMIN
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-06T13:34:34.809Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
1. Đăng nhập Admin; vào Cài đặt → Bảo mật tài khoản.
2. Chờ tải; yêu cầu ít nhất hai input kiểu password, giá trị rỗng.
3. Không nhập/gửi mật khẩu; case chỉ xác minh form hiện diện.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Có input password được che; không gửi đổi mật khẩu.

- **Thực tế (Actual Result)**:
  ```text
  Missing button /^Bảo mật tài khoản$|^Account Security$/
Wait timed out after 30095ms
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/admin/settings`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)
- **DOM Snapshot HTML**: [evidence/page-dom.html](evidence/page-dom.html)

