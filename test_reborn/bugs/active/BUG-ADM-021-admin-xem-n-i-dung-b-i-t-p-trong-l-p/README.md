# [BUG REPORT] [ADM-021] Admin xem nội dung bài tập trong lớp

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-ADM-021
- **Tiêu đề**: Admin xem nội dung bài tập trong lớp
- **Phân hệ / Vai trò**: ADMIN
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: API_ACCESS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: http://localhost:5173
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-07T05:18:29.528Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
1. Setup baseClass và bài Reading có câu hỏi; Teacher API công bố PUBLISHED, xác minh lại.
2. Đăng nhập Admin; tìm lớp QA, bấm Quản lý lớp rồi tab Bài tập & Điểm số.
3. Chờ tải; Admin API GET assignments của lớp. Nếu 403 ghi API_ACCESS_REVIEW, cần xác nhận contract quyền.
4. Nếu API cho đọc, kiểm tra có đúng assignmentId và tiêu đề trên UI. Nếu dừng ở 403, bước này chưa được kiểm tra.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Bài PUBLISHED QA xuất hiện đúng tiêu đề; nếu Admin API trả 403 cần review contract quyền.

- **Thực tế (Actual Result)**:
  ```text
  GET /classes/107/assignments: HTTP 403
  ```
- **URL tại thời điểm lỗi**: `http://localhost:5173/admin/classes/107`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)
- **DOM Snapshot HTML**: [evidence/page-dom.html](evidence/page-dom.html)

