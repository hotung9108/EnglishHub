# [BUG REPORT] [TEA-026] Từ chối điểm âm và giữ dữ liệu API

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-026
- **Tiêu đề**: Từ chối điểm âm và giữ dữ liệu API
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:18:03.133Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Đọc điểm/nhận xét hiện tại qua API → mở bài nộp → nhập điểm -1 → lưu/gửi → kiểm tra validation, vẫn ở editor và API không đổi.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Báo điểm không hợp lệ; điểm/nhận xét API không đổi.

- **Thực tế (Actual Result)**:
  ```text
  Cannot set properties of undefined (setting 'api')
  ```
- **URL tại thời điểm lỗi**: `N/A`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

