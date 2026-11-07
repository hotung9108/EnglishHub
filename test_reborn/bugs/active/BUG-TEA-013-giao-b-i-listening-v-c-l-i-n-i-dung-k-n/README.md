# [BUG REPORT] [TEA-013] Giao bài Listening và đọc lại nội dung/kỹ năng

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-013
- **Tiêu đề**: Giao bài Listening và đọc lại nội dung/kỹ năng
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: http://localhost:5173
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-07T05:16:52.965Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở Giao bài mới → chọn lớp QA và LISTENING → nhập nội dung hợp lệ, câu hỏi và đáp án → xuất bản → tìm lại bài → kiểm tra API và form chỉnh sửa.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  PUBLISHED, module LISTENING và transcript đúng.

- **Thực tế (Actual Result)**:
  ```text
  Waiting for element to be located By(css selector, [placeholder="listening_track_01.mp3"])
Wait timed out after 30114ms
  ```
- **URL tại thời điểm lỗi**: `http://localhost:5173/teacher/assignments/create`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

