# [BUG REPORT] [TEA-038] Xuất danh sách bài nộp thành file

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-038
- **Tiêu đề**: Xuất danh sách bài nộp thành file
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:18:11.090Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở chi tiết bài tập → bấm Xuất báo cáo → chờ file tải vào thư mục riêng của case → kiểm tra định dạng và dung lượng khác 0.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Có file tải hoàn tất trong 60 giây và không rỗng.

- **Thực tế (Actual Result)**:
  ```text
  Cannot set properties of undefined (setting 'api')
  ```
- **URL tại thời điểm lỗi**: `N/A`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

