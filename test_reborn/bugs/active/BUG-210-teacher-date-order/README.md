# [BUG-210] Cho phép gửi lịch đóng bài tập trước lịch mở bài

- **Phân hệ / Vai trò**: Teacher
- **Use Case liên quan**: UC12, UC13 trong docs/core/01.SRS.md
- **Mức độ nghiêm trọng (Severity)**: High
- **Mức độ ưu tiên (Priority)**: P2
- **Môi trường phát hiện**: Staging
- **Qase Suite ID**: Suite 12 (Assignments API)
- **GitHub Issue liên quan**: #210

---

## 1. Mô tả Hiện tượng
Khi giáo viên tạo hoặc sửa bài tập, nếu người dùng cố tình hoặc vô ý chọn thời gian đóng bài (`closeDate`) sớm hơn thời gian mở bài (`openDate`), form giao diện frontend vẫn cho phép nhấn nút lưu và gửi request xuống backend.

---

## 2. Các bước Tái hiện
1. Đăng nhập với tài khoản Giáo viên (`teacher@test.com`).
2. Mở màn hình Tạo bài tập: `/teacher/assignments/create`.
3. Điền tiêu đề và chọn lớp học.
4. Đặt `Ngày mở`: `2026-11-10T10:00:00`.
5. Đặt `Ngày đóng`: `2026-11-05T10:00:00` (sớm hơn ngày mở 5 ngày).
6. Nhấn nút "Lưu bài tập" hoặc "Phát hành".

---

## 3. Kết quả Thực tế
- Form frontend không báo lỗi validation đỏ ở trường ngày tháng.
- Request POST gửi lên server với payload đảo ngược ngày tháng.

---

## 4. Kết quả Mong đợi
- Form phải có validation `closeDate > openDate`.
- Nếu `closeDate <= openDate`, vô hiệu hóa nút submit và hiển thị cảnh báo: *"Thời gian đóng bài tập phải sau thời gian mở bài"*.

---

## 5. Bằng chứng đính kèm
- Ảnh chụp màn hình lỗi: `evidence/screenshot-error.png`
- Payload mạng: `evidence/network-payload.json`
