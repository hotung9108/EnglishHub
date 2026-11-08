# [BUG REPORT] [TEA-004] Mở báo cáo phân tích bốn kỹ năng của lớp

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-004
- **Tiêu đề**: Mở báo cáo phân tích bốn kỹ năng của lớp
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T13:54:34.592Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở lớp QA → chọn Phân tích 4KN & AI Insights.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Hiển thị bốn thẻ phân tích kỹ năng. Case này không xác minh độ chính xác số liệu.

- **Thực tế (Actual Result)**:
  ```text
  Waiting for element to be located By(xpath, //main//button[normalize-space(.)='Phân tích 4KN & AI Insights' or normalize-space(.)='4-Skill Analytics & AI'])
Wait timed out after 30185ms
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/teacher/classes/120/progress`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

