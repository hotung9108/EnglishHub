# [BUG REPORT] [STU-006] Tìm bài không tồn tại

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-STU-006
- **Tiêu đề**: Tìm bài không tồn tại
- **Phân hệ / Vai trò**: STUDENT
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: [object Object]
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-04T07:18:12.579Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
Mở danh sách bài, nhập chuỗi không tồn tại.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Không còn thẻ bài; có trạng thái rỗng.

- **Thực tế (Actual Result)**:
  ```text
  Cannot read properties of undefined (reading 'classId')
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/student/assignments`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)

