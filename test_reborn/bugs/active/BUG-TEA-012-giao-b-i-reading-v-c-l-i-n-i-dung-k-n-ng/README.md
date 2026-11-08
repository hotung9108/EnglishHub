# [BUG REPORT] [TEA-012] Giao bài Reading và đọc lại nội dung/kỹ năng

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-012
- **Tiêu đề**: Giao bài Reading và đọc lại nội dung/kỹ năng
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: http://localhost:5173
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-07T05:16:13.732Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở Giao bài mới → chọn lớp QA và READING → nhập nội dung hợp lệ, câu hỏi và đáp án → xuất bản → tìm lại bài → kiểm tra API và form chỉnh sửa.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  PUBLISHED, module READING và instructions đúng.

- **Thực tế (Actual Result)**:
  ```text
  Waiting for element to be located By(xpath, //button[normalize-space(.)='Thêm đoạn văn mới' or normalize-space(.)='Add Paragraph'])
Wait timed out after 30165ms
  ```
- **URL tại thời điểm lỗi**: `http://localhost:5173/teacher/assignments/create`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

