# [BUG REPORT] [ADM-011] Teachers tìm và mở hồ sơ QA

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-ADM-011
- **Tiêu đề**: Teachers tìm và mở hồ sơ QA
- **Phân hệ / Vai trò**: ADMIN
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: PRODUCT_CANDIDATE
- **Trạng thái**: OPEN
- **Môi trường**: http://localhost:5173
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-07T05:16:08.154Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
1. Setup Teacher QA riêng; đăng nhập Admin và vào Giáo viên.
2. Tìm toàn bộ email QA; bấm Xem chi tiết trên kết quả.
3. Chờ tải xong; kiểm tra URL /admin/teachers/<teacherId>, tên và email đúng QA.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  URL đúng ID; hồ sơ đúng email và họ tên.

- **Thực tế (Actual Result)**:
  ```text
  Ambiguous button /^Xem chi tiết$|^View Details$/: 2
  ```
- **URL tại thời điểm lỗi**: `http://localhost:5173/admin/teachers`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)
- **DOM Snapshot HTML**: [evidence/page-dom.html](evidence/page-dom.html)

