# [BUG REPORT] [STU-021] Đánh giá định kỳ: lọc giáo viên và mở lớp

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-STU-021
- **Tiêu đề**: Đánh giá định kỳ: lọc giáo viên và mở lớp
- **Phân hệ / Vai trò**: STUDENT
- **Giai đoạn phát hiện (Phase)**: login
- **Phân loại lỗi**: [object Object]
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T03:08:26.895Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Tìm evaluation; chọn Từ Giảng viên rồi bấm nút hành động của chính thẻ đánh giá định kỳ.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Đánh giá vẫn hiện; hành động phải mở lớp QA30, không mở kết quả bài nộp không liên quan.

- **Thực tế (Actual Result)**:
  ```text
  unknown error: net::ERR_INTERNET_DISCONNECTED
  (Session info: chrome=156.0.8078.80)
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

