# [BUG REPORT] [TEA-050] Mở lộ trình/buổi học của lớp

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-050
- **Tiêu đề**: Mở lộ trình/buổi học của lớp
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: http://localhost:5173
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-07T05:24:42.035Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở lớp QA → chọn Lộ trình → kiểm tra vùng nội dung buổi học/lộ trình xuất hiện.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Tab lộ trình hiển thị đúng lớp QA.

- **Thực tế (Actual Result)**:
  ```text
  Waiting for element to be located By(xpath, //main//button[starts-with(normalize-space(.),'Lộ trình')])
Wait timed out after 30197ms
  ```
- **URL tại thời điểm lỗi**: `http://localhost:5173/teacher/classes/85/progress`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

