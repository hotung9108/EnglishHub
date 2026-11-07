# [BUG REPORT] [ADM-019] Danh sách học viên trong lớp đối chiếu API

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-ADM-019
- **Tiêu đề**: Danh sách học viên trong lớp đối chiếu API
- **Phân hệ / Vai trò**: ADMIN
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: PRODUCT_CANDIDATE
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-06T13:31:25.589Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
1. Setup baseClass và ghi danh Student QA bằng API.
2. Đăng nhập Admin; tìm lớp và bấm Quản lý lớp.
3. Trong Danh sách học viên, tìm đúng tên Student QA.
4. API GET members của lớp; kiểm tra có studentId đúng QA.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  UI hiển thị đúng tên; API membership đúng studentId.

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

