# [BUG REPORT] [TEA-033] AI không hợp lệ cho Reading vẫn chấm thủ công được

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-033
- **Tiêu đề**: AI không hợp lệ cho Reading vẫn chấm thủ công được
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: http://localhost:5173
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-07T05:22:00.290Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở bài nộp reading → kiểm tra điều kiện AI → yêu cầu gợi ý → kiểm tra thông báo từ chối, trường điểm thủ công vẫn dùng được.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Thông báo lỗi AI, editor điểm vẫn dùng được.

- **Thực tế (Actual Result)**:
  ```text
  GET /submission-modules/4386/grading/ai-suggestion: HTTP 400
  ```
- **URL tại thời điểm lỗi**: `http://localhost:5173/teacher/dashboard`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

