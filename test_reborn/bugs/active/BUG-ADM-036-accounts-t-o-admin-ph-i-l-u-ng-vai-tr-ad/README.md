# [BUG REPORT] [ADM-036] Accounts tạo Admin phải lưu đúng vai trò ADMIN

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-ADM-036
- **Tiêu đề**: Accounts tạo Admin phải lưu đúng vai trò ADMIN
- **Phân hệ / Vai trò**: ADMIN
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: http://localhost:5173
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-07T05:22:11.378Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
1. Đăng nhập Admin; vào Quản lý tài khoản, bấm Thêm tài khoản mới.
2. Chờ drawer; nhập tên QA Accounts ADMIN <tag chữ>, email qa31-<tag>-admin-accounts-ui@example.invalid và mật khẩu QA hợp lệ.
3. Trong Vai trò chọn ADMIN; kiểm tra value của select vẫn là ADMIN trước khi lưu.
4. Bấm Lưu tài khoản đúng drawer; chờ API readback tìm được email hoặc UI hiển thị lỗi lưu.
5. API tìm đúng email vừa yêu cầu; lưu ID/tên/role thực tế và thông báo UI. Có tài khoản mới thì ghi ledger kể cả khi role sai.
6. Yêu cầu có user đúng họ tên/email và role ADMIN theo yêu cầu nghiệp vụ người dùng. Nếu thành STUDENT hoặc bị từ chối thì Fail; không gọi API tạo Admin thay UI để làm test Pass.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Có tài khoản đúng email/họ tên với role ADMIN; không âm thầm tạo STUDENT.

- **Thực tế (Actual Result)**:
  ```text
  Missing button /Thêm tài khoản mới|Add new account/i
Wait timed out after 30045ms
  ```
- **URL tại thời điểm lỗi**: `http://localhost:5173/admin/accounts`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)
- **DOM Snapshot HTML**: [evidence/page-dom.html](evidence/page-dom.html)

