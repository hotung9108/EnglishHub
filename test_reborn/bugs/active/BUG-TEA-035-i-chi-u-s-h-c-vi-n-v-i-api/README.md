# [BUG REPORT] [TEA-035] Đối chiếu số học viên với API

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-035
- **Tiêu đề**: Đối chiếu số học viên với API
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:18:08.982Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Đọc members của lớp bằng API → mở chi tiết lớp → đối chiếu số học viên trên tab sổ điểm.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Số roster trên UI khớp API members.

- **Thực tế (Actual Result)**:
  ```text
  Cannot set properties of undefined (setting 'api')
  ```
- **URL tại thời điểm lỗi**: `N/A`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

