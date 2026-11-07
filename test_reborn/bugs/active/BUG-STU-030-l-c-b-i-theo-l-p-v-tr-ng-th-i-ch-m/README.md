# [BUG REPORT] [STU-030] Lọc bài theo lớp và trạng thái đã chấm

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-STU-030
- **Tiêu đề**: Lọc bài theo lớp và trạng thái đã chấm
- **Phân hệ / Vai trò**: STUDENT
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: [object Object]
- **Trạng thái**: OPEN
- **Môi trường**: http://localhost:5173
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-07T05:20:02.346Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Lọc đúng lớp QA30, tìm bài đã chấm; chọn Đã có kết quả, rồi Chưa bắt đầu.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Bài GRADED xuất hiện đúng tab kết quả và không xuất hiện trong tab chưa bắt đầu.

- **Thực tế (Actual Result)**:
  ```text
  Waiting for element to be located By(xpath, //main//button[contains(normalize-space(.),'Chưa bắt đầu')])
Wait timed out after 30108ms
  ```
- **URL tại thời điểm lỗi**: `http://localhost:5173/student/assignments`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

