---
name: common-conventions
description: Shared conventions, API contracts, data formats, error handling standards, and authentication protocols between Frontend and Backend.
---

# EnglishHub Full-Stack Common Conventions (FE & BE Integration Guide)

Tài liệu này quy định **bộ quy ước tích hợp chung (Shared Contract)** giữa **Frontend (React 19 / TypeScript)** và **Backend (Java 21 / Spring Boot DDD)** cho dự án **EnglishHub**. 
Mục tiêu là đảm bảo hai bên phối hợp nhịp nhàng, không xung đột dữ liệu, dễ debug và tái sử dụng tối đa.

---

## 1. Quy ước Truyền nhận Dữ liệu (Payload & Wire Format)

### 1.1. Casing (Chữ hoa / chữ thường)
- **JSON Request Body & Query Params**: Toàn bộ key dùng **`camelCase`**.
  - Ví dụ: `{ "assignmentTitle": "IELTS Essay", "maxAttempts": 3 }`.
  - Không dùng `snake_case` (như `assignment_title`) trên đường truyền mạng HTTP.
- **Database Column (chỉ lưu nội bộ BE)**: Dùng `snake_case`. BE chịu trách nhiệm map sang `camelCase` khi serialize ra JSON DTO.
- **URL Path**: Toàn bộ chữ thường, nối bằng dấu gạch ngang (kebab-case) nếu là từ ghép:
  - Chuẩn: `/api/v1/assignment-submissions/{id}/ai-evaluate`.

### 1.2. Kiểu dữ liệu Chuẩn hóa (Data Types)
| Loại dữ liệu | Backend (Java) | Frontend (TS) | Định dạng trên JSON | Ghi chú quan trọng |
| :--- | :--- | :--- | :--- | :--- |
| **ID định danh** | `String` (UUID) hoặc `Long` | `string` | `"c3b58498-..."` hoặc `"1001"` | Với số nguyên 64-bit (`Long`), BE **phải serialize thành String** để tránh hiện tượng tràn số ở JavaScript Number (> $2^{53} - 1$). |
| **Thời gian** | `Instant` / `LocalDateTime` | `string` | ISO-8601 UTC: `"2026-09-14T14:30:00.000Z"` | BE luôn lưu và trả về giờ chuẩn UTC kèm đuôi `Z`. FE parse và hiển thị theo local timezone của người dùng. |
| **Ngày tháng** | `LocalDate` | `string` | `"YYYY-MM-DD"`: `"2026-09-14"` | Áp dụng cho ngày sinh, ngày bắt đầu khóa học không kèm giờ. |
| **Boolean** | `Boolean` / `boolean` | `boolean` | `true` hoặc `false` | Cấm dùng `1`/`0` hoặc `"true"`/`"false"`. Tên thuộc tính không dùng tiền tố dư thừa (`isActive` thay vì `isIsActive`). |
| **Mảng / Danh sách** | `List<T>` | `T[]` | `[]` | Khi không có dữ liệu, luôn trả mảng rỗng `[]`, tuyệt đối không trả `null`. |
| **Trường không có giá trị** | `null` | `null` | `null` | Dùng `null` cho đối tượng rỗng (ví dụ: `submissionDate: null` khi chưa nộp). |

---

## 2. Cấu trúc Response Chuẩn (API Envelope Specification)

Mọi API response (ngoại trừ download file nhị phân) **bắt buộc** đóng gói trong envelope chuẩn dưới đây.

### 2.1. Phản hồi Thành công (Success Response)

#### a) Khi trả về đối tượng đơn lẻ (Single Object)
- **HTTP Status**: `200 OK` (hoặc `201 Created` khi tạo mới).
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Assignment created successfully",
  "data": {
    "id": "asg-9872",
    "title": "Writing Task 1 - Line Graph",
    "status": "OPEN",
    "createdAt": "2026-09-14T10:00:00.000Z"
  },
  "timestamp": "2026-09-14T10:00:00.000Z"
}
```

#### b) Khi trả về danh sách phân trang (Paginated List)
- **HTTP Status**: `200 OK`.
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Classes retrieved successfully",
  "data": [
    { "id": "cls-1", "name": "IELTS 6.5 Intensive", "totalStudents": 24 },
    { "id": "cls-2", "name": "Grammar Foundation", "totalStudents": 18 }
  ],
  "meta": {
    "page": 1,
    "size": 10,
    "totalElements": 45,
    "totalPages": 5,
    "hasPrevious": false,
    "hasNext": true
  },
  "timestamp": "2026-09-14T10:00:00.000Z"
}
```

### 2.2. Phản hồi Thất bại (Error Response)
- **HTTP Status**: 4xx hoặc 5xx.
```json
{
  "success": false,
  "code": "VALIDATION_FAILED",
  "message": "Dữ liệu gửi lên không hợp lệ",
  "errors": [
    {
      "field": "deadline",
      "message": "Deadline phải lớn hơn thời gian hiện tại"
    },
    {
      "field": "maxScore",
      "message": "Điểm tối đa không được vượt quá 10.0"
    }
  ],
  "timestamp": "2026-09-14T10:00:00.000Z"
}
```

---

## 3. Bảng Mã Lỗi Chuẩn (Business Error Codes)

FE và BE dùng chung danh sách mã lỗi (`code`) dạng enum chữ hoa để hiển thị thông báo lỗi thân thiện hoặc kích hoạt hành vi tương ứng trên giao diện (i18n):

| HTTP Status | Error Code (`code`) | Ý nghĩa & Hành vi xử lý ở Frontend |
| :--- | :--- | :--- |
| **400** | `VALIDATION_FAILED` | Lỗi form input -> FE highlight lỗi từng input tương ứng trong mảng `errors`. |
| **400** | `BAD_REQUEST` | Yêu cầu không hợp lệ về mặt cú pháp hoặc nghiệp vụ cơ bản. |
| **401** | `AUTH_UNAUTHORIZED` | Chưa đăng nhập -> FE chuyển hướng về trang `/login`. |
| **401** | `TOKEN_EXPIRED` | Token hết hạn -> Axios Interceptor tự gọi API Refresh Token ngầm. |
| **403** | `FORBIDDEN_ACCESS` | Không đủ quyền -> FE hiển thị toast cảnh báo hoặc trang `403 Forbidden`. |
| **404** | `RESOURCE_NOT_FOUND` | Không tìm thấy dữ liệu (bài tập, lớp học, học viên đã bị xóa hoặc không tồn tại). |
| **409** | `RESOURCE_ALREADY_EXISTS` | Trùng lặp dữ liệu (Email học viên đã đăng ký, mã lớp đã tồn tại). |
| **422** | `DOMAIN_RULE_VIOLATION` | Vi phạm ràng buộc nghiệp vụ DDD (ví dụ: Nộp bài khi bài tập đã đóng, hết lượt nộp). |
| **500** | `INTERNAL_SERVER_ERROR` | Lỗi máy chủ -> FE hiển thị thông báo "Hệ thống đang bảo trì, vui lòng thử lại sau". |
| **504** | `AI_GRADING_TIMEOUT` | Quá trình chấm bài bằng AI quá thời gian -> Đưa vào hàng đợi nền, hẹn học viên kết quả sau. |

---

## 4. Chuẩn Phân Trang, Lọc & Sắp Xếp (Pagination, Filtering & Sorting)

### 4.1. Quy chuẩn Query Parameters từ Frontend gửi lên:
- **`page`**: Số thứ tự trang. **Thống nhất: Đánh số từ 1 (1-indexed)** để thân thiện với UI Pagination. Backend chịu trách nhiệm chuyển đổi sang 0-indexed khi query `PageRequest.of(page - 1, size)`.
- **`size`**: Số lượng bản ghi mỗi trang (Mặc định: `10`, tối đa: `100`).
- **`sort`**: Cú pháp `property,direction` (ví dụ: `createdAt,desc` hoặc `name,asc`).
- **`keyword`**: Từ khóa tìm kiếm chung (tìm kiếm theo tên, mã số).
- **`status`**: Bộ lọc enum (ví dụ: `status=OPEN&type=WRITING`).

**Ví dụ URL chuẩn:**
```http
GET /api/v1/assignments?page=1&size=10&sort=createdAt,desc&status=OPEN&keyword=IELTS
```

---

## 5. Quy trình Xác thực & Phân quyền (Authentication & Token Lifecycle)

### 5.1. Token Format & Header
- Client lưu Access Token trong Memory/Context hoặc LocalStorage.
- Mọi request cần xác thực bắt buộc đính kèm header:
  ```http
  Authorization: Bearer <access_token>
  ```

### 5.2. Luồng Refresh Token tự động (Silent Refresh ở Frontend)
1. Khi Access Token hết hạn (thời gian sống ngắn: ví dụ 15 phút), BE trả về HTTP `401` với `code: "TOKEN_EXPIRED"`.
2. Frontend sử dụng Axios / Fetch Response Interceptor:
   - Tạm giữ các request đang thất bại vào hàng đợi.
   - Gửi request `POST /api/v1/auth/refresh-token` với Refresh Token.
   - Khi nhận Access Token mới: Thay token mới vào header và gửi lại các request trong hàng đợi.
   - Nếu Refresh Token cũng hết hạn: Xóa thông tin đăng nhập và chuyển hướng người dùng về `/login`.

### 5.3. Vai trò người dùng (Roles & RBAC)
Hệ thống cố định 3 Role chính:
- `ROLE_ADMIN`: Toàn quyền quản trị hệ thống, quản lý tài khoản, cấu hình chung.
- `ROLE_TEACHER`: Quản lý lớp học được phân công, tạo bài tập, cấu hình rubric, xem điểm và chấm thủ công.
- `ROLE_STUDENT`: Xem bài tập được giao, nộp bài (Text/Audio), xem kết quả chấm điểm và feedback của AI/giáo viên.

---

## 6. Xử lý Upload Tệp & Chấm Điểm AI Bất Đồng Bộ

Vì bài tập tiếng Anh liên quan đến nhiều file đa phương tiện (Audio cho Speaking/Listening, PDF cho Reading/Writing), FE và BE tuân thủ:

### 6.1. Giới hạn Tệp (File Constraints)
- **Audio (Speaking)**: Hỗ trợ định dạng `.mp3`, `.wav`, `.m4a`. Dung lượng tối đa: **25MB**.
- **Tài liệu (Document / Essay)**: Hỗ trợ `.pdf`, `.docx`. Dung lượng tối đa: **10MB**.
- Phương thức upload: Dùng `multipart/form-data` với trường file là `file`.

### 6.2. Luồng Chấm Điểm AI Bất Đồng Bộ (Async AI Grading Pattern)
Quá trình chấm bài của AI (transcribe qua Whisper + evaluate qua GPT/LLM) có thể mất từ **5 đến 20 giây**. **Tuyệt đối không giữ HTTP Request treo** để chờ AI:

1. **Bước 1 (Submit)**: Học viên nộp bài qua `POST /api/v1/assignments/{id}/submissions`.
   - Backend lưu bài nộp vào DB với trạng thái `status: "EVALUATING"`.
   - Backend trả về ngay lập tức HTTP `202 Accepted` kèm `submissionId`.
2. **Bước 2 (Chấm ngầm)**: Backend kích hoạt Domain Event `SubmissionCreatedEvent`, Worker/Domain Service chạy ngầm gọi AI chấm bài.
3. **Bước 3 (Tracking ở Frontend)**:
   - Frontend hiển thị giao diện chờ "Hệ thống AI đang phân tích bài nộp của bạn...".
   - Frontend thực hiện Polling ngắn (`GET /api/v1/submissions/{submissionId}/status`) mỗi 3 giây (tối đa 10 lần), hoặc lắng nghe qua Server-Sent Events (SSE).
4. **Bước 4 (Hoàn tất)**: Khi trạng thái chuyển sang `GRADED`, Frontend tự động render bảng điểm và nhận xét chi tiết.

---

## 7. Quy trình Bàn giao & Đồng bộ Hợp đồng API (`docs/api-contract.md`)

Khi triển khai một tính năng mới:
1. **Backend Agent / Dev**:
   - Viết API theo chuẩn DDD.
   - Cập nhật định nghĩa endpoint, request/response schema vào file [`docs/api-contract.md`](file:///d:/Codin/utc-code/HK4_1/Project1/EnglishHub/docs/api-contract.md).
   - Thả file hướng dẫn test vào `production_artifacts/be_to_tester/`.
2. **Frontend Agent / Dev**:
   - Đọc [`docs/api-contract.md`](file:///d:/Codin/utc-code/HK4_1/Project1/EnglishHub/docs/api-contract.md) để định nghĩa TypeScript Interface tương ứng trong `src/types/`.
   - Viết API function trong `src/api/` tuân thủ đúng envelope `ApiResponse<T>`.
   - Hoàn thiện UI và xử lý đủ các trạng thái `isLoading`, `isError`, `isEmpty`.
