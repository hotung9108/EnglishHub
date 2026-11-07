# [BUG REPORT] [STU-036] Kết quả: tab nhận xét của giáo viên

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-STU-036
- **Tiêu đề**: Kết quả: tab nhận xét của giáo viên
- **Phân hệ / Vai trò**: STUDENT
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: [object Object]
- **Trạng thái**: OPEN
- **Môi trường**: http://localhost:5173
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-07T05:21:43.703Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở kết quả từ lịch sử; chọn tab nhận xét giáo viên.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Tab được chọn và hiển thị finalFeedback chính thức từ API.

- **Thực tế (Actual Result)**:
  ```text
  Result must expose teacher feedback tab
  ```
- **URL tại thời điểm lỗi**: `http://localhost:5173/student/submissions/1242`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

