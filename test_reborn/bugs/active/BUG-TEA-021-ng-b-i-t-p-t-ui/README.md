# [BUG REPORT] [TEA-021] Đóng bài tập từ UI

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-021
- **Tiêu đề**: Đóng bài tập từ UI
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:18:00.250Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở chi tiết bài QA riêng → Đóng bài tập → xác nhận nếu có → chờ API trả CLOSED.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  API status CLOSED; nếu UI chưa có control thì Blocked.

- **Thực tế (Actual Result)**:
  ```text
  Cannot set properties of undefined (setting 'api')
  ```
- **URL tại thời điểm lỗi**: `N/A`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

