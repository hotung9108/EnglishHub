# [BUG REPORT] [ADM-014] Students tìm học viên QA mới

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-ADM-014
- **Tiêu đề**: Students tìm học viên QA mới
- **Phân hệ / Vai trò**: ADMIN
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T08:06:07.551Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
1. Setup API tạo Student QA riêng; API xác minh lại đúng ID/email.
2. Đăng nhập Admin; bấm Học viên ở sidebar.
3. Tìm toàn bộ email Student QA và chờ có dòng chứa đúng email.
4. Không thấy trong timeout thì Fail, giữ readback để đối chiếu; không thay bằng học viên khác.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Một dòng chính xác; không nhầm học viên khác.

- **Thực tế (Actual Result)**:
  ```text
  Không thấy dòng QA [REDACTED]
Wait timed out after 30159ms
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/admin/students`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)
- **DOM Snapshot HTML**: [evidence/page-dom.html](evidence/page-dom.html)

