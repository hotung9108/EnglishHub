# [BUG REPORT] [ADM-039] Accounts tìm tài khoản có sẵn độc lập bước tạo

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-ADM-039
- **Tiêu đề**: Accounts tìm tài khoản có sẵn độc lập bước tạo
- **Phân hệ / Vai trò**: ADMIN
- **Giai đoạn phát hiện (Phase)**: login
- **Phân loại lỗi**: AUTH_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T03:17:41.471Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
1. API chỉ đọc trang đầu danh sách tài khoản để chọn một Teacher/Student có sẵn, loại toàn bộ user do run hiện tại tạo theo ledger. Không tạo fixture user.
2. Đăng nhập Admin; vào Quản lý tài khoản.
3. Tìm email đầy đủ của tài khoản đã chọn; chờ dòng đúng email và kiểm tra họ tên khớp.
4. Xóa từ khóa, tìm lại bằng họ tên; trong kết quả phải có dòng đúng email/tên tài khoản đó.
5. Chỉ đọc, không sửa/khóa. Pass chỉ chứng minh search cơ bản trên dữ liệu có sẵn; không thay kết quả case 003 về tài khoản mới.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Tìm được đúng tài khoản có sẵn; không tạo/sửa/khóa tài khoản.

- **Thực tế (Actual Result)**:
  ```text
  Expected admin dashboard after login
Wait timed out after 30185ms
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/login`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)
- **DOM Snapshot HTML**: [evidence/page-dom.html](evidence/page-dom.html)

