# [BUG REPORT] [STU-024] Lịch sử lượt nộp bài đã chấm

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-STU-024
- **Tiêu đề**: Lịch sử lượt nộp bài đã chấm
- **Phân hệ / Vai trò**: STUDENT
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: [object Object]
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:19:32.773Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Lớp học → đúng bài đã chấm → Overview; so lịch sử với API, độc lập nút Bảng điểm.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Số dòng, số lượt và điểm của lượt fixture phải khớp API.

- **Thực tế (Actual Result)**:
  ```text
  Cannot read properties of undefined (reading 'className')
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/student/classes`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

