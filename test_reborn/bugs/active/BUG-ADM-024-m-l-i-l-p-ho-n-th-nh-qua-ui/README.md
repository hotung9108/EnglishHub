# [BUG REPORT] [ADM-024] Mở lại lớp đã hoàn thành qua UI

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-ADM-024
- **Tiêu đề**: Mở lại lớp đã hoàn thành qua UI
- **Phân hệ / Vai trò**: ADMIN
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: PRODUCT_CANDIDATE
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-06T13:32:00.932Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
1. Setup archiveClass COMPLETED và xác minh ownership.
2. Đăng nhập Admin; vào Quản lý Lớp học → Kho Lưu Trữ, tìm đúng tên QA.
3. Bấm Mở lại đúng dòng, xác nhận nếu có; API chờ ACTIVE.
4. Về danh sách lớp, tìm và mở Quản lý lớp để xác minh lớp hoạt động.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  API ACTIVE; lớp tìm được ở danh sách lớp.

- **Thực tế (Actual Result)**:
  ```text
  Không thấy thẻ lớp QA31-archiveClass-2be98c1e51c0
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/admin/classes`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)
- **DOM Snapshot HTML**: [evidence/page-dom.html](evidence/page-dom.html)

