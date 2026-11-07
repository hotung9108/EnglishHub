# [BUG REPORT] [STU-015] Nộp Listening câu trả lời ngắn

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-STU-015
- **Tiêu đề**: Nộp Listening câu trả lời ngắn
- **Phân hệ / Vai trò**: STUDENT
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: [object Object]
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-06T13:28:48.672Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở Listening, điền daily practice và nộp.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Đáp án đúng được lưu, module/submission đã nộp. Không đánh giá chất lượng audio.

- **Thực tế (Actual Result)**:
  ```text
  This editor case needs an unsubmitted fixture. Re-run this case with --fresh-fixtures.
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/student/dashboard`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

