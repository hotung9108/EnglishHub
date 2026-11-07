# [BUG REPORT] [TEA-036] Tìm học viên không tồn tại và khôi phục

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-036
- **Tiêu đề**: Tìm học viên không tồn tại và khôi phục
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:18:09.491Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở sổ điểm lớp QA → tìm tên không tồn tại → kiểm tra danh sách rỗng → tìm lại học viên QA → kiểm tra có kết quả.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Không có học viên phù hợp; tìm lại QA thì có kết quả.

- **Thực tế (Actual Result)**:
  ```text
  Cannot set properties of undefined (setting 'api')
  ```
- **URL tại thời điểm lỗi**: `N/A`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

