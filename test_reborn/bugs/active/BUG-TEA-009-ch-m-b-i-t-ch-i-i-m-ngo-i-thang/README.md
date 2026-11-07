# [BUG REPORT] [TEA-009] Chấm bài: từ chối điểm ngoài thang

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-009
- **Tiêu đề**: Chấm bài: từ chối điểm ngoài thang
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:17:53.397Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở bài QA → mở bài nộp học viên QA → nhập 11 → Lưu & Gửi điểm.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Báo điểm không hợp lệ; vẫn ở editor chấm bài.

- **Thực tế (Actual Result)**:
  ```text
  Cannot read properties of undefined (reading 'assignmentTitle')
  ```
- **URL tại thời điểm lỗi**: `N/A`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

