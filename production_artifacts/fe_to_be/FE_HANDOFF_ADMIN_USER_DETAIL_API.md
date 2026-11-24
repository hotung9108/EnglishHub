# TÀI LIỆU BÀN GIAO KỸ THUẬT: ĐẶC TẢ API XEM CHI TIẾT NGƯỜI DÙNG DÀNH CHO ADMIN
## (FE TO BE HANDOFF — ADMIN USER DETAIL API SPECIFICATION)

---

### 1. THÔNG TIN BÀN GIAO (METADATA)

- **Người gửi (Sender)**: `@fe-primary`
- **Người nhận (Receiver)**: `@be-primary` / `@be-secondary`
- **Liên quan đến Issue**: [#191 — [FE][Admin Student Profile] URL của học viên được chọn nhưng hồ sơ hiển thị người khác](https://github.com/hotung9108/EnglishHub/issues/191)
- **Test Case liên quan**: `QA31-020`, `QA31-042`
- **Mức độ ưu tiên**: **High** (Cần thiết để hoàn thiện chuẩn kiến trúc RESTful và DDD)
- **Ngày lập**: 28/10/2026
- **Quy chuẩn tuân thủ**: [`convention-be.md`](file:///d:/Coding/EnglishHub/.agents/rules/convention-be.md), [`AGENTS.md`](file:///d:/Coding/EnglishHub/AGENTS.md)

---

### 2. BỐI CẢNH VÀ LÝ DO YÊU CẦU

Hiện tại trên module Quản trị người dùng (`com.english_hub.core.modules.user`), Backend đã cung cấp các API:
- `GET /api/v1/admin/users`: Lấy danh sách phân trang tối đa 100 người dùng/trang.
- `POST /api/v1/admin/users`: Tạo tài khoản người dùng mới.
- `PUT /api/v1/admin/users/{id}`: Cập nhật thông tin người dùng theo ID.
- `DELETE /api/v1/admin/users/{id}`: Xóa người dùng theo ID.
- `PATCH /api/v1/admin/users/{id}/status`: Cập nhật trạng thái `ACTIVE` / `LOCKED`.

Tuy nhiên, Backend **chưa có endpoint `GET /api/v1/admin/users/{id}`** để truy vấn thông tin chi tiết của một tài khoản theo ID.
- Điều này khiến Frontend khi mở trang xem hồ sơ (`/admin/students/:id` hoặc `/admin/teachers/:id`) phải sử dụng cơ chế tìm kiếm gián tiếp.
- Mặc dù Frontend đã được khắc phục tạm thời với cơ chế phân giải danh tính an toàn nhiều tầng (không fallback sai người), để hệ thống đạt chuẩn thiết kế kiến trúc Domain-Driven Design (DDD) và RESTful API bền vững, Backend cần bổ sung endpoint truy vấn trực tiếp này.

---

### 3. ĐẶC TẢ CHI TIẾT API CẦN BỔ SUNG

#### 3.1. Thông tin Endpoint
- **Phương thức (HTTP Method)**: `GET`
- **Đường dẫn (Path)**: `/api/v1/admin/users/{id}`
- **Bảo mật & Phân quyền**: Bắt buộc tài khoản có role `ADMIN` (xác thực qua JWT Bearer Token, kiểm tra bằng `currentUserProvider.requireAdmin()`).

#### 3.2. Parameters
- **Path Variable**: `id` (`Long` / `long`) — ID định danh duy nhất của người dùng cần xem.

#### 3.3. HTTP Responses
- **200 OK**: Trả về thông tin chi tiết của người dùng.
  - Tái sử dụng DTO sẵn có: [`UserResponse.java`](file:///d:/Coding/EnglishHub/backend/src/main/java/com/english_hub/core/modules/user/presentation/rest/dto/UserResponse.java).
  - Định dạng JSON mẫu:
    ```json
    {
      "id": 15,
      "fullName": "Nguyễn Văn A",
      "email": "student15@example.com",
      "role": "STUDENT",
      "status": "ACTIVE",
      "phone": "0912345678",
      "avatarUrl": null,
      "studentCode": "HV-0015",
      "dateOfBirth": "2005-08-15",
      "parentPhone": "0987654321"
    }
    ```
- **401 Unauthorized**: Thiếu hoặc không hợp lệ JWT token.
- **403 Forbidden**: Người gọi không phải là Quản trị viên (Admin).
- **404 Not Found**: Không tìm thấy người dùng với ID đã cung cấp (`"message": "Không tìm thấy người dùng."`).

---

### 4. HƯỚNG DẪN TRIỂN KHAI PHÍA BACKEND (SPRING BOOT DDD)

Toàn bộ các thành phần Domain Model và Repository đã có sẵn, `@be-primary` chỉ cần bổ sung 2 vị trí sau:

#### 4.1. Tầng Application Service: [`AdminUserService.java`](file:///d:/Coding/EnglishHub/backend/src/main/java/com/english_hub/core/modules/user/application/service/AdminUserService.java)
Tái sử dụng hàm helper private sẵn có `findUserOrThrow(userId)`:

```java
@Transactional(readOnly = true)
public User getUser(long userId) {
    currentUserProvider.requireAdmin();
    return findUserOrThrow(userId);
}
```

#### 4.2. Tầng Presentation Controller: [`AdminUserController.java`](file:///d:/Coding/EnglishHub/backend/src/main/java/com/english_hub/core/modules/user/presentation/rest/AdminUserController.java)
Thêm `@GetMapping("/{id}")`:

```java
@GetMapping("/{id}")
public ResponseEntity<UserResponse> getUser(@PathVariable long id) {
    User user = adminUserService.getUser(id);
    return ResponseEntity.ok(UserResponse.from(user));
}
```

#### 4.3. Kiểm thử MockMvc: [`AdminUserControllerMockMvcTest.java`](file:///d:/Coding/EnglishHub/backend/src/test/java/com/english_hub/core/modules/user/presentation/rest/AdminUserControllerMockMvcTest.java)
Bổ sung các test cases kiểm tra:
1. `getUser_whenCallerIsAdminAndExists_returns200Ok()`: Kiểm tra khớp các trường dữ liệu `id`, `email`, `fullName`, `role`.
2. `getUser_whenNotFound_returns404()`: Ném lỗi `ApiException.notFound("Không tìm thấy người dùng.")`.
3. `getUser_whenCallerIsTeacherOrStudent_returns403Forbidden()`: Kiểm tra từ chối quyền truy cập.

---

### 5. TRẠNG THÁI TÍCH HỢP PHÍA FRONTEND

- Phía Frontend (`@fe-primary`) đã chuẩn bị sẵn hàm `userService.getUserById(id)` tại [`frontend/src/api/services/user.service.ts`](file:///d:/Coding/EnglishHub/frontend/src/api/services/user.service.ts).
- Hàm này tự động gọi thử `GET /api/v1/admin/users/{id}` trước tiên. Ngay khi Backend triển khai và merge endpoint trên, Frontend sẽ lập tức kết nối và sử dụng trực tiếp mà không cần sửa đổi thêm mã nguồn.
