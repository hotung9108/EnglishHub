# [BUG REPORT] [ADM-020] Mở hồ sơ từ học viên trong lớp

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-ADM-020
- **Tiêu đề**: Mở hồ sơ từ học viên trong lớp
- **Phân hệ / Vai trò**: ADMIN
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: PRODUCT_CANDIDATE
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-06T13:31:31.824Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
1. Setup baseClass có Student QA; API đọc danh tính Student và lưu readback.
2. Đăng nhập Admin; vào Quản lý Lớp học, tìm lớp QA và bấm Quản lý lớp.
3. Tại Danh sách học viên, tìm đúng tên QA rồi bấm Hồ sơ trên chính dòng đó.
4. Chờ tải; kiểm tra URL /admin/students/<studentId>, email và tên đúng Student QA.
5. Sai danh tính thì Fail và dừng; không bấm Khóa/Đặt lại mật khẩu.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  URL đúng Student ID; hồ sơ đúng email/họ tên, không fallback người khác.

- **Thực tế (Actual Result)**:
  ```text
  Không thấy thẻ lớp QA31-baseClass-2be98c1e51c0
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/admin/classes`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)
- **DOM Snapshot HTML**: [evidence/page-dom.html](evidence/page-dom.html)

