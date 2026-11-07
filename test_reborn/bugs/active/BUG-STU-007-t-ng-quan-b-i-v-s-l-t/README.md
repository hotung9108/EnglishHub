# [BUG REPORT] [STU-007] Tổng quan bài và số lượt

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-STU-007
- **Tiêu đề**: Tổng quan bài và số lượt
- **Phân hệ / Vai trò**: STUDENT
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: [object Object]
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-06T13:27:46.107Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Danh sách bài tập → tìm Writing → Tổng quan; cuộn đến ô số lượt và nút bắt đầu, không bấm làm bài.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Đúng tên/mã bài; số lượt khớp API, chưa có lượt làm; nút Bắt đầu được bật.

- **Thực tế (Actual Result)**:
  ```text
  This overview case requires a fresh assignment; use --fresh-fixtures
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/student/dashboard`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

