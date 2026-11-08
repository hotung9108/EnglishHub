# [BUG REPORT] [TEA-002] Danh sách lớp: tìm kiếm đúng lớp và không có kết quả

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-002
- **Tiêu đề**: Danh sách lớp: tìm kiếm đúng lớp và không có kết quả
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:17:48.874Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở Lớp học → tìm tên lớp QA → tìm chuỗi không tồn tại → tìm lại lớp QA.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Một lớp đúng tên; tìm chuỗi không tồn tại trả danh sách rỗng; xóa bộ lọc khôi phục kết quả.

- **Thực tế (Actual Result)**:
  ```text
  Cannot read properties of undefined (reading 'className')
  ```
- **URL tại thời điểm lỗi**: `N/A`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

