# EnglishHub API Documentation

> **Base URL:**  
> - Local: `http://localhost:8080`  
> - Staging (Cloudflare Tunnel): `https://api-staging.hotung9108.me`  
> **Version:** v1  
> **Auth:** Bearer JWT token (header: `Authorization: Bearer <token>`)  
> **Mô tả:** REST API cho nền tảng quản lý bài tập & chấm chữa bài tiếng Anh.

---

## Mục lục

1. [Auth](#1-auth)
2. [User (Bản thân)](#2-user-bản-thân)
3. [Admin – Quản lý User](#3-admin--quản-lý-user)
4. [Class – Lớp học](#4-class--lớp-học)
5. [Assignment – Bài tập](#5-assignment--bài-tập)
6. [Module – Phần bài tập](#6-module--phần-bài-tập)
7. [Question – Câu hỏi](#7-question--câu-hỏi)
8. [Submission – Bài nộp](#8-submission--bài-nộp)
9. [Submission Module – Phần bài nộp](#9-submission-module--phần-bài-nộp)
10. [Grading – Chấm điểm](#10-grading--chấm-điểm)
11. [Annotations – Chú thích câu trả lời](#11-annotations--chú-thích-câu-trả-lời)
12. [Student Evaluation – Nhận xét học sinh](#12-student-evaluation--nhận-xét-học-sinh)
13. [Reports – Báo cáo & thống kê](#13-reports--báo-cáo--thống-kê)
14. [DTO Objects](#14-dto-objects)
15. [Lịch sử cập nhật](#15-lịch-sử-cập-nhật)

---

## 1. Auth

### POST `/api/v1/auth/login`
Đăng nhập, lấy access token và refresh token.

**Request Body:** `LoginRequest`

**Response:** `AuthResponse`

---

### POST `/api/v1/auth/refresh`
Làm mới access token bằng refresh token.

**Request Body:** `RefreshRequest`

**Response:** `RefreshResponse`

---

### POST `/api/v1/auth/logout`
Đăng xuất, vô hiệu hóa refresh token.

**Request Body:** `LogoutRequest`

**Response:** `LogoutResponse`

---

### POST `/api/v1/auth/forgot-password`
Yêu cầu quên mật khẩu: hệ thống gửi mã OTP tới email của người dùng.

**Request Body:** `ForgotPasswordRequest`

**Response:** `ForgotPasswordResponse`

> ⚠️ `ForgotPasswordResponse.debugOtp` là field phục vụ debug, chỉ nên xuất hiện ở môi trường dev/staging. Client không được phụ thuộc vào field này.

---

### POST `/api/v1/auth/reset-password`
Đặt lại mật khẩu bằng OTP (hoặc token) nhận được sau bước `forgot-password`.

**Request Body:** `ResetPasswordRequest`

**Response:** `ResetPasswordResponse`

---

## 2. User (Bản thân)

### GET `/api/v1/users/me`
Lấy thông tin profile của người dùng đang đăng nhập.

**Response:** `UserResponse`

---

### PUT `/api/v1/users/me`
Cập nhật thông tin profile của người dùng đang đăng nhập.

**Request Body:** `UpdateOwnProfileRequest`

**Response:** `MessageResponse`

---

### PATCH `/api/v1/users/me/password`
Đổi mật khẩu của người dùng đang đăng nhập.

**Request Body:** `ChangePasswordRequest`

**Response:** `MessageResponse`

---

## 3. Admin – Quản lý User

### GET `/api/v1/admin/users`
Lấy danh sách tất cả người dùng (có phân trang, tìm kiếm).

**Query Params:**

| Tên | Kiểu | Mô tả |
|-----|------|--------|
| `q` | string | Từ khoá tìm kiếm |
| `role` | string | Lọc theo role |
| `page` | integer | Số trang (mặc định `1`) |
| `limit` | integer | Số bản ghi mỗi trang (mặc định `20`) |

**Response:** `AdminUserListResponse`

---

### POST `/api/v1/admin/users`
Tạo người dùng mới.

**Request Body:** `CreateUserRequest`

**Response:** `CreatedUserResponse`

---

### PUT `/api/v1/admin/users/{id}`
Cập nhật thông tin người dùng theo ID.

**Path Params:** `id` (int64)

**Request Body:** `UpdateUserRequest`

**Response:** `MessageResponse`

---

### DELETE `/api/v1/admin/users/{id}`
Xoá người dùng theo ID.

**Path Params:** `id` (int64)

**Response:** `MessageResponse`

---

### PATCH `/api/v1/admin/users/{id}/status`
Cập nhật trạng thái người dùng (active/inactive...).

**Path Params:** `id` (int64)

**Request Body:** `UpdateUserStatusRequest`

**Response:** `MessageResponse`

---

## 4. Class – Lớp học

### GET `/api/v1/classes`
Lấy danh sách lớp học (có phân trang, lọc theo trạng thái).

**Query Params:**

| Tên | Kiểu | Mô tả |
|-----|------|--------|
| `status` | string | Lọc theo trạng thái lớp |
| `page` | integer | Số trang (mặc định `1`) |
| `limit` | integer | Số bản ghi mỗi trang (mặc định `20`) |

**Response:** `ClassListResponse`

---

### POST `/api/v1/classes`
Tạo lớp học mới.

**Request Body:** `CreateClassRequest`

**Response:** `CreatedClassResponse`

---

### GET `/api/v1/classes/{id}`
Lấy chi tiết lớp học.

**Path Params:** `id` (int64)

**Response:** `ClassDetailResponse`

---

### PUT `/api/v1/classes/{id}`
Cập nhật thông tin lớp học.

**Path Params:** `id` (int64)

**Request Body:** `UpdateClassRequest`

**Response:** `MessageResponse`

---

### DELETE `/api/v1/classes/{id}`
Xoá lớp học.

**Path Params:** `id` (int64)

**Response:** `MessageResponse`

---

### GET `/api/v1/classes/{id}/members`
Lấy danh sách thành viên của lớp học.

**Path Params:** `id` (int64)

**Response:** `ClassMemberListResponse`

---

### POST `/api/v1/classes/{id}/members`
Thêm học sinh vào lớp học.

**Path Params:** `id` (int64)

**Request Body:** `AddClassMemberRequest`

**Response:** `AddedClassMemberResponse`

---

### DELETE `/api/v1/classes/{id}/members/{memberId}`
Xoá thành viên khỏi lớp học.

**Path Params:** `id` (int64), `memberId` (int64)

**Response:** `MessageResponse`

---

## 5. Assignment – Bài tập

### GET `/api/v1/classes/{classId}/assignments`
Lấy danh sách bài tập của một lớp (có phân trang, lọc trạng thái).

**Path Params:** `classId` (int64)

**Query Params:**

| Tên | Kiểu | Mô tả |
|-----|------|--------|
| `status` | string | Lọc theo trạng thái |
| `page` | integer | Số trang (mặc định `1`) |
| `limit` | integer | Số bản ghi mỗi trang (mặc định `20`) |

**Response:** `AssignmentListResponse`

---

### POST `/api/v1/classes/{classId}/assignments`
Tạo bài tập mới trong lớp học.

**Path Params:** `classId` (int64)

**Request Body:** `CreateAssignmentRequest`

**Response:** `CreatedAssignmentResponse`

---

### GET `/api/v1/assignments/{assignmentId}`
Lấy chi tiết bài tập.

**Path Params:** `assignmentId` (int64)

**Response:** `AssignmentDetailResponse`

---

### PUT `/api/v1/assignments/{assignmentId}`
Cập nhật thông tin bài tập.

**Path Params:** `assignmentId` (int64)

**Request Body:** `UpdateAssignmentRequest`

**Response:** `MessageResponse`

---

### DELETE `/api/v1/assignments/{assignmentId}`
Xoá bài tập.

**Path Params:** `assignmentId` (int64)

**Response:** `MessageResponse`

---

### PATCH `/api/v1/assignments/{assignmentId}/status`
Cập nhật trạng thái bài tập (mở/đóng...).

**Path Params:** `assignmentId` (int64)

**Request Body:** `UpdateAssignmentStatusRequest`

**Response:** `MessageResponse`

---

## 6. Module – Phần bài tập

### GET `/api/v1/assignments/{assignmentId}/modules`
Lấy danh sách module của một bài tập.

**Path Params:** `assignmentId` (int64)

**Response:** `ModuleListResponse`

---

### POST `/api/v1/assignments/{assignmentId}/modules`
Tạo module mới trong bài tập.

**Path Params:** `assignmentId` (int64)

**Request Body:** `CreateModuleRequest`

**Response:** `CreatedModuleResponse`

---

### GET `/api/v1/modules/{moduleId}`
Lấy chi tiết module.

**Path Params:** `moduleId` (int64)

**Response:** `ModuleDetailResponse`

---

### PUT `/api/v1/modules/{moduleId}`
Cập nhật thông tin module.

**Path Params:** `moduleId` (int64)

**Request Body:** `UpdateModuleRequest`

**Response:** `ModuleMessageResponse`

---

### DELETE `/api/v1/modules/{moduleId}`
Xoá module.

**Path Params:** `moduleId` (int64)

**Response:** `ModuleMessageResponse`

---

### POST `/api/v1/modules/{moduleId}/audio`
Upload file audio cho module (multipart/form-data).

**Path Params:** `moduleId` (int64)

**Request Body:** `multipart/form-data`

| Field | Kiểu | Mô tả |
|-------|------|--------|
| `file` | binary | File audio cần upload |

**Response:** `AudioUploadResponse`

---

## 7. Question – Câu hỏi

### GET `/api/v1/modules/{moduleId}/questions`
Lấy danh sách câu hỏi của module.

**Path Params:** `moduleId` (int64)

**Response:** `QuestionListResponse`

---

### POST `/api/v1/modules/{moduleId}/questions`
Tạo câu hỏi mới trong module.

**Path Params:** `moduleId` (int64)

**Request Body:** `CreateQuestionRequest`

**Response:** `CreatedQuestionResponse`

---

### GET `/api/v1/questions/{questionId}`
Lấy chi tiết câu hỏi.

**Path Params:** `questionId` (int64)

**Response:** `QuestionResponse`

---

### PUT `/api/v1/questions/{questionId}`
Cập nhật câu hỏi.

**Path Params:** `questionId` (int64)

**Request Body:** `UpdateQuestionRequest`

**Response:** `QuestionMessageResponse`

---

### DELETE `/api/v1/questions/{questionId}`
Xoá câu hỏi.

**Path Params:** `questionId` (int64)

**Response:** `QuestionMessageResponse`

---

## 8. Submission – Bài nộp

### GET `/api/v1/submissions`
Lấy danh sách bài nộp (có phân trang, lọc nhiều tiêu chí).

**Query Params:**

| Tên | Kiểu | Mô tả |
|-----|------|--------|
| `assignmentId` | int64 | Lọc theo bài tập |
| `studentId` | int64 | Lọc theo học sinh |
| `status` | string | Lọc theo trạng thái |
| `page` | integer | Số trang (mặc định `1`) |
| `limit` | integer | Số bản ghi mỗi trang (mặc định `20`) |

**Response:** `SubmissionListResponse`

---

### POST `/api/v1/assignments/{assignmentId}/submissions`
Bắt đầu (tạo) một lượt nộp bài mới cho bài tập.

**Path Params:** `assignmentId` (int64)

**Response:** `StartSubmissionResponse`

---

### GET `/api/v1/submissions/{id}`
Lấy chi tiết bài nộp.

**Path Params:** `id` (int64)

**Response:** `SubmissionDetailResponse`

---

### POST `/api/v1/submissions/{id}/submit`
Nộp bài (chốt trạng thái submitted).

**Path Params:** `id` (int64)

**Response:** `SubmitResponse`

---

## 9. Submission Module – Phần bài nộp

### GET `/api/v1/submission-modules/{id}`
Lấy chi tiết một phần bài nộp (submission module), bao gồm câu hỏi và câu trả lời.

**Path Params:** `id` (int64)

**Response:** `SubmissionModuleDetailResponse`

---

### POST `/api/v1/submission-modules/{id}/submit`
Nộp câu trả lời cho một submission module.

**Path Params:** `id` (int64)

**Request Body:** `SubmitModuleRequest`

**Response:** `SubmitModuleResponse`

---

### POST `/api/v1/submission-modules/{id}/document-upload-url`
Lấy pre-signed URL để upload file tài liệu cho submission module.

**Path Params:** `id` (int64)

**Request Body:** `UploadUrlRequest`

**Response:** `UploadUrlResponse`

---

### POST `/api/v1/submission-modules/{id}/audio-upload-url`
Lấy pre-signed URL để upload file audio cho submission module.

**Path Params:** `id` (int64)

**Request Body:** `UploadUrlRequest`

**Response:** `UploadUrlResponse`

---

## 10. Grading – Chấm điểm

### GET `/api/v1/gradings`
Lấy danh sách các bản ghi chấm điểm (có phân trang, lọc nhiều tiêu chí).

**Query Params:**

| Tên | Kiểu | Mô tả |
|-----|------|--------|
| `classId` | int64 | Lọc theo lớp |
| `studentId` | int64 | Lọc theo học sinh |
| `status` | string | Lọc theo trạng thái chấm |
| `page` | integer | Số trang (mặc định `1`) |
| `limit` | integer | Số bản ghi mỗi trang (mặc định `20`) |

**Response:** `GradingListResponse`

---

### GET `/api/v1/gradings/{id}`
Lấy chi tiết bản ghi chấm điểm.

**Path Params:** `id` (int64)

**Response:** `GradingDetailResponse`

---

### PUT `/api/v1/gradings/{id}`
Cập nhật điểm cuối & nhận xét cuối của giáo viên.

**Path Params:** `id` (int64)

**Request Body:** `UpdateFinalGradeRequest`

**Response:** `GradingMessageResponse`

---

### GET `/api/v1/gradings/{id}/change-logs`
Lấy lịch sử thay đổi điểm của một bản ghi chấm.

**Path Params:** `id` (int64)

**Response:** `GradingChangeLogListResponse`

---

### GET `/api/v1/submission-modules/{id}/grading`
Lấy thông tin chấm điểm của một submission module.

**Path Params:** `id` (int64)

**Response:** `SubmissionModuleGradingResponse`

---

### POST `/api/v1/submission-modules/{id}/grading/ai-analyze`
Kích hoạt AI phân tích & chấm điểm tự động cho submission module.

**Path Params:** `id` (int64)

**Response:** `GradingMessageResponse`

---

### GET `/api/v1/answers/{id}/annotations`
Lấy danh sách annotation (chú thích lỗi) của một câu trả lời.

**Path Params:** `id` (int64)

**Response:** `AnswerAnnotationListResponse`

---

### POST `/api/v1/answers/{id}/annotations`
Tạo annotation mới cho câu trả lời.

**Path Params:** `id` (int64)

**Request Body:** `CreateAnswerAnnotationRequest`

**Response:** `CreatedAnswerAnnotationResponse`

---

## 11. Annotations – Chú thích câu trả lời

### PATCH `/api/v1/annotations/{id}/review`
Cập nhật trạng thái review của annotation.

**Path Params:** `id` (int64)

**Request Body:** `ReviewAnswerAnnotationRequest`

**Response:** `GradingMessageResponse`

---

### DELETE `/api/v1/annotations/{id}`
Xoá annotation.

**Path Params:** `id` (int64)

**Response:** `GradingMessageResponse`

---

## 12. Student Evaluation – Nhận xét học sinh

### GET `/api/v1/students/{id}/evaluations`
Lấy danh sách nhận xét của một học sinh (có phân trang, lọc theo lớp).

**Path Params:** `id` (int64)

**Query Params:**

| Tên | Kiểu | Mô tả |
|-----|------|--------|
| `classId` | int64 | Lọc theo lớp |
| `fromDate` | string | Lọc nhận xét từ ngày (OpenAPI không khai báo format cụ thể) |
| `toDate` | string | Lọc nhận xét đến ngày (OpenAPI không khai báo format cụ thể) |
| `page` | integer | Số trang (mặc định `1`) |
| `limit` | integer | Số bản ghi mỗi trang (mặc định `20`) |

**Response:** `StudentEvaluationListResponse`

---

### POST `/api/v1/students/{id}/evaluations`
Tạo nhận xét mới cho học sinh.

**Path Params:** `id` (int64)

**Request Body:** `CreateStudentEvaluationRequest`

**Response:** `MessageResponse`

---

### GET `/api/v1/evaluations/{id}`
Lấy chi tiết một nhận xét.

**Path Params:** `id` (int64)

**Response:** `StudentEvaluationResponse`

---

### PUT `/api/v1/evaluations/{id}`
Cập nhật nội dung nhận xét.

**Path Params:** `id` (int64)

**Request Body:** `UpdateStudentEvaluationRequest`

**Response:** `MessageResponse`

---

### DELETE `/api/v1/evaluations/{id}`
Xoá nhận xét.

**Path Params:** `id` (int64)

**Response:** `MessageResponse`

---

---

## 13. Reports – Báo cáo & thống kê

Nhóm endpoint báo cáo và thống kê lớp học (tag `Reports`). Các tham số `from`/`to` có kiểu `date` (`YYYY-MM-DD`), đều không bắt buộc.

### GET `/api/v1/reports/overview`
Tổng quan báo cáo theo khoảng thời gian.

**Query Params:**

| Tên | Kiểu | Mô tả |
|-----|------|--------|
| `from` | string (date) | Từ ngày |
| `to` | string (date) | Đến ngày |
| `classId` | int64 | Lọc theo lớp |
| `teacherId` | int64 | Lọc theo giáo viên |

**Response:** `ReportOverviewResponse`

---

### GET `/api/v1/reports/classes`
Thống kê danh sách lớp (có phân trang).

**Query Params:**

| Tên | Kiểu | Mô tả |
|-----|------|--------|
| `from` | string (date) | Từ ngày |
| `to` | string (date) | Đến ngày |
| `teacherId` | int64 | Lọc theo giáo viên |
| `page` | integer | Số trang (mặc định `1`) |
| `limit` | integer | Số bản ghi mỗi trang (mặc định `20`) |

**Response:** `ReportClassListResponse`

---

### GET `/api/v1/reports/classes/{id}/progress`
Tiến độ và điểm của một lớp.

**Path Params:** `id` (int64) – ID lớp

**Query Params:**

| Tên | Kiểu | Mô tả |
|-----|------|--------|
| `from` | string (date) | Từ ngày |
| `to` | string (date) | Đến ngày |
| `threshold` | number | Ngưỡng điểm (%) để xác định học viên dưới trung bình (mặc định `50`) |

**Response:** `ReportClassProgressResponse`

---

### GET `/api/v1/reports/students/{id}/progress`
Tiến bộ của một học viên.

**Path Params:** `id` (int64) – ID học viên

**Query Params:**

| Tên | Kiểu | Mô tả |
|-----|------|--------|
| `classId` | int64 | Lọc theo lớp |
| `from` | string (date) | Từ ngày |
| `to` | string (date) | Đến ngày |

**Response:** `ReportStudentProgressResponse`

---

## 14. DTO Objects

### Request DTOs

---

#### `LoginRequest`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `email` | string | Email đăng nhập |
| `password` | string | Mật khẩu |

---

#### `RefreshRequest`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `refreshToken` | string | Refresh token hiện tại |

---

#### `LogoutRequest`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `refreshToken` | string | Refresh token cần huỷ |

---

#### `ForgotPasswordRequest`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `email` | string | Email tài khoản cần khôi phục mật khẩu |

---

#### `ResetPasswordRequest`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `email` | string | Email tài khoản |
| `otp` | string | Mã OTP nhận qua email |
| `token` | string | Token đặt lại mật khẩu |
| `newPassword` | string | Mật khẩu mới |

> OpenAPI không đánh dấu field nào là bắt buộc; cần xác nhận với backend khi nào dùng `otp` và khi nào dùng `token`.

---

#### `UpdateOwnProfileRequest`
| Field | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|--------|
| `fullName` | string\|null | Không | Họ và tên |
| `phone` | string\|null | Không | Số điện thoại |
| `avatarUrl` | string\|null | Không | URL ảnh đại diện |

---

#### `ChangePasswordRequest`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `currentPassword` | string | Mật khẩu hiện tại |
| `newPassword` | string | Mật khẩu mới |

---

#### `CreateUserRequest`
| Field | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|--------|
| `fullName` | string | Có | Họ và tên |
| `email` | string | Có | Email |
| `password` | string | Có | Mật khẩu |
| `role` | string | Có | Role (STUDENT, TEACHER, ADMIN…) |
| `specialization` | string\|null | Không | Chuyên ngành (giáo viên) |
| `studentCode` | string\|null | Không | Mã học sinh |
| `dateOfBirth` | string (date) | Không | Ngày sinh `YYYY-MM-DD` |
| `parentPhone` | string\|null | Không | SĐT phụ huynh |

---

#### `UpdateUserRequest`
| Field | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|--------|
| `fullName` | string\|null | Không | Họ và tên |
| `phone` | string\|null | Không | Số điện thoại |
| `specialization` | string\|null | Không | Chuyên ngành |
| `studentCode` | string\|null | Không | Mã học sinh |
| `dateOfBirth` | string\|null (date) | Không | Ngày sinh `YYYY-MM-DD` |
| `parentPhone` | string\|null | Không | SĐT phụ huynh |

---

#### `UpdateUserStatusRequest`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `status` | string | Trạng thái mới (ACTIVE / INACTIVE…) |

---

#### `CreateClassRequest`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `name` | string | Tên lớp |
| `level` | string | Cấp độ |
| `description` | string | Mô tả |
| `startDate` | string (date) | Ngày bắt đầu `YYYY-MM-DD` |
| `endDate` | string (date) | Ngày kết thúc `YYYY-MM-DD` |
| `teacherId` | int64 | ID giáo viên phụ trách |

---

#### `UpdateClassRequest`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `name` | string | Tên lớp |
| `level` | string | Cấp độ |
| `description` | string | Mô tả |
| `endDate` | string (date) | Ngày kết thúc `YYYY-MM-DD` |
| `status` | string | Trạng thái lớp |
| `teacherId` | int64 | ID giáo viên |

---

#### `AddClassMemberRequest`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `studentId` | int64 | ID học sinh cần thêm |

---

#### `CreateAssignmentRequest`
| Field | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|--------|
| `title` | string (tối đa 200 ký tự) | Có | Tiêu đề bài tập |
| `description` | string | Không | Mô tả |
| `openAt` | string (date-time) | Có | Thời điểm mở `ISO 8601` |
| `closeAt` | string (date-time) | Có | Thời điểm đóng `ISO 8601` |
| `maxSubmissions` | integer (int32, ≥ 0) | Không | Số lần nộp tối đa |

---

#### `UpdateAssignmentRequest`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `title` | string (tối đa 200 ký tự) | Tiêu đề bài tập |
| `description` | string | Mô tả |
| `openAt` | string (date-time) | Thời điểm mở |
| `closeAt` | string (date-time) | Thời điểm đóng |
| `maxSubmissions` | integer (int32, ≥ 0) | Số lần nộp tối đa |

---

#### `UpdateAssignmentStatusRequest`
| Field | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|--------|
| `status` | string (không rỗng) | Có | Trạng thái mới của bài tập |

---

#### `CreateModuleRequest`
| Field | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|--------|
| `skill` | string enum: `READING`, `LISTENING`, `WRITING`, `SPEAKING` | Có | Kỹ năng |
| `taskType` | string enum: `QUIZ`, `REWRITE`, `RECORDING`, `ESSAY` | Có | Loại task |
| `orderIndex` | integer (int32, ≥ 0) | Có | Thứ tự hiển thị |
| `instructions` | string | Không | Hướng dẫn cho học sinh |
| `aiInstruction` | string | Không | Hướng dẫn dành cho AI chấm |
| `maxScore` | number (≥ 0.01) | Không | Điểm tối đa |

---

#### `UpdateModuleRequest`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `instructions` | string | Hướng dẫn cho học sinh |
| `aiInstruction` | string | Hướng dẫn dành cho AI chấm |
| `maxScore` | number (≥ 0.01) | Điểm tối đa |
| `orderIndex` | integer (int32, ≥ 0) | Thứ tự hiển thị |

---

#### `CreateQuestionRequest`
| Field | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|--------|
| `content` | string (không rỗng) | Có | Nội dung câu hỏi |
| `questionType` | string enum: `MULTIPLE_CHOICE`, `SHORT_ANSWER` | Có | Loại câu hỏi |
| `correctAnswer` | `MultipleChoiceCorrectAnswer` \| `ShortAnswerCorrectAnswer` | Có | Đáp án đúng (polymorphic, xem bên dưới) |
| `score` | number (≥ 0) | Không | Điểm của câu hỏi |
| `orderIndex` | integer (int32, ≥ 0) | Có | Thứ tự hiển thị |

---

#### `UpdateQuestionRequest`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `content` | string | Nội dung câu hỏi |
| `correctAnswer` | `MultipleChoiceCorrectAnswer` \| `ShortAnswerCorrectAnswer` | Đáp án đúng (polymorphic) |
| `score` | number (≥ 0) | Điểm |
| `orderIndex` | integer (int32, ≥ 0) | Thứ tự |

---

#### `SubmitModuleRequest`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `answers` | `AnswerPayload[]` | Danh sách câu trả lời |

---

#### `AnswerPayload`
| Field | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|--------|
| `questionId` | int64 | Có | ID câu hỏi |
| `content` | `MultipleChoiceAnswerContent` \| `ShortAnswerAnswerContent` | Có | Nội dung câu trả lời (polymorphic, xem bên dưới) |

> Cả `correctAnswer` và `content` là kiểu polymorphic (`oneOf`); chọn subtype theo `questionType` của câu hỏi. Các subtype được mô tả ngay bên dưới.

---

#### `MultipleChoiceCorrectAnswer` _(kế thừa `CorrectAnswer`)_
| Field | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|--------|
| `options` | `QuestionOption[]` (đúng 4 phần tử) | Có | Danh sách 4 lựa chọn, kèm đánh dấu đáp án đúng |

---

#### `ShortAnswerCorrectAnswer` _(kế thừa `CorrectAnswer`)_
| Field | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|--------|
| `correctAnswer` | string (không rỗng) | Có | Đáp án đúng dạng văn bản |

---

#### `MultipleChoiceAnswerContent` _(kế thừa `AnswerContent`)_
| Field | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|--------|
| `selectedOptionIds` | `int64[]` (≥ 1 phần tử, mỗi phần tử ≥ 0) | Có | Danh sách ID lựa chọn học sinh đã chọn |

---

#### `ShortAnswerAnswerContent` _(kế thừa `AnswerContent`)_
| Field | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|--------|
| `text` | string (không rỗng) | Có | Nội dung trả lời |

---

#### `UploadUrlRequest`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `mimeType` | string | MIME type của file (vd: `audio/mpeg`, `application/pdf`) |

---

#### `UpdateFinalGradeRequest`
| Field | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|--------|
| `finalScore` | number | Có | Điểm cuối cùng |
| `finalFeedback` | string | Không | Nhận xét cuối cùng của giáo viên |
| `note` | string | Không | Ghi chú nội bộ (lưu vào change log) |

---

#### `CreateAnswerAnnotationRequest`
| Field | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|--------|
| `startOffset` | integer (int32) | Có | Vị trí bắt đầu trong văn bản |
| `endOffset` | integer (int32) | Có | Vị trí kết thúc trong văn bản |
| `errorType` | string | Không | Loại lỗi (grammar, spelling…) |
| `comment` | string | Không | Bình luận của giáo viên |
| `suggestedFix` | string | Không | Gợi ý sửa lỗi |

---

#### `ReviewAnswerAnnotationRequest`
| Field | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|--------|
| `reviewStatus` | string (không rỗng) | Có | Trạng thái review (ACCEPTED / REJECTED…) |

---

#### `CreateStudentEvaluationRequest`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `classId` | int64 | ID lớp học |
| `content` | string | Nội dung nhận xét |

---

#### `UpdateStudentEvaluationRequest`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `content` | string | Nội dung nhận xét mới |

---

### Response DTOs

---

#### `MessageResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `message` | string | Thông báo kết quả |

---

#### `AuthResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `message` | string | Thông báo |
| `accessToken` | string | JWT access token |
| `refreshToken` | string | JWT refresh token |
| `user` | `AuthUserResponse` | Thông tin người dùng |

---

#### `AuthUserResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `id` | int64 | ID người dùng |
| `fullName` | string | Họ và tên |
| `email` | string | Email |
| `role` | string | Role |

---

#### `RefreshResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `message` | string | Thông báo |
| `accessToken` | string | Access token mới |

---

#### `LogoutResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `message` | string | Thông báo |

---

#### `ForgotPasswordResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `message` | string | Thông báo |
| `email` | string | Email nhận OTP |
| `debugOtp` | string | OTP trả về để debug (chỉ dev/staging, không dùng ở production) |

---

#### `ResetPasswordResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `message` | string | Thông báo kết quả |

---

#### `UserResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `id` | int64 | ID |
| `fullName` | string | Họ và tên |
| `email` | string | Email |
| `role` | string | Role |
| `status` | string | Trạng thái tài khoản |
| `phone` | string | Số điện thoại |
| `avatarUrl` | string | URL ảnh đại diện |
| `specialization` | string | Chuyên ngành |
| `studentCode` | string | Mã học sinh |
| `dateOfBirth` | string (date) | Ngày sinh |
| `parentPhone` | string | SĐT phụ huynh |

---

#### `AdminUserSummary`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `id` | int64 | ID |
| `fullName` | string | Họ và tên |
| `email` | string | Email |
| `role` | string | Role |
| `status` | string | Trạng thái tài khoản |

---

#### `AdminUserListResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `data` | `AdminUserSummary[]` | Danh sách người dùng |
| `pagination` | `PaginationResponse` | Thông tin phân trang |

---

#### `CreatedUser`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `id` | int64 | ID người dùng vừa tạo |
| `email` | string | Email |
| `role` | string | Role |

---

#### `CreatedUserResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `message` | string | Thông báo |
| `user` | `CreatedUser` | Thông tin người dùng vừa tạo |

---

#### `ClassSummaryResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `id` | int64 | ID lớp |
| `name` | string | Tên lớp |
| `status` | string | Trạng thái |
| `teacherId` | int64 | ID giáo viên |

---

#### `ClassListResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `data` | `ClassSummaryResponse[]` | Danh sách lớp |
| `pagination` | `PaginationResponse` | Thông tin phân trang |

---

#### `ClassDetailResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `id` | int64 | ID lớp |
| `name` | string | Tên lớp |
| `level` | string | Cấp độ |
| `description` | string | Mô tả |
| `startDate` | string (date) | Ngày bắt đầu |
| `endDate` | string (date) | Ngày kết thúc |
| `status` | string | Trạng thái |
| `teacher` | `TeacherResponse` | Thông tin giáo viên |
| `memberCount` | int64 | Số thành viên |

---

#### `TeacherResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `id` | int64 | ID giáo viên |
| `fullName` | string | Họ và tên |

---

#### `ClassMemberResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `memberId` | int64 | ID bản ghi thành viên |
| `studentId` | int64 | ID học sinh |
| `fullName` | string | Họ và tên học sinh |
| `studentCode` | string | Mã học sinh |

---

#### `ClassMemberListResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `data` | `ClassMemberResponse[]` | Danh sách thành viên |

---

#### `CreatedClassResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `message` | string | Thông báo |
| `id` | int64 | ID lớp vừa tạo |

---

#### `AddedClassMemberResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `message` | string | Thông báo |
| `memberId` | int64 | ID bản ghi thành viên vừa thêm |

---

#### `AssignmentSummaryResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `id` | int64 | ID bài tập |
| `title` | string | Tiêu đề |
| `status` | string | Trạng thái |
| `closeAt` | string (date-time) | Thời điểm đóng |

---

#### `AssignmentListResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `data` | `AssignmentSummaryResponse[]` | Danh sách bài tập |
| `pagination` | `PaginationResponse` | Thông tin phân trang |

---

#### `AssignmentModuleSummaryResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `id` | int64 | ID module |
| `skill` | string | Kỹ năng |

---

#### `AssignmentDetailResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `id` | int64 | ID bài tập |
| `title` | string | Tiêu đề |
| `status` | string | Trạng thái |
| `modules` | `AssignmentModuleSummaryResponse[]` | Danh sách module |

---

#### `CreatedAssignmentResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `message` | string | Thông báo |
| `id` | int64 | ID bài tập vừa tạo |

---

#### `ModuleSummaryResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `id` | int64 | ID submission module |
| `moduleId` | int64 | ID module gốc |
| `skill` | string | Kỹ năng |
| `taskType` | string | Loại task |
| `status` | string | Trạng thái |
| `grading` | `GradingSummaryResponse` | Tóm tắt chấm điểm |

---

#### `ModuleDetailResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `id` | int64 | ID submission module |
| `moduleId` | int64 | ID module gốc |
| `skill` | string | Kỹ năng |
| `taskType` | string | Loại task |
| `status` | string | Trạng thái |
| `grading` | `GradingDetailResponse` | Chi tiết chấm điểm |

---

#### `ModuleListResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `data` | `ModuleSummaryResponse[]` | Danh sách module |

---

#### `ModuleResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `id` | int64 | ID submission module |
| `moduleId` | int64 | ID module gốc |
| `skill` | string | Kỹ năng |
| `status` | string | Trạng thái |

---

#### `CreatedModuleResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `message` | string | Thông báo |
| `id` | int64 | ID module vừa tạo |

---

#### `ModuleMessageResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `message` | string | Thông báo |

---

#### `AudioUploadResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `message` | string | Thông báo |
| `sourceAudioStorageKey` | string | Key lưu trữ file audio |
| `sourceAudioUploadStatus` | string | Trạng thái upload |

---

#### `QuestionOption`
| Field | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|--------|
| `id` | integer (int32, ≥ 0) | Có | ID lựa chọn |
| `content` | string (không rỗng) | Có | Nội dung |
| `isCorrect` | boolean | Có | Đây có phải đáp án đúng không |

---

#### `QuestionResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `id` | int64 | ID câu hỏi |
| `content` | string | Nội dung câu hỏi |
| `questionType` | string | Loại câu hỏi |
| `score` | number | Điểm |
| `orderIndex` | integer (int32) | Thứ tự |
| `correctAnswer` | `JsonNode` | Đáp án đúng (dạng JSON động) |

---

#### `QuestionListResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `data` | `QuestionResponse[]` | Danh sách câu hỏi |

---

#### `QuestionMessageResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `message` | string | Thông báo |

---

#### `CreatedQuestionResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `message` | string | Thông báo |
| `id` | int64 | ID câu hỏi vừa tạo |

---

#### `StartSubmissionResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `id` | int64 | ID submission vừa tạo |
| `assignmentId` | int64 | ID bài tập |
| `attemptNumber` | integer (int32) | Lần nộp thứ mấy |
| `status` | string | Trạng thái |
| `createdAt` | string (date-time) | Thời điểm tạo |
| `modules` | `ModuleResponse[]` | Danh sách module trong submission |

---

#### `SubmitResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `message` | string | Thông báo |
| `status` | string | Trạng thái mới |
| `submittedAt` | string (date-time) | Thời điểm nộp |

---

#### `SubmissionListItemResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `id` | int64 | ID submission |
| `studentId` | int64 | ID học sinh |
| `attemptNumber` | integer (int32) | Lần nộp thứ mấy |
| `status` | string | Trạng thái |
| `submittedAt` | string (date-time) | Thời điểm nộp |
| `modules` | `ModuleSummaryResponse[]` | Danh sách module |

---

#### `SubmissionListResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `data` | `SubmissionListItemResponse[]` | Danh sách bài nộp |
| `pagination` | `PaginationResponse` | Thông tin phân trang |

---

#### `SubmissionDetailResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `id` | int64 | ID submission |
| `assignmentId` | int64 | ID bài tập |
| `studentId` | int64 | ID học sinh |
| `attemptNumber` | integer (int32) | Lần nộp thứ mấy |
| `status` | string | Trạng thái |
| `submittedAt` | string (date-time) | Thời điểm nộp |
| `createdAt` | string (date-time) | Thời điểm tạo |
| `modules` | `ModuleDetailResponse[]` | Chi tiết các module |

---

#### `AnswerResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `id` | int64 | ID câu trả lời |
| `questionId` | int64 | ID câu hỏi |
| `content` | `JsonNode` | Nội dung câu trả lời (dạng JSON động) |
| `docStorageKey` | string | Key file tài liệu |
| `docMimeType` | string | MIME type tài liệu |
| `docUploadStatus` | string | Trạng thái upload tài liệu |
| `audioStorageKey` | string | Key file audio |
| `audioMimeType` | string | MIME type audio |
| `audioUploadStatus` | string | Trạng thái upload audio |

---

#### `AnswerDetailResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `id` | int64 | ID câu trả lời |
| `questionId` | int64 | ID câu hỏi |
| `content` | `JsonNode` | Nội dung câu trả lời (dạng JSON động) |
| `docStorageKey` | string | Key file tài liệu |
| `docMimeType` | string | MIME type tài liệu |
| `docUploadStatus` | string | Trạng thái upload tài liệu |
| `audioStorageKey` | string | Key file audio |
| `audioMimeType` | string | MIME type audio |
| `audioUploadStatus` | string | Trạng thái upload audio |

---

#### `SubmitModuleResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `message` | string | Thông báo |
| `submissionModuleId` | int64 | ID submission module |
| `status` | string | Trạng thái |
| `answers` | `AnswerResponse[]` | Danh sách câu trả lời đã lưu |

---

#### `SubmissionModuleDetailResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `id` | int64 | ID submission module |
| `moduleId` | int64 | ID module gốc |
| `skill` | string | Kỹ năng |
| `taskType` | string | Loại task |
| `status` | string | Trạng thái |
| `grading` | `GradingDetailResponse` | Chi tiết chấm điểm |
| `questions` | `QuestionResponse[]` | Danh sách câu hỏi |
| `answers` | `AnswerDetailResponse[]` | Danh sách câu trả lời |

---

#### `SubmissionModuleGradingResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `id` | int64 | ID grading |
| `method` | string | Phương pháp chấm (AI / MANUAL) |
| `status` | string | Trạng thái chấm |
| `finalScore` | number | Điểm cuối cùng |

---

#### `UploadUrlResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `uploadUrl` | string | Pre-signed URL để upload |
| `storageKey` | string | Key lưu trữ trên cloud |
| `expiresAt` | string (date-time) | Thời điểm URL hết hạn |

---

#### `GradingSummaryResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `finalScore` | number | Điểm cuối |
| `maxScoreSnapshot` | number | Điểm tối đa tại thời điểm chấm |
| `status` | string | Trạng thái chấm |

---

#### `GradingDetailResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `id` | int64 | ID grading |
| `method` | string | Phương pháp chấm (AI / MANUAL) |
| `status` | string | Trạng thái chấm |
| `finalScore` | number | Điểm cuối |
| `maxScoreSnapshot` | number | Điểm tối đa |
| `aiFeedback` | string | Nhận xét từ AI |
| `finalFeedback` | string | Nhận xét cuối của giáo viên |

---

#### `GradingMessageResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `message` | string | Thông báo |

---

#### `GradingChangeLogResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `changedBy` | string | Người thực hiện thay đổi |
| `oldScore` | number | Điểm cũ |
| `newScore` | number | Điểm mới |
| `note` | string | Ghi chú |
| `changedAt` | string (date-time) | Thời điểm thay đổi |

---

#### `GradingChangeLogListResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `data` | `GradingChangeLogResponse[]` | Lịch sử thay đổi điểm |

---

#### `GradingListResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `data` | `GradingSummaryResponse[]` | Danh sách chấm điểm |
| `pagination` | `PaginationResponse` | Thông tin phân trang |

---

#### `AnswerAnnotationResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `id` | int64 | ID annotation |
| `source` | string | Nguồn tạo (AI / MANUAL) |
| `startOffset` | integer (int32) | Vị trí bắt đầu trong văn bản |
| `endOffset` | integer (int32) | Vị trí kết thúc trong văn bản |
| `errorType` | string | Loại lỗi |
| `comment` | string | Bình luận |
| `suggestedFix` | string | Gợi ý sửa |
| `reviewStatus` | string | Trạng thái review |

---

#### `AnswerAnnotationListResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `data` | `AnswerAnnotationResponse[]` | Danh sách annotation |

---

#### `CreatedAnswerAnnotationResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `message` | string | Thông báo |
| `id` | int64 | ID annotation vừa tạo |

---

#### `StudentEvaluationResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `id` | int64 | ID nhận xét |
| `content` | string | Nội dung nhận xét |

---

#### `Item` _(dùng trong StudentEvaluationListResponse)_
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `id` | int64 | ID nhận xét |
| `classId` | int64 | ID lớp |
| `teacherName` | string | Tên giáo viên tạo nhận xét |
| `content` | string | Nội dung nhận xét |
| `createdAt` | string (date-time) | Thời điểm tạo |

---

#### `StudentEvaluationListResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `data` | `Item[]` | Danh sách nhận xét |
| `pagination` | `PaginationResponse` | Thông tin phân trang |

---

#### `ReportOverviewResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `classCount` | int64 | Số lớp |
| `assignedAssignmentCount` | int64 | Số bài tập đã giao |
| `completionRatePercent` | number | Tỷ lệ hoàn thành (%) |
| `averageScorePercent` | number | Điểm trung bình (%) |
| `pendingGradingCount` | int64 | Số bài đang chờ chấm |
| `pendingByStatus` | `map<string, int64>` | Số bài chờ chấm theo từng trạng thái |

---

#### `ClassSummary` _(dùng trong Reports)_
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `classId` | int64 | ID lớp |
| `className` | string | Tên lớp |
| `status` | string enum: `ACTIVE`, `INACTIVE`, `COMPLETED`, `CANCELLED` | Trạng thái lớp |
| `assignedAssignmentCount` | int64 | Số bài tập đã giao |
| `averageScorePercent` | number | Điểm trung bình (%) |
| `completionRatePercent` | number | Tỷ lệ hoàn thành (%) |

> Khác với `ClassSummaryResponse` ở mục Class (`id`, `name`, `status`, `teacherId`).

---

#### `ReportClassListResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `data` | `ClassSummary[]` | Thống kê từng lớp |
| `pagination` | `ReportPaginationResponse` | Thông tin phân trang |

---

#### `ReportPaginationResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `page` | integer (int32) | Trang hiện tại |
| `limit` | integer (int32) | Số bản ghi mỗi trang |
| `total` | int64 | Tổng số bản ghi |

---

#### `AssignmentScore`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `assignmentId` | int64 | ID bài tập |
| `title` | string | Tiêu đề bài tập |
| `averageScorePercent` | number | Điểm trung bình (%) |

---

#### `StudentProgress`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `studentId` | int64 | ID học viên |
| `fullName` | string | Họ và tên |
| `completedAssignments` | int64 | Số bài đã hoàn thành |
| `totalAssignments` | int64 | Tổng số bài được giao |
| `completionRatePercent` | number | Tỷ lệ hoàn thành (%) |
| `averageScorePercent` | number | Điểm trung bình (%) |

---

#### `ReportClassProgressResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `classId` | int64 | ID lớp |
| `completionRatePercent` | number | Tỷ lệ hoàn thành (%) |
| `belowAverageRatePercent` | number | Tỷ lệ học viên dưới ngưỡng (%) |
| `totalStudentCount` | int64 | Tổng số học viên |
| `scoredStudentCount` | int64 | Số học viên đã có điểm |
| `belowAverageCount` | int64 | Số học viên dưới ngưỡng `threshold` |
| `assignmentScores` | `AssignmentScore[]` | Điểm trung bình theo từng bài tập |
| `laggingStudents` | `StudentProgress[]` | Học viên tụt hậu |
| `unscoredStudents` | `StudentProgress[]` | Học viên chưa có điểm |

---

#### `SkillAverage`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `skill` | string enum: `READING`, `LISTENING`, `WRITING`, `SPEAKING` | Kỹ năng |
| `averageScorePercent` | number | Điểm trung bình (%) |

---

#### `ScoreTimeline`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `assignmentId` | int64 | ID bài tập |
| `title` | string | Tiêu đề bài tập |
| `submittedAt` | string (date-time) | Thời điểm nộp |
| `scorePercent` | number | Điểm (%) |

---

#### `ReportStudentProgressResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `studentId` | int64 | ID học viên |
| `studentName` | string | Tên học viên |
| `classId` | int64 | ID lớp |
| `skillAverages` | `SkillAverage[]` | Điểm trung bình theo kỹ năng |
| `scoreTimeline` | `ScoreTimeline[]` | Diễn biến điểm theo thời gian |

---

#### `PaginationResponse`
| Field | Kiểu | Mô tả |
|-------|------|--------|
| `page` | integer (int32) | Trang hiện tại |
| `limit` | integer (int32) | Số bản ghi mỗi trang |
| `total` | int64 | Tổng số bản ghi |

---

## 15. Lịch sử cập nhật

Cập nhật dựa trên `api-docs_v2.json` (OpenAPI 3.1.0, version `v1`).

**Endpoint mới (6)**
- `POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/reset-password`
- `GET /api/v1/reports/overview`, `/reports/classes`, `/reports/classes/{id}/progress`, `/reports/students/{id}/progress`

**Endpoint thay đổi**
- `GET /api/v1/students/{id}/evaluations`: thêm query `fromDate`, `toDate`.
- Các endpoint phân trang: bổ sung giá trị mặc định `page=1`, `limit=20`.

**DTO mới (21 schema trong spec)**
- Auth: `ForgotPasswordRequest/Response`, `ResetPasswordRequest/Response`.
- Reports: `ReportOverviewResponse`, `ReportClassListResponse`, `ReportClassProgressResponse`, `ReportStudentProgressResponse`, `ReportPaginationResponse`, `ClassSummary`, `StudentProgress`, `AssignmentScore`, `ScoreTimeline`, `SkillAverage`.
- Polymorphic: `CorrectAnswer`, `AnswerContent` (base, rỗng) cùng 4 subtype `MultipleChoiceCorrectAnswer`, `ShortAnswerCorrectAnswer`, `MultipleChoiceAnswerContent`, `ShortAnswerAnswerContent`.
- `JsonNode`: schema do Jackson sinh tự động, chỉ là mô tả kỹ thuật của "JSON động", không cần dùng trực tiếp.

**DTO thay đổi**
- `AnswerDetailResponse`: liệt kê đầy đủ field (trước đó chỉ ghi "giống `AnswerResponse`").
- Bổ sung cột bắt buộc, enum và ràng buộc cho: `CreateAssignmentRequest`, `UpdateAssignmentRequest`, `UpdateAssignmentStatusRequest`, `CreateModuleRequest`, `UpdateModuleRequest`, `CreateQuestionRequest`, `UpdateQuestionRequest`, `AnswerPayload`, `QuestionOption`, `UpdateFinalGradeRequest`, `CreateAnswerAnnotationRequest`, `ReviewAnswerAnnotationRequest`.

---

*Tài liệu được tạo từ OpenAPI spec — EnglishHub API v1*
