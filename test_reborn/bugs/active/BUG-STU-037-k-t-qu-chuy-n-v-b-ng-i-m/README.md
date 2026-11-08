# [BUG REPORT] [STU-037] Kết quả: chuyển về Bảng điểm

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-STU-037
- **Tiêu đề**: Kết quả: chuyển về Bảng điểm
- **Phân hệ / Vai trò**: STUDENT
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: [object Object]
- **Trạng thái**: OPEN
- **Môi trường**: http://localhost:5173
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-07T05:21:53.013Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở kết quả từ lịch sử rồi bấm nút Xem bảng điểm.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Đi đúng /student/grades và tải được bảng.

- **Thực tế (Actual Result)**:
  ```text
  Waiting for element to be located By(css selector, aside a[href="grades"])
Wait timed out after 30080ms
  ```
- **URL tại thời điểm lỗi**: `http://localhost:5173/student/submissions/1242`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

