# [BUG REPORT] [ADM-017] Tạo lớp chặn thiếu tên

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-ADM-017
- **Tiêu đề**: Tạo lớp chặn thiếu tên
- **Phân hệ / Vai trò**: ADMIN
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: PRODUCT_CANDIDATE
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T03:10:58.714Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
1. Đăng nhập Admin; vào Quản lý Lớp học, bấm Tạo lớp học mới.
2. Kiểm tra tên lớp đang trống; nếu Tiếp theo bị khóa thì xác minh chặn tại đây.
3. Nếu vẫn đi tiếp được, bấm Tiếp theo qua các bước hiện có.
4. Ở bước cuối, nút submit phải bị khóa vì thiếu tên; không gửi tạo lớp.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Không thể hoàn tất tạo lớp khi thiếu tên.

- **Thực tế (Actual Result)**:
  ```text
  Ambiguous button /Tạo lớp học mới|Create New Class/: 2
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/admin/classes`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)
- **DOM Snapshot HTML**: [evidence/page-dom.html](evidence/page-dom.html)

