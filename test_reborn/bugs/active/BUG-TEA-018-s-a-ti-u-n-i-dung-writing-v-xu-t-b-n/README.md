# [BUG REPORT] [TEA-018] Sửa tiêu đề/nội dung Writing và xuất bản

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-018
- **Tiêu đề**: Sửa tiêu đề/nội dung Writing và xuất bản
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:17:58.313Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở bài Writing nháp QA riêng → chỉnh sửa tiêu đề/nội dung → xuất bản → mở chi tiết → đối chiếu dữ liệu API.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  API readback và trang chi tiết đúng tiêu đề, instructions, PUBLISHED.

- **Thực tế (Actual Result)**:
  ```text
  Cannot set properties of undefined (setting 'api')
  ```
- **URL tại thời điểm lỗi**: `N/A`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

