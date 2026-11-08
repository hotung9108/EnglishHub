# [BUG REPORT] [TEA-011] Giao bài Speaking và đọc lại nội dung/kỹ năng

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-011
- **Tiêu đề**: Giao bài Speaking và đọc lại nội dung/kỹ năng
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:17:54.390Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở Giao bài mới → chọn lớp QA và SPEAKING → nhập nội dung hợp lệ → xuất bản → tìm lại bài → kiểm tra API và form chỉnh sửa.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  PUBLISHED, module SPEAKING, instructions và form edit đọc lại đúng.

- **Thực tế (Actual Result)**:
  ```text
  Cannot set properties of undefined (setting 'api')
  ```
- **URL tại thời điểm lỗi**: `N/A`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

