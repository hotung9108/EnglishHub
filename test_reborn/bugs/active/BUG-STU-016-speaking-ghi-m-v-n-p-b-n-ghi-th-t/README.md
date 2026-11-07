# [BUG REPORT] [STU-016] Speaking: ghi âm và nộp bản ghi thật

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-STU-016
- **Tiêu đề**: Speaking: ghi âm và nộp bản ghi thật
- **Phân hệ / Vai trò**: STUDENT
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: [object Object]
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-06T13:28:51.597Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Bắt đầu/dừng recorder, bấm Nộp bài; đối chiếu trạng thái và audio API.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Bài đã nộp và audioStorageKey/audioUploadStatus READY. Recorder mô phỏng không được tính Pass.

- **Thực tế (Actual Result)**:
  ```text
  This editor case needs an unsubmitted fixture. Re-run this case with --fresh-fixtures.
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/student/dashboard`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

