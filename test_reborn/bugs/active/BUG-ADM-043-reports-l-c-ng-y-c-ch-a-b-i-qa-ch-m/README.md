# [BUG REPORT] [ADM-043] Reports lọc ngày có chứa bài QA đã chấm

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-ADM-043
- **Tiêu đề**: Reports lọc ngày có chứa bài QA đã chấm
- **Phân hệ / Vai trò**: ADMIN
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: NEEDS_REVIEW
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-06T13:36:56.069Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
1. Setup lớp riêng với một bài PUBLISHED, Student QA nộp, Teacher chấm 8/10.
2. Admin vào Reports, chọn Teacher và lớp QA.
3. Nhập Từ ngày = hôm nay UTC trừ 2 ngày, Đến ngày = cộng 2 ngày bằng input UI; xác minh value ISO đúng, không bypass bằng API.
4. Đọc API overview/classes có from/to; kỳ vọng nghiệp vụ riêng bài QA phải 80% và hoàn thành 100%.
5. Chờ KPI theo nhãn khớp API; đối chiếu đúng dòng lớp: mã/tên/số bài/điểm/tỷ lệ. Không thay thế case 025 về số dòng sau class filter.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Bài 8/10 được tính 80%/100%, KPI và dòng lớp khớp API có from/to.

- **Thực tế (Actual Result)**:
  ```text
  Dropdown chưa có option 1503 sau khi chờ dữ liệu API
Wait timed out after 30054ms
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/admin/reports`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)
- **DOM Snapshot HTML**: [evidence/page-dom.html](evidence/page-dom.html)

