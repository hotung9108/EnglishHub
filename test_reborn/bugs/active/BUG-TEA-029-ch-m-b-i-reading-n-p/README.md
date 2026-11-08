# [BUG REPORT] [TEA-029] Chấm bài Reading đã nộp

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-029
- **Tiêu đề**: Chấm bài Reading đã nộp
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:18:05.373Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở bài nộp reading của học viên QA → nhập điểm 6 và nhận xét → lưu/gửi → mở lại cùng bài nộp → đối chiếu điểm UI/API.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Điểm Reading UI/API bằng 6.

- **Thực tế (Actual Result)**:
  ```text
  Cannot set properties of undefined (setting 'api')
  ```
- **URL tại thời điểm lỗi**: `N/A`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

