# [BUG REPORT] [TEA-022] Lọc danh sách bài theo kỹ năng Writing

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-022
- **Tiêu đề**: Lọc danh sách bài theo kỹ năng Writing
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:18:00.801Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở quản lý bài tập → chọn bộ lọc Writing → chờ card tải xong → kiểm tra kỹ năng của mọi card hiển thị.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Các card hiển thị đều thuộc Writing.

- **Thực tế (Actual Result)**:
  ```text
  Cannot set properties of undefined (setting 'api')
  ```
- **URL tại thời điểm lỗi**: `N/A`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

