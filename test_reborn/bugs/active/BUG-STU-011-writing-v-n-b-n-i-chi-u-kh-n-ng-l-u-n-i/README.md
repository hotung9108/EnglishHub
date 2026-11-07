# [BUG REPORT] [STU-011] Writing văn bản: đối chiếu khả năng lưu nội dung

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-STU-011
- **Tiêu đề**: Writing văn bản: đối chiếu khả năng lưu nội dung
- **Phân hệ / Vai trò**: STUDENT
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: [object Object]
- **Trạng thái**: OPEN
- **Môi trường**: http://localhost:5173
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-07T05:15:59.758Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở Writing ESSAY hợp lệ; nhập bài luận không đính kèm file, nộp bằng UI và đọc lại đúng lượt API.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  UI cho nộp text thì nội dung phải được giữ. ESSAY hiện chỉ lưu file: mất text ghi CONTRACT_GAP_REVIEW để review FE/BE, không tính Pass.

- **Thực tế (Actual Result)**:
  ```text
  Writing UI offers text-only submission, but WRITING/ESSAY API stores files and did not retain the essay. Review the FE/BE contract; UI success alone is not a pass.
  ```
- **URL tại thời điểm lỗi**: `http://localhost:5173/student/submissions/1439`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

