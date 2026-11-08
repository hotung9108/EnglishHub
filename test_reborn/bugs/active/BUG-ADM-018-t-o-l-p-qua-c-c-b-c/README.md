# [BUG REPORT] [ADM-018] Tạo lớp qua đủ các bước

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-ADM-018
- **Tiêu đề**: Tạo lớp qua đủ các bước
- **Phân hệ / Vai trò**: ADMIN
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-06T13:30:47.350Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
1. Setup Teacher QA riêng để gán cho lớp.
2. Đăng nhập Admin; vào Quản lý Lớp học, bấm Tạo lớp học mới.
3. Nhập QA31-UI-Class-<tag>, chọn Trung cấp (B1-B2); kiểm tra ngày bắt đầu mặc định không trống.
4. Bấm Tiếp theo, chọn Teacher QA theo ID, bấm Tiếp theo rồi tạo lớp ở bước cuối.
5. API kiểm tra tên/level/Teacher ID; mở lại lớp mới qua danh sách để kiểm tra URL/tên. Chưa có assertion riêng cho sĩ số/lịch học.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  API lưu đúng tên, level và teacherId; mở được lớp mới.

- **Thực tế (Actual Result)**:
  ```text
  Dropdown chưa có option 1503 sau khi chờ dữ liệu API
Wait timed out after 30331ms
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/admin/classes/create`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)
- **DOM Snapshot HTML**: [evidence/page-dom.html](evidence/page-dom.html)

