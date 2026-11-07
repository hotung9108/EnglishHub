# [BUG REPORT] [TEA-010] Lưu và trả điểm/nhận xét; mở lại kiểm tra

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-010
- **Tiêu đề**: Lưu và trả điểm/nhận xét; mở lại kiểm tra
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:17:53.942Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở bài QA → mở bài nộp học viên QA → nhập điểm và nhận xét có mã run → Lưu & Gửi điểm → mở lại cùng bài nộp.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Điểm chính thức và nguyên văn nhận xét đã lưu hiển thị lại sau khi mở bài nộp.

- **Thực tế (Actual Result)**:
  ```text
  Cannot read properties of undefined (reading 'assignmentTitle')
  ```
- **URL tại thời điểm lỗi**: `N/A`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

