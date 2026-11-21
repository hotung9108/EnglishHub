# TÀI LIỆU ĐẶC TẢ NHIỆM VỤ (TASK SPECIFICATION)
## FE-99 / ISSUE #337: Hiển Thị Chuyên Môn Giáo Viên Từ Dữ Liệu Thật, Khóa Quyền Sửa Với Giáo Viên và Cho Phép Admin Chỉnh Sửa

> **Mục tiêu:** Khắc phục lỗi Issue #337 (BUG-02) khi giao diện hiển thị chuyên môn giáo viên bị hardcode tĩnh (TESOL, IELTS 8.0+) mà không lấy từ dữ liệu thật. Đồng thời chuẩn hóa quy tắc phân quyền: **Giáo viên KHÔNG ĐƯỢC TỰ SỬA chuyên môn** (read-only/disabled trên trang hồ sơ và cài đặt), **Quản trị viên (ADMIN) ĐƯỢC TOÀN QUYỀN CHỈNH SỬA chuyên môn** của giáo viên (trong trang quản lý giáo viên theo UC006).  
> **Người thực hiện:** Trần Tiến Sơn (`Maloque18705` / `@tinsntrn`)  
> **QA / Tester:** Nguyễn Văn Tú (`Zawn-Tsu` / `@zawntsu`)  
> **Phạm vi tác động:** `frontend/src/pages/Teachers.tsx`, `frontend/src/pages/TeacherDetails.tsx`, `frontend/src/pages/Profile.tsx`, `frontend/src/pages/Settings.tsx`.  
> **Target Branch:** `develop`  
> **Sprint:** 10  
> **Deadline:** 20/11/2026 23:59:00 (UTC+7)  

---

## 1. TỔNG QUAN VÀ BỐI CẢNH (PROBLEM STATEMENT)

### 1.1. Hiện trạng ghi nhận trong Issue #337 (BUG-02)
- Khi Admin đặt `specialization` cho giáo viên fixture qua API, sau đó mở danh sách Giáo viên (`/admin/teachers`) hoặc trang chi tiết Giáo viên (`/admin/teachers/:id`):
  * Dữ liệu chuyên môn thật trong database (`teacher.specialization`) **không xuất hiện**.
  * Giao diện hiển thị các badge tĩnh bị hardcode mặc định (`TESOL`, `IELTS 8.0+`, `TESOL / Chuẩn Sư Phạm`).
- Vấn đề quyền tự sửa chuyên môn: Cần làm rõ quy tắc nghiệp vụ giữa quyền của Quản trị viên và Giáo viên.

### 1.2. Quyết định phân quyền nghiệp vụ chính thức
1. **Đối với Giáo viên (`TEACHER`):**
   - Chuyên môn giảng dạy là bằng cấp/chứng chỉ do nhà trường/quản trị viên xác thực và phân công.
   - **Giáo viên KHÔNG ĐƯỢC TỰ Ý THAY ĐỔI chuyên môn của mình.**
   - Trên trang Hồ sơ cá nhân (`/teacher/profile` - `Profile.tsx`) và Cài đặt (`/teacher/settings` - `Settings.tsx`), trường "Chuyên môn giảng dạy" (`specialization`) **bắt buộc phải ở chế độ Chỉ đọc (Read-only / Disabled)**.
2. **Đối với Quản trị viên (`ADMIN`):**
   - Theo Use Case UC006 (Quản lý hồ sơ giáo viên), **Admin có toàn quyền thêm mới, xem và chỉnh sửa chuyên môn của bất kỳ giáo viên nào**.
   - Admin có thể cập nhật chuyên môn trong màn hình tạo giáo viên (`AddTeacher.tsx`), chi tiết giáo viên (`TeacherDetails.tsx`) hoặc Drawer chỉnh sửa giáo viên (`Teachers.tsx`). Dữ liệu lưu xong được gọi qua API backend và lưu vào CSDL.

---

## 2. HƯỚNG DẪN TRIỂN KHAI KỸ THUẬT

### 2.1. Hiển thị dữ liệu thật (Real Data Binding)
1. Trong `frontend/src/pages/Teachers.tsx`:
   - Xóa bỏ mock tĩnh `qualifications: ['TESOL', 'IELTS 8.0+']` (dòng 90).
   - Ánh xạ trực tiếp từ trường `teacher.specialization`. Nếu có giá trị thì hiển thị badge với nội dung thật; nếu rỗng thì hiển thị `"Chưa cập nhật"`.
2. Trong `frontend/src/pages/TeacherDetails.tsx`:
   - Thay thế các chuỗi tĩnh `TESOL / Chuẩn Sư Phạm` và `TESOL / CELTA Compliant` bằng giá trị `teacher.specialization` thực tế.

### 2.2. Khóa quyền chỉnh sửa với Giáo viên
1. Trong `frontend/src/pages/Profile.tsx`:
   - Giữ nguyên thuộc tính `readOnly` cho trường `specialization` khi vai trò là `TEACHER` (dòng 463).
2. Trong `frontend/src/pages/Settings.tsx`:
   - Tại phần nhập liệu chuyên môn (dòng 509-515), nếu `user.role === 'TEACHER'` (hoặc người dùng thông thường), trường nhập liệu phải có thuộc tính `disabled` hoặc `readOnly` kèm chú thích: `"Chuyên môn giảng dạy do Quản trị viên xác thực và phân công."`.

### 2.3. Cho phép Quản trị viên chỉnh sửa chuyên môn giáo viên
1. Trong màn hình Admin Quản lý Giáo viên (`Teachers.tsx` / `TeacherDetails.tsx`):
   - Đảm bảo Drawer/Modal cập nhật giáo viên có trường `specialization` cho phép Admin nhập/sửa và gửi API `PUT /api/v1/admin/users/{id}` (hoặc API teacher profile tương ứng).
2. Sửa lỗi hiển thị trạng thái `LOCKED`:
   - Hiển thị đúng nhãn `"Đã khóa"` (Badge màu xám/đỏ) khi `status === 'LOCKED'`, không bị hiển thị nhầm thành `"Nghỉ phép"`.

---

## 3. TIÊU CHUẨN HOÀN THÀNH (DEFINITION OF DONE - DoD)
1. [ ] Bảng danh sách giáo viên và chi tiết giáo viên hiển thị chính xác chuyên môn thật từ API.
2. [ ] Giáo viên xem hồ sơ cá nhân chỉ thấy chuyên môn ở dạng read-only, không thể chỉnh sửa.
3. [ ] Admin có thể chỉnh sửa chuyên môn của giáo viên và lưu thành công vào backend.
4. [ ] Trạng thái tài khoản LOCKED hiển thị chính xác "Đã khóa".
5. [ ] Project Doctor (`/doctor`) và unit tests pass 100%.
6. [ ] Mở PR vào `develop` và Tester nghiệm thu trên Staging.
