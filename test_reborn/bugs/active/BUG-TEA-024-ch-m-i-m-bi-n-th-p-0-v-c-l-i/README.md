# [BUG REPORT] [TEA-024] Chấm điểm biên thấp 0 và đọc lại

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-024
- **Tiêu đề**: Chấm điểm biên thấp 0 và đọc lại
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:18:01.748Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở bài nộp Writing của học viên QA → nhập điểm 0 và nhận xét → lưu/gửi → mở lại cùng bài nộp → đối chiếu điểm UI/API.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  UI và API đều đọc lại finalScore=0.

- **Thực tế (Actual Result)**:
  ```text
  Cannot set properties of undefined (setting 'api')
  ```
- **URL tại thời điểm lỗi**: `N/A`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

