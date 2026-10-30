# EnglishHub API contract — User & Admin

Cập nhật ngày **29/10/2026**, đối chiếu source tại commit `81d40f0`.
Khôi phục từ `docs/api-contract.md` trong stash ngày 22/09/2026
(`6539ba6:docs/api-contract.md`), sau đó cập nhật theo implementation hiện tại.

Tài liệu này là điểm đối chiếu BE–FE cho **User và Admin User**. Các mô tả bên
dưới phản ánh source của checkout này; chưa xác nhận bản đang deploy có cùng
commit. Các ví dụ là dữ liệu minh hoạ, không phải response thu được từ server.

## Phạm vi và tài liệu liên quan

| Phân hệ | Tài liệu |
| --- | --- |
| User / Admin User | Contract chi tiết trong file này |
| Auth, Class, Assignment, Module, Question, Grading, Evaluation, Reports | [EnglishHub_API_docs_eng.md](EnglishHub_API_docs_eng.md) — tài liệu tham khảo, chưa được rà soát toàn bộ trong lần cập nhật này |
| Submission / Answer | [api_v4_design_chapter_6_submissions_answers.md](api_v4_design_chapter_6_submissions_answers.md) |
| Upload audio / document | [file-upload-guide-module-audio-and-submission-files.md](file-upload-guide-module-audio-and-submission-files.md) |
| Danh mục API | [api_overview_v3.md](api_overview_v3.md) |
| Điểm lệch FE đã tìm thấy | [Bàn giao đối chiếu User/Admin](../../production_artifacts/be_to_tester/user-admin-contract-alignment.md) |

## Quy ước chung

- API prefix: `/api/v1`. FE cấu hình base URL có prefix này rồi gọi `/users/me`,
  `/admin/users`, ... để tránh lặp `/api/v1`.
- Gửi `Authorization: Bearer <accessToken>` và `Content-Type: application/json`
  với request có JSON body.
- `/users/me` và đổi mật khẩu của chính mình: caller đang hoạt động, role
  `ADMIN`, `TEACHER` hoặc `STUDENT`. `/admin/users` và các route con: chỉ `ADMIN`.
- Caller thiếu token/token không hợp lệ hoặc tài khoản caller bị khoá/xoá:
  `401`. Caller không đủ quyền: `403`.
- Response thành công **không dùng một envelope chung**: GET detail trả object
  trực tiếp; GET list trả `{ data, pagination }`; mutation trả `{ message }`,
  riêng create trả `{ message, user }`.
- Lỗi dùng `{ "error": "Thông báo lỗi" }`. FE đọc `error`, không đọc
  `message` như response thành công.
- Role: `ADMIN | TEACHER | STUDENT`. Status: `ACTIVE | LOCKED`.
  `INACTIVE` không thuộc enum User của BE hiện tại.
- ID user là số JSON. `dateOfBirth` là chuỗi ngày `YYYY-MM-DD`.
- Các field profile có giá trị null được **bỏ khỏi response**. FE dùng field
  optional; không suy ra dữ liệu trống trong list có nghĩa là profile trống.

## Bảng endpoint

Các path dưới đây đã bao gồm prefix `/api/v1`.

| Method | Path | Thành công | Response |
| --- | --- | --- | --- |
| GET | `/api/v1/users/me` | 200 | `UserProfile` trực tiếp |
| PUT | `/api/v1/users/me` | 200 | `{ message }` |
| PATCH | `/api/v1/users/me/password` | 200 | `{ message }` |
| GET | `/api/v1/admin/users` | 200 | `{ data: UserSummary[], pagination }` |
| GET | `/api/v1/admin/users/{id}` | 200 | `UserProfile` trực tiếp |
| POST | `/api/v1/admin/users` | 201 | `{ message, user: { id, email, role } }` |
| PUT | `/api/v1/admin/users/{id}` | 200 | `{ message }` |
| DELETE | `/api/v1/admin/users/{id}` | 200 | `{ message }` |
| PATCH | `/api/v1/admin/users/{id}/status` | 200 | `{ message }` |

## Kiểu dữ liệu phía FE

Các kiểu dưới đây mô tả BE hiện tại; các khác biệt với type FE đang có được
ghi trong tài liệu bàn giao.

```ts
type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';
type UserStatus = 'ACTIVE' | 'LOCKED';
type MessageResponse = { message: string };
type UserSummary = {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};
type UserProfile = UserSummary & {
  phone?: string;
  avatarUrl?: string;
  specialization?: string; // TEACHER
  studentCode?: string;    // STUDENT
  dateOfBirth?: string;    // STUDENT, YYYY-MM-DD
  parentPhone?: string;    // STUDENT
};
```

GET list chỉ trả 5 field của `UserSummary`. GET detail dùng cùng shape với
`GET /users/me`, có thể trả profile của student/teacher khi có dữ liệu.
ADMIN không có các field profile riêng của student/teacher.

```json
{
  "id": 12,
  "fullName": "Nguyễn Minh Anh",
  "email": "student@example.com",
  "role": "STUDENT",
  "status": "ACTIVE",
  "studentCode": "HV0012",
  "dateOfBirth": "2005-03-10",
  "parentPhone": "0912345678"
}
```

ADMIN có thể đọc target đang `LOCKED`. Target không tồn tại, đã soft-delete
hoặc ID số không dương: GET detail trả `404`. ID không parse được thành số
trả `400`. Quyền caller được kiểm tra trước khi service tìm target.

## Danh sách, tìm kiếm và phân trang

`GET /api/v1/admin/users?q=&role=&page=1&limit=20`

| Query | Quy tắc |
| --- | --- |
| `q` | Optional, tìm theo fullName/email |
| `role` | Optional, `ADMIN`, `TEACHER`, `STUDENT`; không truyền hoặc rỗng để lấy tất cả role |
| `page` | Số nguyên từ 1, mặc định 1 |
| `limit` | Số nguyên 1–100, mặc định 20; ngoài khoảng trả 400 |

Không có query lọc `status` trong controller hiện tại. `total` là tổng số user
khớp bộ lọc, không phải số phần tử của trang đang lấy. User đã soft-delete
không có trong kết quả.

```json
{
  "data": [
    {
      "id": 12,
      "fullName": "Nguyễn Minh Anh",
      "email": "student@example.com",
      "role": "STUDENT",
      "status": "ACTIVE"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 45 }
}
```

FE cần truyền `q`, `role`, `page`, `limit` xuống API để tìm trong toàn bộ dữ
liệu. Lọc hoặc chia trang client trên 100 user đầu không thể hiện toàn bộ
dataset. Mã hiển thị tự ghép từ ID như `HV-0012` không phải `studentCode`
được lưu trong profile và không phải bộ lọc được endpoint list hỗ trợ.

## Tạo tài khoản

`POST /api/v1/admin/users`

- Bắt buộc: `fullName`, `email`, `password`, `role`.
- Role hỗ trợ cả **ADMIN, TEACHER, STUDENT**. Quy tắc cũ cấm tạo ADMIN đã lỗi thời.
- `fullName`: trim/gộp khoảng trắng, 2–50 ký tự; chữ Unicode, khoảng trắng,
  dấu gạch nối hoặc nháy đơn giữa các phần tên; không có chữ số.
- `email`: đúng định dạng, được trim và chuyển chữ thường; trùng trả `409`.
- `password`: ít nhất 8 ký tự, có chữ hoa và chữ số.
- Optional: `specialization` cho teacher; `studentCode`, `dateOfBirth`,
  `parentPhone` cho student. Chuỗi optional rỗng được chuẩn hoá thành null.
- `phone` và `avatarUrl` không thuộc DTO create; cập nhật qua các API phù hợp.

```json
{
  "fullName": "Nguyễn Minh Anh",
  "email": "student@example.com",
  "password": "ExamplePass123",
  "role": "STUDENT",
  "studentCode": "HV0012",
  "dateOfBirth": "2005-03-10",
  "parentPhone": "0912345678"
}
```

Response `201`:

```json
{
  "message": "Tạo tài khoản thành công.",
  "user": { "id": 12, "email": "student@example.com", "role": "STUDENT" }
}
```

## Cập nhật hồ sơ

| Endpoint | Các field được xử lý |
| --- | --- |
| `PUT /api/v1/users/me` | `fullName`, `phone`, `avatarUrl` |
| `PUT /api/v1/admin/users/{id}` | `fullName`, `phone`; `specialization` nếu target là TEACHER; `studentCode`, `dateOfBirth`, `parentPhone` nếu target là STUDENT |

Các field đều optional nhưng phải có ít nhất một field cập nhật được hỗ trợ
cho target. `{}` hoặc chỉ các field không được hỗ trợ trả `400`.
Field không gửi hoặc gửi null giữ nguyên giá trị. Với các chuỗi optional
được hỗ trợ, gửi `""` sẽ xoá giá trị (lưu null); `fullName` rỗng bị từ chối.
`dateOfBirth: null` giữ nguyên ngày, không dùng để xoá ngày sinh.

`email`, `role`, `password` không được thay đổi qua hai endpoint này.
Lưu thành công trả `{ message }`; FE refetch detail nếu cần profile mới.

```json
{
  "fullName": "Nguyễn Minh Anh",
  "phone": "0987654321"
}
```

## Mật khẩu

`PATCH /api/v1/users/me/password` nhận cả hai field bắt buộc:

```json
{
  "currentPassword": "OldExample123",
  "newPassword": "NewExample456"
}
```

Mật khẩu mới áp dụng cùng policy với create. Sai mật khẩu hiện tại trả `401`;
thiếu field hoặc mật khẩu mới không hợp lệ trả `400`. Thành công trả
`{ "message": "Đổi mật khẩu thành công." }`.

**Không có API admin reset mật khẩu target trong User controller hiện tại.**
Gửi `PUT /admin/users/{id}` với `{}` hoặc `password` không reset mật khẩu.
Luồng tự khôi phục bằng OTP thuộc Auth; xem tài liệu Auth và yêu cầu token/OTP
của luồng đó, không dùng thay thế ngầm cho quyền admin reset.

## Khoá, mở khoá và xoá

`PATCH /api/v1/admin/users/{id}/status`:

```json
{ "status": "LOCKED" }
```

Chấp nhận `ACTIVE` hoặc `LOCKED`. Khoá cũng revoke refresh token đang hoạt động
của target. Response chỉ có message, **không phải UserProfile**:

```json
{ "message": "Đã khoá tài khoản." }
```

Mở khoá trả `{ "message": "Đã mở khoá tài khoản." }`.

`DELETE /api/v1/admin/users/{id}` thực hiện soft-delete, giữ row để bảo toàn
tham chiếu khoá ngoại. Response `200 { "message": "Đã xoá người dùng." }`.
Sau đó user không xuất hiện trong list và detail trả `404`.

## Mã lỗi để FE xử lý

| HTTP | Trường hợp |
| --- | --- |
| 400 | Body/ID/query sai kiểu; thiếu field; password/name/role/status/pagination không hợp lệ; update rỗng |
| 401 | Chưa đăng nhập, token không hợp lệ/hết hạn, caller bị khoá/xoá; sai mật khẩu hiện tại |
| 403 | Caller không có quyền gọi route |
| 404 | Target không tồn tại hoặc đã soft-delete |
| 409 | Email hoặc dữ liệu unique bị trùng |
| 415 | Content-Type không được hỗ trợ |
| 500 | Lỗi hệ thống/database chưa được xử lý cụ thể |

Ví dụ `400` khi update rỗng:

```json
{ "error": "Không có dữ liệu để cập nhật." }
```

## Nguồn đối chiếu và cách duy trì

- BE routes, body và response: [UserController](../../backend/src/main/java/com/english_hub/core/modules/user/presentation/rest/UserController.java),
  [AdminUserController](../../backend/src/main/java/com/english_hub/core/modules/user/presentation/rest/AdminUserController.java),
  [DTOs](../../backend/src/main/java/com/english_hub/core/modules/user/presentation/rest/dto/).
- Validation và mutation: [UserProfileService](../../backend/src/main/java/com/english_hub/core/modules/user/application/service/UserProfileService.java),
  [AdminUserService](../../backend/src/main/java/com/english_hub/core/modules/user/application/service/AdminUserService.java).
- FE hiện tại: [user.service.ts](../../frontend/src/api/services/user.service.ts),
  [useStudentDetails.ts](../../frontend/src/hooks/useStudentDetails.ts),
  [Accounts.tsx](../../frontend/src/pages/Accounts.tsx).

Khi đổi API User/Admin, cùng PR cần cập nhật contract, DTO/type/service FE bị
ảnh hưởng và hướng dẫn kiểm thử. So sánh response thực tế với shape trong file
này; TypeScript generic trong `http.get<T>()` không validate JSON lúc runtime.
Những phân hệ ngoài phạm vi cần được đối chiếu riêng trước khi coi là đồng bộ.
