# [BUG REPORT] [TEA-047] Đăng xuất về login và xóa token frontend

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-047
- **Tiêu đề**: Đăng xuất về login và xóa token frontend
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T14:23:50.274Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Đăng nhập giáo viên → bấm control Đăng xuất trên sidebar → kiểm tra form login và token frontend đã xóa; không kiểm thử logout TopBar trong case này.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Form login hiển thị; eh_access_token bị xóa.

- **Thực tế (Actual Result)**:
  ```text
  Waiting for element to be located By(css selector, a.sidebar-link-logout[href="/login"])
Wait timed out after 30006ms
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/teacher/dashboard`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

