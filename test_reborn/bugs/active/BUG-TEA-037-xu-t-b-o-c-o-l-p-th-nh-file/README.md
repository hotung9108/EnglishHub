# [BUG REPORT] [TEA-037] Xuất báo cáo lớp thành file

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-037
- **Tiêu đề**: Xuất báo cáo lớp thành file
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: PRODUCT_CANDIDATE
- **Trạng thái**: OPEN
- **Môi trường**: http://localhost:5173
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-07T05:22:28.044Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở báo cáo lớp → bấm Xuất báo cáo → chờ file tải vào thư mục riêng của case → kiểm tra định dạng và dung lượng khác 0.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Có file tải hoàn tất trong 60 giây, không chỉ toast.

- **Thực tế (Actual Result)**:
  ```text
  Không có file export hoàn tất sau 60 giây. Cần đối chiếu handler/network; toast không chứng minh tải file.
  ```
- **URL tại thời điểm lỗi**: `http://localhost:5173/teacher/classes/85/progress`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

