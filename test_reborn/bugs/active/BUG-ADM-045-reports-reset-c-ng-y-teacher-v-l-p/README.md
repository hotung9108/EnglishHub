# [BUG REPORT] [ADM-045] Reports reset cả ngày Teacher và lớp

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-ADM-045
- **Tiêu đề**: Reports reset cả ngày Teacher và lớp
- **Phân hệ / Vai trò**: ADMIN
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: PRODUCT_CANDIDATE
- **Trạng thái**: OPEN
- **Môi trường**: http://localhost:5173
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-07T05:25:46.203Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
1. Setup lớp QA; Admin vào Reports, chọn Teacher và lớp QA.
2. Nhập cả Từ ngày và Đến ngày, xác minh giá trị trước reset.
3. Bấm Xóa bộ lọc, chờ tải xong.
4. Kiểm tra cả hai ngày rỗng, Teacher/Class về mặc định; đối chiếu KPI với API overview không có filter.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Hai ngày rỗng, select mặc định; KPI theo API overview không filter.

- **Thực tế (Actual Result)**:
  ```text
  Reset còn giữ Teacher/Class
  ```
- **URL tại thời điểm lỗi**: `http://localhost:5173/admin/reports`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)
- **DOM Snapshot HTML**: [evidence/page-dom.html](evidence/page-dom.html)

