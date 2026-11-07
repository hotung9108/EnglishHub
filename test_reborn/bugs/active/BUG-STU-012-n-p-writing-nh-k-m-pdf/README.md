# [BUG REPORT] [STU-012] Nộp Writing đính kèm PDF

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-STU-012
- **Tiêu đề**: Nộp Writing đính kèm PDF
- **Phân hệ / Vai trò**: STUDENT
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: [object Object]
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-06T13:28:32.490Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở Writing ESSAY, chọn PDF mẫu, kiểm tra tên file rồi nộp qua UI.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Module/submission đã nộp và tài liệu READY trong API; không yêu cầu API lưu text của ESSAY.

- **Thực tế (Actual Result)**:
  ```text
  This editor case needs an unsubmitted fixture. Re-run this case with --fresh-fixtures.
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/student/dashboard`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

