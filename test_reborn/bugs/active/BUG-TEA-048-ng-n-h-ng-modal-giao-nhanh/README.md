# [BUG REPORT] [TEA-048] Ngân hàng đề / modal giao nhanh

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-048
- **Tiêu đề**: Ngân hàng đề / modal giao nhanh
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:18:17.049Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở quản lý bài tập → Ngân hàng đề → chọn Giao đề → kiểm tra modal giao nhanh hiển thị; không xác nhận tạo bài.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Điều hướng tới ngân hàng đề và mở modal; menu chưa có ghi Blocked.

- **Thực tế (Actual Result)**:
  ```text
  Cannot set properties of undefined (setting 'api')
  ```
- **URL tại thời điểm lỗi**: `N/A`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

