# [BUG REPORT] [TEA-019] Sửa hạn nộp và đối chiếu API

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-019
- **Tiêu đề**: Sửa hạn nộp và đối chiếu API
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:17:58.805Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở chỉnh sửa bài QA riêng → đặt hạn nộp hợp lệ mới → lưu → đối chiếu closeAt từ API.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  closeAt API bằng giá trị đã nhập trên UI.

- **Thực tế (Actual Result)**:
  ```text
  Cannot set properties of undefined (setting 'api')
  ```
- **URL tại thời điểm lỗi**: `N/A`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

