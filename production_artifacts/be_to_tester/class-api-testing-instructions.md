# Class API — Backend Testing Instructions (Cluster 3, APIs #12–#19)

Delivered by @be-secondary for @tester. Implementation on branch `feat/class-api`.

## 1. Run the automated suite

Integration tests need a running Postgres (same DB as dev: `docker-compose.dev.yml`, defaults `jdbc:postgresql://localhost:5432/appdb`).

```bash
cd backend
./gradlew test        # full suite: 126 tests (unit + integration)
```

Class-API specific:
- Unit: `ClassServiceTest` (37), `ClassControllerTest` (10)
- Integration (`@SpringBootTest` MockMvc + real JWT): `ClassApiIntegrationTest` (8)
  - Lifecycle: create → assign teacher → add students → list members → remove member → delete (409) → remove rest → delete (200) → detail (404)
  - Scoping #12: ADMIN sees all; assigned TEACHER sees only own; other TEACHER sees none; member STUDENT sees it; non-member STUDENT doesn't
  - Status cycle #15 + filter #12 (all 4 values + invalid → 400)
  - Teacher change #15 → reflected in #12/#14
  - Error-contract spot checks: exact messages, pagination present (#12) / absent (#17), `"startDate":"2026-09-15"`, name 151 chars → 400, date-range 400 (create+update), teacher-null class persisted

Note: a live Postgres is required for the full `./gradlew test` (the base context-load test already needs it).

## 2. Manual happy-path (curl, on `http://localhost:8080`)

Auth: obtain a Bearer token for an ADMIN (via `POST /api/v1/auth/login` or an existing token). Every call below uses `Authorization: Bearer <token>`.

```bash
BASE=http://localhost:8080/api/v1
ADMIN_TOKEN=<admin jwt>

# #13 create class
curl -s -X POST $BASE/classes -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"IELTS 6.5 - K12","level":"Intermediate","startDate":"2026-09-15","endDate":"2027-01-31"}'
# -> 201 {"message":"Tạo lớp thành công.","id":N}

# #14 detail
curl -s $BASE/classes/N -H "Authorization: Bearer $ADMIN_TOKEN"

# #12 list (status filter + pagination)
curl -s "$BASE/classes?status=ACTIVE&page=1&limit=20" -H "Authorization: Bearer $ADMIN_TOKEN"

# #15 update (assign teacher, change status)
curl -s -X PUT $BASE/classes/N -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{"teacherId":<teacherUserId>,"status":"ACTIVE"}'
# -> 200 {"message":"Cập nhật lớp học thành công."}

# #18 add student -> 201 {"message":"Đã thêm học viên vào lớp.","memberId":M}
curl -s -X POST $BASE/classes/N/members -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{"studentId":<studentUserId>}'

# #17 list members (no pagination)
curl -s $BASE/classes/N/members -H "Authorization: Bearer $ADMIN_TOKEN"

# #19 remove student (memberId = class_members.id from #17)
curl -s -X DELETE $BASE/classes/N/members/M -H "Authorization: Bearer $ADMIN_TOKEN"

# #16 delete -> 409 while members exist, then 200 after clearing members
curl -s -X DELETE $BASE/classes/N -H "Authorization: Bearer $ADMIN_TOKEN"
```

## 3. Expected error spot-checks

| Call | Expected |
|---|---|
| `GET /classes?status=FROZEN` | 400 `{"error":"status không hợp lệ."}` |
| `POST /classes` missing name/startDate | 400 `{"error":"Vui lòng nhập đầy đủ tên lớp và ngày bắt đầu."}` |
| `POST /classes` endDate < startDate | 400 `{"error":"Ngày kết thúc phải sau ngày bắt đầu."}` |
| `POST /classes` unknown teacherId | 404 `{"error":"Không tìm thấy giáo viên (teacherId không tồn tại)."}` |
| `PUT /classes/{id}` empty body | 400 `{"error":"Không có dữ liệu để cập nhật."}` |
| `PUT /classes/{id}` status=FROZEN | 400 `{"error":"status phải là ACTIVE, INACTIVE, COMPLETED hoặc CANCELLED."}` |
| `GET /classes/{id}` unknown | 404 `{"error":"Không tìm thấy lớp học."}` |
| `DELETE /classes/{id}` with members | 409 `{"error":"Không thể xoá: lớp học vẫn còn dữ liệu liên quan."}` |
| `POST /classes/{id}/members` {} | 400 `{"error":"Thiếu mã học viên."}` |
| `POST /classes/{id}/members` duplicate | 409 `{"error":"Học viên đã có trong lớp."}` |
| `POST /classes/{id}/members` bad class/student | 404 `{"error":"Không tìm thấy lớp học hoặc học viên."}` |
| `DELETE /classes/{id}/members/{memberId}` wrong class | 404 `{"error":"Không tìm thấy thành viên trong lớp."}` |
| Any class/member call without/with invalid token | 401 `{"error":"Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn."}` |