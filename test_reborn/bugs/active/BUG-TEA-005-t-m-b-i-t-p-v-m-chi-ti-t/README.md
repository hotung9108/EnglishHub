# [BUG REPORT] [TEA-005] Tìm bài tập và mở chi tiết

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-005
- **Tiêu đề**: Tìm bài tập và mở chi tiết
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:17:50.970Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở Bài tập → tìm tiêu đề bài QA → chờ đúng bài mẫu xuất hiện (giới hạn chờ dữ liệu riêng) → mở chi tiết.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Trang chi tiết hiển thị đúng tiêu đề được chọn.

- **Thực tế (Actual Result)**:
  ```text
  Cannot read properties of undefined (reading 'assignmentTitle')
  ```
- **URL tại thời điểm lỗi**: `N/A`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

