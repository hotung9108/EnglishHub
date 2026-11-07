# [BUG REPORT] [TEA-040] Teacher không phụ trách không đọc được assignment QA ngoài quyền

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-040
- **Tiêu đề**: Teacher không phụ trách không đọc được assignment QA ngoài quyền
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-06T13:54:48.596Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Đăng nhập giáo viên chính → truy cập URL bài tập của giáo viên khác đã tạo riêng → kiểm tra thông báo từ chối/không tìm thấy và không lộ tiêu đề ngoài quyền.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Không lộ tiêu đề assignment, UI từ chối.

- **Thực tế (Actual Result)**:
  ```text
  Cannot read properties of undefined (reading 'id')
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/teacher/dashboard`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

