# [BUG REPORT] [TEA-016] Xem thử Reading, đóng và giữ nội dung editor

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-016
- **Tiêu đề**: Xem thử Reading, đóng và giữ nội dung editor
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:17:57.255Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở Giao bài mới → chọn READING → nhập nội dung đánh dấu QA → xem thử giao diện học viên → kiểm tra modal → đóng → kiểm tra nội dung editor còn nguyên.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Modal hiển thị passage đúng.

- **Thực tế (Actual Result)**:
  ```text
  Cannot set properties of undefined (setting 'api')
  ```
- **URL tại thời điểm lỗi**: `N/A`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

