# [BUG REPORT] [ADM-041] Students khóa rồi mở khóa QA từ danh sách

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-ADM-041
- **Tiêu đề**: Students khóa rồi mở khóa QA từ danh sách
- **Phân hệ / Vai trò**: ADMIN
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: PRODUCT_CANDIDATE
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T14:02:21.209Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
1. Setup Student QA riêng, xác minh ID/email/role trong ledger và ACTIVE qua API.
2. Admin vào Học viên, tìm đúng email; chỉ tiếp tục nếu đúng một dòng và tên QA khớp. Nếu không thấy, Blocked phụ thuộc 014.
3. Bấm Khóa đúng dòng, xác nhận nếu có; API phải LOCKED và UI hiện Bị khóa.
4. Xác minh ownership lần nữa, bấm Mở khóa; API phải ACTIVE.
5. Reload danh sách, tìm lại email và xác minh Hoạt động. Nếu đã vào luồng mutation, finally khôi phục ACTIVE chỉ trên QA đã xác minh.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Đúng user chuyển LOCKED rồi ACTIVE; không tìm thấy QA thì Blocked, không dùng người khác.

- **Thực tế (Actual Result)**:
  ```text
  Expected one row action /^Mở khóa$|^Unlock$/

0 !== 1

  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/admin/students`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)
- **DOM Snapshot HTML**: [evidence/page-dom.html](evidence/page-dom.html)

