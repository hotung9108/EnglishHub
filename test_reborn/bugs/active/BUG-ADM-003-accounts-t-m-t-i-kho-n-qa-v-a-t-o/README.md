# [BUG REPORT] [ADM-003] Accounts tìm tài khoản QA vừa tạo

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-ADM-003
- **Tiêu đề**: Accounts tìm tài khoản QA vừa tạo
- **Phân hệ / Vai trò**: ADMIN
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: PRODUCT_CANDIDATE
- **Trạng thái**: OPEN
- **Môi trường**: http://localhost:5173
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-07T05:14:18.863Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
1. Setup API tạo Teacher QA riêng; đọc lại đúng ID/email và lưu readback.
2. Đăng nhập Admin; bấm Quản lý tài khoản.
3. Nhập toàn bộ email Teacher QA vào ô tìm kiếm trong nội dung trang; chờ tải ổn định.
4. Yêu cầu một dòng đúng email và role TEACHER; không tìm thấy thì Fail, không chọn tài khoản khác.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Một dòng đúng email và TEACHER, đối chiếu API.

- **Thực tế (Actual Result)**:
  ```text
  Tài khoản QA tồn tại trên API nhưng Accounts không tìm thấy

0 !== 1

  ```
- **URL tại thời điểm lỗi**: `http://localhost:5173/admin/accounts`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)
- **DOM Snapshot HTML**: [evidence/page-dom.html](evidence/page-dom.html)

