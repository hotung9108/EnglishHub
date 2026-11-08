# [BUG REPORT] [STU-026] Reading MCQ: đáp án sai, điểm 0

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-STU-026
- **Tiêu đề**: Reading MCQ: đáp án sai, điểm 0
- **Phân hệ / Vai trò**: STUDENT
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: [object Object]
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-06T13:30:01.295Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Chọn đáp án 2 trong câu MCQ, nộp qua UI, đọc lại đúng lượt.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Đáp án 2 lưu đúng questionId; module/submission đã nộp và auto score 0/10.

- **Thực tế (Actual Result)**:
  ```text
  This editor case needs an unsubmitted fixture. Re-run this case with --fresh-fixtures.
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/student/dashboard`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

