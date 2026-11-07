# [BUG REPORT] [STU-039] Speaking: chưa ghi âm không được nộp

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-STU-039
- **Tiêu đề**: Speaking: chưa ghi âm không được nộp
- **Phân hệ / Vai trò**: STUDENT
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: [object Object]
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:20:21.781Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở Speaking mới, chưa bấm thu âm.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Nút Nộp bài bị vô hiệu hóa; chưa có audio và lượt chưa nộp.

- **Thực tế (Actual Result)**:
  ```text
  Cannot read properties of undefined (reading 'api')
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/student/dashboard`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

