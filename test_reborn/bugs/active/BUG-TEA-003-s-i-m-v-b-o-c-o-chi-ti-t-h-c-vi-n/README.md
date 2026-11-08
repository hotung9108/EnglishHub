# [BUG REPORT] [TEA-003] Sổ điểm và báo cáo chi tiết học viên

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-003
- **Tiêu đề**: Sổ điểm và báo cáo chi tiết học viên
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:17:49.553Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở lớp QA → Tiến độ & Bảng điểm → tìm học viên QA → mở chi tiết → đóng.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Đúng học viên; sổ điểm và drawer có đủ Writing/Speaking/Reading/Listening; đóng được drawer.

- **Thực tế (Actual Result)**:
  ```text
  Cannot read properties of undefined (reading 'className')
  ```
- **URL tại thời điểm lỗi**: `N/A`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

