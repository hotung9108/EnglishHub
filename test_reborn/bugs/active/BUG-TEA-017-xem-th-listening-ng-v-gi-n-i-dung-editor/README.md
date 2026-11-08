# [BUG REPORT] [TEA-017] Xem thử Listening, đóng và giữ nội dung editor

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-017
- **Tiêu đề**: Xem thử Listening, đóng và giữ nội dung editor
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T14:04:39.204Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở Giao bài mới → chọn LISTENING → nhập nội dung đánh dấu QA → xem thử giao diện học viên → kiểm tra modal → đóng → kiểm tra nội dung editor còn nguyên.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Modal hiển thị tiêu đề audio; đóng modal giữ nguyên transcript trong editor.

- **Thực tế (Actual Result)**:
  ```text
  Waiting for element to be located By(css selector, [placeholder="listening_track_01.mp3"])
Wait timed out after 30068ms
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/teacher/assignments/create`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

