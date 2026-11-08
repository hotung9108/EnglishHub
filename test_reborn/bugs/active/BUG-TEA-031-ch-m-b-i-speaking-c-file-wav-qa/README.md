# [BUG REPORT] [TEA-031] Chấm bài Speaking có file WAV QA

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-TEA-031
- **Tiêu đề**: Chấm bài Speaking có file WAV QA
- **Phân hệ / Vai trò**: TEACHER
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:18:06.556Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở bài nộp speaking của học viên QA → nhập điểm 4 và nhận xét → lưu/gửi → mở lại cùng bài nộp → đối chiếu điểm UI/API.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Điểm Speaking UI/API bằng 4. Không đánh giá chất lượng AI speech.

- **Thực tế (Actual Result)**:
  ```text
  Cannot set properties of undefined (setting 'api')
  ```
- **URL tại thời điểm lỗi**: `N/A`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

