# [BUG REPORT] [TEA-039] Teacher không phụ trách không đọc được lớp QA ngoài quyền

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-039
- **Tiêu đề**: Teacher không phụ trách không đọc được lớp QA ngoài quyền
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: http://localhost:5173
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-07T05:22:41.635Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Đăng nhập giáo viên chính → xác minh danh tính API và chủ lớp bằng admin → gọi API lớp bằng token giáo viên chính → luôn mở URL lớp ngoài quyền → ghi riêng kết quả API/UI và kiểm tra không lộ tên lớp/bài QA.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Xác minh giáo viên gọi API khác chủ lớp; API trả 403/404; UI từ chối và không lộ tên lớp/bài QA. Ghi riêng bằng chứng API/UI, không dừng trước UI khi API cho đọc.

- **Thực tế (Actual Result)**:
  ```text
  UI phải từ chối lớp ngoài quyền và không lộ tên lớp/bài QA
Wait timed out after 30189ms
  ```
- **URL tại thời điểm lỗi**: `http://localhost:5173/teacher/classes/110/progress`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

