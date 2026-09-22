# Assignment API cluster (#20-#25) - tester handoff

## Scope

Implemented the Assignment CRUD/status APIs under `/api/v1`:

- `GET /classes/{classId}/assignments?status=&page=1&limit=20`
- `POST /classes/{classId}/assignments`
- `GET /assignments/{assignmentId}`
- `PUT /assignments/{assignmentId}`
- `DELETE /assignments/{assignmentId}` (soft delete)
- `PATCH /assignments/{assignmentId}/status`

## Authorization matrix

- Teacher: may read/write only assignments belonging to a class where `classes.teacher_id` is their user id.
- Student: may read assignments only when a `class_members` row links them to the class.
- Admin: receives `403` for Assignment endpoints.
- A class without a responsible teacher rejects assignment creation with `400`.

## Business rules to verify

- New assignments start in `DRAFT`.
- `openAt` must be before `closeAt`.
- `maxSubmissions`, when supplied, must be greater than zero.
- `title` must be non-blank and no longer than 200 characters.
- `CLOSED` assignments cannot be updated.
- Status transitions are one-way: `DRAFT -> PUBLISHED -> CLOSED`.
- Delete sets `is_deleted = true`; it must not remove the database row.
- Deleted assignments are excluded from list/detail lookup.

## Expected contract messages

- Create: `Tạo bài tập thành công.`
- Update: `Cập nhật bài tập thành công.`
- Delete: `Đã xoá bài tập.`
- Publish: `Đã công bố bài tập.`
- Closed update: `Không thể sửa bài tập đã đóng.`
- Invalid status transition: `Không thể chuyển sang trạng thái này.`
- Invalid time/submission limit: `Dữ liệu thời gian hoặc số lần nộp không hợp lệ.`
- Unassigned class: `Lớp học chưa được gán giáo viên phụ trách, không thể tạo bài tập.`

## Verification commands

Run from `backend/` with Java 21:

```bash
./gradlew test --tests '*AssignmentServiceTest' --tests '*AssignmentControllerTest'
```

The tests cover teacher ownership, student membership, admin blocking, validation, soft delete, and status transitions.
