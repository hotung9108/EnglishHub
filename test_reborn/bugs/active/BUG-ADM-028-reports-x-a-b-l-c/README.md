# [BUG REPORT] [ADM-028] Reports xóa bộ lọc

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-ADM-028
- **Tiêu đề**: Reports xóa bộ lọc
- **Phân hệ / Vai trò**: ADMIN
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: PRODUCT_CANDIDATE
- **Trạng thái**: OPEN
- **Môi trường**: http://localhost:5173
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-07T05:20:20.821Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
1. Setup baseClass; đăng nhập Admin và vào Báo cáo & Thống kê.
2. Chọn lớp QA trong dropdown Lớp học; chờ tải.
3. Bấm Xóa bộ lọc; chờ tải xong.
4. Kiểm tra value các select Class/Teacher trở về rỗng/ALL. Case chưa đặt hoặc kiểm tra reset ngày.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Class và Teacher select trở về giá trị rỗng/ALL.

- **Thực tế (Actual Result)**:
  ```text
  false == true
  ```
- **URL tại thời điểm lỗi**: `http://localhost:5173/admin/reports`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)
- **DOM Snapshot HTML**: [evidence/page-dom.html](evidence/page-dom.html)

