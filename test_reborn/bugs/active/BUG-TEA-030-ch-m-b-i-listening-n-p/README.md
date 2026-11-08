# [BUG REPORT] [TEA-030] Chấm bài Listening đã nộp

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-030
- **Tiêu đề**: Chấm bài Listening đã nộp
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:18:06.048Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở bài nộp listening của học viên QA → nhập điểm 5 và nhận xét → lưu/gửi → mở lại cùng bài nộp → đối chiếu điểm UI/API.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Điểm Listening UI/API bằng 5.

- **Thực tế (Actual Result)**:
  ```text
  Cannot set properties of undefined (setting 'api')
  ```
- **URL tại thời điểm lỗi**: `N/A`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

