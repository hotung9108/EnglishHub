# [BUG REPORT] [STU-008] Bắt đầu lượt Writing

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-STU-008
- **Tiêu đề**: Bắt đầu lượt Writing
- **Phân hệ / Vai trò**: STUDENT
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: [object Object]
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:18:21.944Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Bắt đầu Writing từ Overview.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Có editor; API tạo lượt IN_PROGRESS gắn đúng module.

- **Thực tế (Actual Result)**:
  ```text
  Cannot read properties of undefined (reading 'api')
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/student/dashboard`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

