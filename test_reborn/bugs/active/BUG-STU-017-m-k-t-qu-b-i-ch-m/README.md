# [BUG REPORT] [STU-017] Mở kết quả bài đã chấm

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-STU-017
- **Tiêu đề**: Mở kết quả bài đã chấm
- **Phân hệ / Vai trò**: STUDENT
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: [object Object]
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-06T13:28:54.299Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Từ đúng dòng Bảng điểm, bấm xem kết quả bài fixture.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Đúng submissionId, tiêu đề và ô điểm 7.5.

- **Thực tế (Actual Result)**:
  ```text
  QA30 data wait: result score loaded
Wait timed out after 15079ms
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/student/submissions/2580`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

