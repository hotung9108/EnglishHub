# [BUG REPORT] [ADM-048] Admin truy cập được cấu hình hệ thống FE23

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-ADM-048
- **Tiêu đề**: Admin truy cập được cấu hình hệ thống FE23
- **Phân hệ / Vai trò**: ADMIN
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: PRODUCT_CANDIDATE
- **Trạng thái**: OPEN
- **Môi trường**: http://localhost:5173
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-07T05:26:21.287Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
1. Admin vào Cài đặt qua sidebar.
2. Tìm trường Mô hình chấm Writing/Writing Evaluation Model theo yêu cầu FE-23.
3. Kiểm tra có ít nhất hai lựa chọn model và nút Lưu thay đổi cài đặt/Khôi phục mặc định.
4. Nếu chỉ có hồ sơ/bảo mật cá nhân thì Fail vì thiếu form hệ thống, không coi 032/033 là đã bao phủ. Không nhập API key.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Có form cấu hình hệ thống; form hồ sơ cá nhân không thay thế yêu cầu FE23.

- **Thực tế (Actual Result)**:
  ```text
  Không tìm thấy form cấu hình hệ thống FE-23 tại Cài đặt: Missing or ambiguous labelled field /Mô hình chấm Writing|Writing Evaluation Model/i
  ```
- **URL tại thời điểm lỗi**: `http://localhost:5173/admin/settings`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)
- **DOM Snapshot HTML**: [evidence/page-dom.html](evidence/page-dom.html)

