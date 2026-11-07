# [BUG REPORT] [ADM-015] Classes tìm và mở đúng lớp QA

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-ADM-015
- **Tiêu đề**: Classes tìm và mở đúng lớp QA
- **Phân hệ / Vai trò**: ADMIN
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: PRODUCT_CANDIDATE
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-06T13:30:22.245Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
1. Setup baseClass có Teacher QA và một Student QA đã ghi danh.
2. Đăng nhập Admin; vào Quản lý Lớp học, tìm toàn bộ tên lớp QA.
3. Bấm Quản lý lớp trên đúng thẻ; chờ tải xong.
4. Kiểm tra URL đúng classId, tên lớp và tên Teacher; lưu API chi tiết lớp để đối chiếu.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Đúng ID, tên lớp, teacher/member từ API.

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

