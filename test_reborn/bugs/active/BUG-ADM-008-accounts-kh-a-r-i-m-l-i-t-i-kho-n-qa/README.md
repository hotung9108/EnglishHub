# [BUG REPORT] [ADM-008] Accounts khóa rồi mở lại tài khoản QA

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-ADM-008
- **Tiêu đề**: Accounts khóa rồi mở lại tài khoản QA
- **Phân hệ / Vai trò**: ADMIN
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: PRODUCT_CANDIDATE
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T13:56:03.625Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
1. Setup Teacher QA riêng; xác minh ID/email/role thuộc ledger.
2. Đăng nhập Admin; vào Quản lý tài khoản, tìm đúng email. Không có dòng thì Blocked phụ thuộc 003.
3. Bấm Khóa trên đúng dòng, xác nhận nếu có; API chờ trạng thái LOCKED.
4. Tìm lại và xác minh đúng QA; bấm Mở khóa, xác nhận nếu có; API chờ ACTIVE.
5. Trong finally của luồng khóa, chỉ khôi phục ACTIVE cho QA đã xác minh. Không thao tác người khác để chạy tiếp.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Hai thay đổi lưu thật; finally khôi phục ACTIVE chỉ trên QA đã xác minh.

- **Thực tế (Actual Result)**:
  ```text
  Expected one row action /Mở khóa|Unlock/

0 !== 1

  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/admin/accounts`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)
- **DOM Snapshot HTML**: [evidence/page-dom.html](evidence/page-dom.html)

