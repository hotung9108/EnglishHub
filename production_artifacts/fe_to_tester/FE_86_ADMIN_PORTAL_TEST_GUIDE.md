# FE-86: Hướng Dẫn Kiểm Thử Chuẩn Hóa Toàn Diện Admin Portal

**Trello Card**: [[FE-86] Chuẩn hóa toàn diện Admin Portal: Tối ưu Dashboard, Dynamic Schedule & Capacity, Fix kết nối Accounts/Students & Đổi vai trò tài khoản](https://trello.com/c/7bufAgr7)  
**Branch**: `feat/FE-86-admin-portal-modernization-and-bugfixes`  
**Git User**: `Maloque18705` (`maloque852@gmail.com`)  
**Assignee**: Tiến Sơn Trần (`@tinsntrn` / `Maloque18705`)  
**Tester**: `@Zawn-Tsu`  

---

## 1. Tổng Quan Thay Đổi

Bản cập nhật giải quyết trọn vẹn 7 bài toán chất lượng và trải nghiệm trên toàn bộ phân hệ Quản trị viên (Admin Portal):

1. **Khắc phục triệt để lỗi mạng khi vào Quản lý Tài khoản & Học viên**:
   - Loại bỏ race-condition của debounced query khi mount gây abort request khởi tạo.
   - Guard `axios.isCancel()` / `ERR_CANCELED` trong `errors.ts` và `useUsers.ts` để không bao giờ quăng thông báo ảo *"Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền."*
2. **Thiết kế lại Bố cục Dashboard "Tổng quan hệ thống" (`/admin/dashboard`)**:
   - Thay thế giao diện sơ sài bằng Bento Grid hiện đại:
     - Header trạng thái thời gian thực với badge `Hệ thống ổn định` và các phím tắt tác vụ nhanh (Tạo lớp, Quản lý tài khoản, Báo cáo thống kê).
     - 4 thẻ KPI động (Tổng học viên, Giảng viên hoạt động, Lớp học đang mở, Bài tập đã giao) có màu sắc trực quan, icon gradient và liên kết điều hướng trực tiếp.
     - 3 thẻ phân tích hiệu suất: Tỉ lệ hoàn thành (có progress bar trực quan), Điểm trung bình khóa học, Bài tập chờ chấm (có badge cảnh báo khối lượng).
     - Bảng tổng hợp tiến độ và sức chứa các lớp học gần đây.
3. **Bộ chọn Giáo viên Phụ trách thông minh (`TeacherPicker`)**:
   - Thay dropdown select thông thường bằng Combobox tìm kiếm thời gian thực theo tên, email, mã GV (`GV-xxx`).
   - Hiển thị avatar viết tắt, email giáo viên, và card preview giáo viên đã chọn có nút xóa/chọn lại linh hoạt.
4. **Bộ dựng Thời khóa biểu linh hoạt (`ScheduleBuilder`)**:
   - Cho phép tích chọn tự do các thứ trong tuần (T2 - CN) thay vì gò bó 3 option cố định.
   - Cung cấp sẵn các preset phổ biến (`T2 - T4 - T6`, `T3 - T5 - T7`, `T7 - CN`, `T2 đến T6`).
   - Tùy chỉnh giờ bắt đầu / giờ kết thúc theo bộ chọn thời gian hoặc các ca học mẫu (Sáng, Chiều, Tối, Tối muộn).
   - Hỗ trợ toggle nhập chuỗi lịch tự do cho các lịch đặc thù.
5. **Cơ chế Quản lý Sĩ số Thực tế & Chặn Vượt Sĩ số**:
   - Khi tạo lớp tại `AddClass`, sĩ số người dùng chọn (ví dụ 40) được lưu trữ đầy đủ trong mô tả lớp học (`description`).
   - Tại `ClassDetails`, tab "Cài đặt lớp" cho phép Admin xem và điều chỉnh sĩ số tối đa của lớp học.
   - Tại Modal "Thêm học viên có sẵn" (`SelectExistingStudentsModal`), hiển thị thanh tiến độ sĩ số hiện tại (`đã có / tối đa`), hiển thị số chỗ trống còn lại, tự động khóa checkbox khi lớp đã đủ học viên hoặc ngăn chọn vượt quá số chỗ trống còn lại.
6. **Cho phép Admin Đổi Vai Trò (Role) của Tài khoản**:
   - Tại `Accounts.tsx`, mở khóa trường "Vai trò" trong modal Chỉnh sửa tài khoản (có guard chặn Admin tự hạ quyền chính mình).
   - Bổ sung trường `role` vào frontend service `updateUser()`.
   - Bổ sung trường `role` vào Backend DTO `UpdateUserRequest`, `UpdateUserCommand` và `AdminUserService`, gọi `target.changeRole(newRole)` để cập nhật vai trò trực tiếp trong database.
7. **Nâng cấp Bố cục Bộ Lọc Báo cáo & Thống kê (`AdminReports.tsx`)**:
   - Bổ sung thanh chọn nhanh thời gian (Quick Date Presets: `Toàn thời gian`, `Hôm nay`, `7 ngày qua`, `30 ngày qua`, `Tháng này`).
   - Thiết kế lại Filter Card với header rõ ràng, badge số lượng bộ lọc đang kích hoạt, và nút "Xóa bộ lọc".
   - Sắp xếp grid 4 cột cân đối, loại bỏ xung đột icon lịch với native browser date picker.

---

## 2. Kịch Bản Kiểm Thử Chi Tiết (Test Cases)

### Test Case 1: Kiểm tra tải trang Tài khoản & Học viên không bị lỗi mạng
- **Bước 1**: Đăng nhập quyền Admin (`admin@englishhub.com` / `Admin@123`).
- **Bước 2**: Truy cập trực tiếp vào `https://staging.hotung9108.me/admin/accounts` hoặc chuyển qua lại giữa trang Tài khoản và Học viên (`/admin/students`).
- **Kỳ vọng**:
  - Dữ liệu danh sách người dùng hiển thị mượt mà ngay lần tải đầu tiên.
  - Tuyệt đối **KHÔNG** xuất hiện thông báo *"Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền."*
  - Không cần phải F5/reload lại trang mới thấy dữ liệu.

### Test Case 2: Kiểm tra Đổi vai trò (Role) tài khoản
- **Bước 1**: Tại trang `/admin/accounts`, chọn một tài khoản Học viên hoặc Giảng viên và nhấn **Chỉnh sửa**.
- **Bước 2**: Tại dropdown **Vai trò**, đổi từ `Học viên` sang `Giảng viên` hoặc ngược lại. Nhấn **Lưu thay đổi**.
- **Kỳ vọng**:
  - Modal lưu thành công không phát sinh lỗi.
  - Danh sách tài khoản hiển thị ngay vai trò mới tương ứng.
  - Đăng nhập bằng tài khoản vừa đổi vai trò: giao diện và quyền hạn hiển thị chính xác theo vai trò mới.
  - Đối với tài khoản Admin đang đăng nhập: dropdown Vai trò bị khóa mờ để ngăn Admin tự hạ quyền chính mình.

### Test Case 3: Kiểm tra Tạo lớp học với Bộ chọn GV, Thời khóa biểu linh hoạt & Sĩ số 40
- **Bước 1**: Vào `/admin/classes`, nhấn **Tạo lớp học mới**.
- **Bước 2**: Tại Bước 1, nhập sĩ số tối đa là **40**.
- **Bước 3**: Tại Bước 2:
  - Thử gõ tìm kiếm giáo viên trong `TeacherPicker` (ví dụ gõ tên hoặc email), kiểm tra danh sách lọc gợi ý và chọn 1 giáo viên.
  - Tại `ScheduleBuilder`, chọn các thứ tùy ý (ví dụ T3, T5, T7) và chọn ca học hoặc giờ tự chọn.
- **Bước 4**: Hoàn tất tạo lớp.
- **Kỳ vọng**:
  - Lớp học tạo thành công.
  - Vào chi tiết lớp học (`/admin/classes/:id`), sĩ số hiển thị chính xác là `0/40` (không bị lùi về 25).
  - Lịch học hiển thị chính xác chuỗi các thứ và giờ đã chọn.

### Test Case 4: Kiểm tra Rào cản Chặn vượt Sĩ số khi Thêm học viên
- **Bước 1**: Tại trang Chi tiết lớp học (`/admin/classes/:id`), nhấn **Thêm học viên** -> chọn **Chọn học viên có sẵn**.
- **Bước 2**: Kiểm tra header modal hiển thị rõ sĩ số hiện tại và số chỗ trống còn lại.
- **Bước 3**: Thử chọn số lượng học viên nhiều hơn số chỗ trống còn lại.
- **Kỳ vọng**:
  - Hệ thống chặn không cho tick thêm khi đã đạt giới hạn chỗ trống còn lại.
  - Nút "Thêm vào lớp" hiển thị số lượng học viên đã chọn và chỉ cho phép lưu khi hợp lệ.

### Test Case 5: Kiểm tra Bento Grid Dashboard Admin
- **Bước 1**: Vào `/admin/dashboard`.
- **Kỳ vọng**:
  - Bố cục Bento Grid hiển thị cân đối, sắc nét ở cả chế độ Dark và Light mode.
  - Bấm vào các thẻ KPI (Học viên, Giảng viên, Lớp học, Báo cáo) điều hướng chính xác đến phân hệ tương ứng.

### Test Case 6: Kiểm tra Bộ lọc Trang Báo cáo & Thống kê
- **Bước 1**: Vào `/admin/reports`.
- **Bước 2**: Bấm các nút chọn nhanh `Hôm nay`, `7 ngày qua`, `30 ngày qua`, `Tháng này`.
- **Kỳ vọng**:
  - Hai ô "Từ ngày" và "Đến ngày" tự động điền giá trị ngày tương ứng.
  - Dữ liệu tổng hợp và bảng lớp học tự động cập nhật theo khoảng thời gian được chọn.
  - Bấm "Xóa bộ lọc" để đưa về trạng thái mặc định ban đầu.

---

## 3. Kết Quả Chạy Quality Gates Nội Bộ
- **Backend Unit Tests**: PASS 100% (`AdminUserControllerTest`, `AdminUserServiceTest`, `UserTest`).
- **Frontend Vitest**: PASS 100% (`AdminReports.test.tsx` 11/11 tests, `ClassDetails.test.tsx` 24/24 tests).
- **TypeScript & Vite Build**: `tsc -b && vite build` PASS 100% (0 errors).
- **ESLint**: `eslint .` PASS 100% (0 errors, 0 warnings).
