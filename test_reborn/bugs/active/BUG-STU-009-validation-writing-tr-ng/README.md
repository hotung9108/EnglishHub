# [BUG REPORT] [STU-009] Validation Writing trống

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-STU-009
- **Tiêu đề**: Validation Writing trống
- **Phân hệ / Vai trò**: STUDENT
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: [object Object]
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:18:24.235Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở editor; xóa nội dung rồi bấm Nộp bài.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  UI báo phải nhập/tải file; API vẫn IN_PROGRESS, không có bài nộp mới.

- **Thực tế (Actual Result)**:
  ```text
  Cannot read properties of undefined (reading 'api')
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/student/dashboard`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

