# [BUG REPORT] [ADM-026] Reports lọc giáo viên QA

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-ADM-026
- **Tiêu đề**: Reports lọc giáo viên QA
- **Phân hệ / Vai trò**: ADMIN
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-06T13:32:23.181Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
1. Setup baseClass thuộc Teacher QA riêng.
2. Đăng nhập Admin; vào Báo cáo & Thống kê, chờ option Giáo viên phụ trách và chọn đúng Teacher ID.
3. API GET reports/classes?teacherId=<id>; yêu cầu có baseClass và UI có dữ liệu.
4. Kiểm tra mỗi dòng UI đang hiển thị thuộc danh sách lớp API của Teacher. Chưa duyệt toàn bộ trang.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Chỉ hiển thị các lớp từ API reports/classes của giáo viên đó.

- **Thực tế (Actual Result)**:
  ```text
  Dropdown chưa có option 1503 sau khi chờ dữ liệu API
Wait timed out after 30444ms
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/admin/reports`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)
- **DOM Snapshot HTML**: [evidence/page-dom.html](evidence/page-dom.html)

