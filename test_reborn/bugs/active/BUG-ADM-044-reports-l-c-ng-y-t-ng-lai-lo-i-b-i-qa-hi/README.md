# [BUG REPORT] [ADM-044] Reports lọc ngày tương lai loại bài QA hiện tại

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-ADM-044
- **Tiêu đề**: Reports lọc ngày tương lai loại bài QA hiện tại
- **Phân hệ / Vai trò**: ADMIN
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-06T13:37:35.409Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
1. Setup lớp/bài QA đã chấm 8/10 như 043.
2. Admin vào Reports, chọn Teacher và lớp QA.
3. Nhập từ hôm nay UTC cộng 30 ngày đến cộng 31 ngày; xác minh value ngày đúng.
4. API overview phải loại bài hiện tại: điểm và tỷ lệ 0; lỗi API cũng phải Fail, không chỉ so UI với API.
5. Chờ bốn KPI UI khớp API và đối chiếu dòng lớp theo cùng from/to.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Không tính bài hiện tại: điểm/tỷ lệ 0; UI khớp API theo khoảng ngày.

- **Thực tế (Actual Result)**:
  ```text
  Dropdown chưa có option 1503 sau khi chờ dữ liệu API
Wait timed out after 30231ms
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/admin/reports`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)
- **DOM Snapshot HTML**: [evidence/page-dom.html](evidence/page-dom.html)

