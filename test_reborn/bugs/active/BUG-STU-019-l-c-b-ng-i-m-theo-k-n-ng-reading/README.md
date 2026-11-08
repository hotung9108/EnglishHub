# [BUG REPORT] [STU-019] Lọc Bảng điểm theo kỹ năng Reading

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-STU-019
- **Tiêu đề**: Lọc Bảng điểm theo kỹ năng Reading
- **Phân hệ / Vai trò**: STUDENT
- **Giai đoạn phát hiện (Phase)**: login
- **Phân loại lỗi**: [object Object]
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T03:08:25.460Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Tải bảng điểm; chọn Reading, kiểm tra các dòng hiển thị, độc lập việc tìm tiêu đề fixture.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Bộ lọc được chọn Reading; mọi dòng dữ liệu có nhãn READING. Bảng rỗng dù API có bài Reading cần review mapping.

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

