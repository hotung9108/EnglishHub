# [BUG REPORT] [ADM-022] Lưu cài đặt lớp và kiểm tra bền vững

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-ADM-022
- **Tiêu đề**: Lưu cài đặt lớp và kiểm tra bền vững
- **Phân hệ / Vai trò**: ADMIN
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: PRODUCT_CANDIDATE
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-06T13:31:45.559Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
1. Setup editClass riêng; xác minh classId/tên trong ledger.
2. Đăng nhập Admin; tìm editClass, bấm Quản lý lớp rồi Cài đặt lớp học.
3. Nhập mô tả QA31 updated description <tag>, bấm Lưu; API chờ giá trị được lưu.
4. Rời trang, tìm/mở lại lớp qua danh sách; vào Cài đặt lớp học, kiểm tra textarea giữ mô tả mới.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  API và textarea sau mở lại cùng chứa mô tả mới.

- **Thực tế (Actual Result)**:
  ```text
  Không thấy thẻ lớp QA31-editClass-2be98c1e51c0
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/admin/classes`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)
- **DOM Snapshot HTML**: [evidence/page-dom.html](evidence/page-dom.html)

