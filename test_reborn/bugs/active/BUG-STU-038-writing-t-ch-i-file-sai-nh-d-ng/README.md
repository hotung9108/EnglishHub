# [BUG REPORT] [STU-038] Writing: từ chối file sai định dạng

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-STU-038
- **Tiêu đề**: Writing: từ chối file sai định dạng
- **Phân hệ / Vai trò**: STUDENT
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: [object Object]
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T08:09:56.138Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở editor, chọn file TXT qua input tải bài.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Hiện lỗi chỉ nhận PDF/DOCX, không gắn file TXT; lượt vẫn IN_PROGRESS.

- **Thực tế (Actual Result)**:
  ```text
  invalid argument: File not found : d:\ki7\prj1\BTL_PRJ1\EnglishHub\test_reborn\fixtures\qa30-invalid-upload.txt
  (Session info: chrome=156.0.8078.80)
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/student/assignments/writing/2906?submissionId=2590`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

