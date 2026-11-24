# Hướng Dẫn Kiểm Thử: FE-69 (#189, #190, #195)

**Feature/Fix**: Khắc phục lỗi tìm kiếm tài khoản/học viên và phân quyền Admin  
**Liên quan đến**: QA31-003 (#189), QA31-014 (#190), QA31-036 (#195)  
**Phạm vi**: `frontend/src/pages/Accounts.tsx`, `frontend/src/pages/Students.tsx`, `frontend/src/api/services/user.service.ts`

---

## 1. Tóm tắt thay đổi

1. **[FE-69][#189] - Accounts Search**:
   - Chuyển từ tìm kiếm client-side (giới hạn 100 dòng đầu) sang tìm kiếm và phân trang trực tiếp từ server bằng hook `useUsers`.
   - Tìm kiếm theo email/họ tên sẽ gửi `GET /api/v1/admin/users?q=...` đến Backend, đảm bảo tài khoản mới tạo (nằm ngoài top 100) vẫn được tìm thấy ngay lập tức.
   - Hỗ trợ đầy đủ bộ lọc vai trò (`setRole`) và bộ lọc trạng thái (`ACTIVE` / `LOCKED`).

2. **[FE-70][#190] - Students Search**:
   - Chuyển trang `Students.tsx` sang đồng bộ server-side tìm kiếm qua `useUsers({ initialRole: 'STUDENT' })`.
   - Tìm kiếm học viên bằng email hoặc họ tên sẽ gọi `GET /api/v1/admin/users?role=STUDENT&q=...` thay vì tìm cục bộ trong 100 học viên đã nạp.
   - Thao tác khóa/mở khóa học viên tự động gọi `refetch()` để đồng bộ trạng thái mới nhất từ database.

3. **[FE-74][#195] - Create Admin Role**:
   - Mở rộng type `CreateUserPayload` trong `user.service.ts` cho phép `role: 'ADMIN'`.
   - Khôi phục nút **"Thêm tài khoản mới"** trên header màn hình Accounts (`t('accounts.addAccount')`).
   - Khôi phục Drawer tạo tài khoản với form nhập Họ tên, Email, Mật khẩu ban đầu và Chọn vai trò (`ADMIN`, `TEACHER`, `STUDENT`).
   - Sửa lỗi mapping role: gửi chính xác `role: formData.role` khi gọi `userService.createUser(...)`, không còn bị ép về `STUDENT`.

---

## 2. Hướng dẫn kiểm thử thủ công / Selenium

### Case 1: QA31-003 (Search Accounts tìm Teacher QA mới)
1. Đăng nhập Admin, tạo một Giáo viên QA mới qua API hoặc UI (email ví dụ: `qa31-test-teacher@example.invalid`).
2. Vào **Quản lý tài khoản (Accounts)** (`/admin/accounts`).
3. Nhập chính xác email giáo viên vào thanh tìm kiếm.
4. **Kết quả mong đợi**:
   - Hiển thị chính xác 1 dòng của giáo viên mới, role hiển thị `TEACHER`, trạng thái `ACTIVE`.
   - Có thể bấm icon Sửa (Edit) hoặc Khóa/Mở khóa thành công.

### Case 2: QA31-014 (Search Students tìm Học viên QA mới)
1. Đăng nhập Admin, chuẩn bị 1 học viên mới đã ghi danh vào lớp.
2. Vào **Học viên** (`/admin/students`).
3. Gõ email học viên vào ô tìm kiếm.
4. **Kết quả mong đợi**:
   - Danh sách trả về ngay học viên tương ứng, không bị treo 30 giây và không trả về danh sách rỗng.
   - Thử nghiệm khóa học viên (click Khóa): trạng thái chuyển sang `Bị khóa`, API xác nhận `LOCKED`.
   - Mở khóa: chuyển lại `Hoạt động`.

### Case 3: QA31-036 (Tạo tài khoản Admin lưu đúng role ADMIN)
1. Vào **Quản lý tài khoản (Accounts)**.
2. Bấm nút **"Thêm tài khoản mới"**.
3. Điền Họ tên, email mới (`qa31-test-admin@example.invalid`), mật khẩu hợp lệ (VD: `AdminPass123!`).
4. Chọn Vai trò: **Admin (Quản trị viên)**.
5. Bấm **Lưu tài khoản**.
6. **Kết quả mong đợi**:
   - Drawer đóng và danh sách tài khoản được tải lại.
   - Dùng API `GET /api/v1/admin/users?q=qa31-test-admin@example.invalid` kiểm tra: user được tạo thành công với `role: "ADMIN"`.
   - Tạo thử Teacher và Student để đảm bảo không bị hồi quy (regression).

---

## 3. Lệnh kiểm thử tự động

```bash
# Unit tests
npm --prefix frontend test

# Build check
npm --prefix frontend run build

# Lint check
npm --prefix frontend run lint
```
Tất cả 184 unit test và linting đều PASS.
