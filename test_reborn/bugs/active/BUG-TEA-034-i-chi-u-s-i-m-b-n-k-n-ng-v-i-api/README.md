# [BUG REPORT] [TEA-034] Đối chiếu sổ điểm bốn kỹ năng với API

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-034
- **Tiêu đề**: Đối chiếu sổ điểm bốn kỹ năng với API
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:18:08.478Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Đọc assignment/submission của lớp bằng API → tính trung bình điểm cuối theo từng kỹ năng của học viên QA → mở sổ điểm → đối chiếu bốn giá trị UI.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Từng điểm trung bình trên UI khớp phép tính từ API submissions.

- **Thực tế (Actual Result)**:
  ```text
  Cannot set properties of undefined (setting 'api')
  ```
- **URL tại thời điểm lỗi**: `N/A`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

