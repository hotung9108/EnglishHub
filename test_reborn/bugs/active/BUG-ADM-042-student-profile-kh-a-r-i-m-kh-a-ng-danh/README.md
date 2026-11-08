# [BUG REPORT] [ADM-042] Student profile khóa rồi mở khóa đúng danh tính QA

## 1. Thông tin Tổng quan
- **Mã Bug**: BUG-ADM-042
- **Tiêu đề**: Student profile khóa rồi mở khóa đúng danh tính QA
- **Phân hệ / Vai trò**: ADMIN
- **Giai đoạn phát hiện (Phase)**: scenario
- **Phân loại lỗi**: PRODUCT_CANDIDATE
- **Trạng thái**: OPEN
- **Môi trường**: https://staging.hotung9108.me
- **Trình duyệt**: chrome (Usability Full HD, hình ảnh & animations bật)
- **Thời điểm phát hiện**: 2026-11-06T13:36:43.277Z

---

## 2. Mô tả & Các bước Tái hiện (Steps to Reproduce)
1. Setup lớp QA và Student QA đã ghi danh; xác minh ownership bằng API.
2. Admin tìm lớp, mở Quản lý lớp; bấm Hồ sơ trên đúng dòng Student QA.
3. Đối chiếu URL/studentId, tên và email trước bấm nút. Nếu sai người, Blocked phụ thuộc 020, không mutation.
4. Khóa tài khoản, xác nhận nếu có; API phải LOCKED; xác minh lại danh tính trước Mở khóa.
5. Mở khóa, API phải ACTIVE; reload và kiểm tra đúng hồ sơ/nút Khóa hiện lại. Finally khôi phục ACTIVE trên đúng QA nếu đã vào luồng mutation.

---

## 3. Kết quả Thực tế vs Kỳ vọng
- **Kỳ vọng (Expected)**:
  Đúng QA chuyển LOCKED/ACTIVE; hồ sơ sai người thì Blocked trước mutation.

- **Thực tế (Actual Result)**:
  ```text
  Không thấy thẻ lớp QA31-baseClass-2be98c1e51c0
  ```
- **URL tại thời điểm lỗi**: `https://staging.hotung9108.me/admin/classes`

---

## 4. Bằng chứng Lỗi (Evidence)
- **Ảnh chụp màn hình lỗi**: [evidence/screenshot-error.png](evidence/screenshot-error.png)
- **Chi tiết kỹ thuật**: [evidence/error-details.json](evidence/error-details.json)
- **DOM Snapshot HTML**: [evidence/page-dom.html](evidence/page-dom.html)

