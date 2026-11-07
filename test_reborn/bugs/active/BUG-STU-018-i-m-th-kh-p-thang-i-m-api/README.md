# [BUG REPORT] [STU-018] Điểm thô khớp thang điểm API

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-STU-018
- **Tiêu đề**: Điểm thô khớp thang điểm API
- **Phân hệ / Vai trò**: STUDENT
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: [object Object]
- **Trạng thái**: OPEN
- **Môi trường**: http://localhost:5173
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-07T05:17:31.442Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Tìm bài Reading đã chấm trong Bảng điểm; đối chiếu maxScoreSnapshot.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Điểm thô phải là 7.5/10, không hiển thị sai mẫu số 100.

- **Thực tế (Actual Result)**:
  ```text
  Raw score cell must match API score and maximum
+ actual - expected

+ '7.5/100'
- '7.5/10'
         ^

  ```
- **URL tại thời điểm lỗi**: `http://localhost:5173/student/grades`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

