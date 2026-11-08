# [BUG REPORT] [TEA-049] Hủy tạo bài không sinh assignment

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-049
- **Tiêu đề**: Hủy tạo bài không sinh assignment
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:18:17.627Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở form giao bài → nhập tiêu đề QA duy nhất → Hủy bỏ → kiểm tra quay lại danh sách và API không sinh bài mới.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Về danh sách; API không có bài mang tiêu đề QA vừa nhập.

- **Thực tế (Actual Result)**:
  ```text
  Cannot set properties of undefined (setting 'api')
  ```
- **URL tại thời điểm lỗi**: `N/A`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

