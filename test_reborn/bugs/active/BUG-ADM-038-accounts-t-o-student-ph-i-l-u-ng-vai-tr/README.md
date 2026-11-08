# [BUG REPORT] [ADM-038] Accounts tạo Student phải lưu đúng vai trò STUDENT

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-ADM-038
- **Tiêu đề**: Accounts tạo Student phải lưu đúng vai trò STUDENT
- **Phân hệ / Vai trò**: ADMIN
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: http://localhost:5173
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-07T05:23:28.509Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
1. Đăng nhập Admin; vào Quản lý tài khoản, bấm Thêm tài khoản mới.
2. Nhập QA Accounts STUDENT <tag chữ>, email qa31-<tag>-student-accounts-ui@example.invalid và mật khẩu QA hợp lệ.
3. Chọn Vai trò STUDENT, xác minh select trước khi bấm Lưu tài khoản.
4. Chờ có user theo API hoặc lỗi UI; lưu readback/ledger.
5. Kiểm tra đúng họ tên/email và role STUDENT; đây là drawer Accounts, khác wizard Học viên ở case 013.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Có tài khoản đúng email/họ tên, role STUDENT; không chỉ kiểm tra toast.

- **Thực tế (Actual Result)**:
  ```text
  Missing button /Thêm tài khoản mới|Add new account/i
Wait timed out after 30159ms
  ```
- **URL tại thời điểm lỗi**: `http://localhost:5173/admin/accounts`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)
- **DOM Snapshot HTML**: [evidence/page-dom.html](evidence/page-dom.html)

