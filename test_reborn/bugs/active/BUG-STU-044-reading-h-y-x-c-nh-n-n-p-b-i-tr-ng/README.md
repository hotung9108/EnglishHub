# [BUG REPORT] [STU-044] Reading: hủy xác nhận nộp bài trắng

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-STU-044
- **Tiêu đề**: Reading: hủy xác nhận nộp bài trắng
- **Phân hệ / Vai trò**: STUDENT
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: [object Object]
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-06T13:33:11.051Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở MCQ mới; chưa chọn đáp án, bấm Hoàn thành & Nộp bài; hủy hộp xác nhận.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Có cảnh báo chưa trả lời; vẫn ở editor, cùng lượt IN_PROGRESS, không tạo lượt/nộp mới.

- **Thực tế (Actual Result)**:
  ```text
  Waiting for alert to be present
Wait timed out after 5020ms
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/student/assignments/reading/2915?submissionId=2601`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

