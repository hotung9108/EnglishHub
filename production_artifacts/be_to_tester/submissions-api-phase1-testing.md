# Submissions/Answers API — Phase 1 + Phase 2 Testing Instructions

Delivered by @be-secondary for @tester. Branch: `feat/submissions-answers-api`.

## Scope (Phase 1)
Persistence layer only (no HTTP endpoints yet). DDD port/adapter for the
submission cluster under `backend/src/main/java/com/english_hub/core/modules/submission/`:

- Domain ports: `SubmissionRepository`, `SubmissionModuleRepository`, `GradingRepository`
  (`domain/repository/`), pure Java, extend `IRepository<T, Long>`.
- Adapters + mapper + Spring Data repos under `infrastructure/`, operating on the existing
  shared JPA entities (`submissions`, `submission_modules`, `gradings`).
- `SubmissionRepository.create(assignmentId, studentId, attemptNumber)` — new `IN_PROGRESS` attempt.
- `SubmissionRepository.findPage(SubmissionFilter{assignmentId?, studentId?, status?}, SubmissionPageRequest)` — paginated.
- `SubmissionModuleRepository.bulkCreate(submissionId, moduleIds)` — one `IN_PROGRESS` row per module.
- `GradingRepository.bulkCreate(List<GradingDraft(submissionModuleId, method)>)` — `PENDING` rows.
- `SubmissionRepository.countByAssignmentIdAndStudentId(assignmentId, studentId)` — used by the max-submissions guard.

No Flyway migration (schema already exists in V1). The shared JPA entities
`Submission`/`SubmissionModule`/`Grading` gained Lombok `@Setter` to support the
`save()` update path (id round-trip in `SubmissionPersistenceMapper`). `Submission` now
also maps `created_at`/`updated_at` (Instant) via `@PrePersist`/`@PreUpdate` so the
start-attempt response can return `createdAt`.

## Run the automated suite
Tests use **Testcontainers** (`postgres:16-alpine`) — Docker must be running; no local DB needed.

```bash
cd backend
./gradlew test --tests 'com.english_hub.core.modules.submission.infrastructure.persistence.SubmissionPersistenceIntegrationTest'
# -> 7 tests, BUILD SUCCESSFUL
./gradlew test   # full suite: 134 tests (unit + integration), all green
```

## What the 7 Phase-1 tests cover
1. `createPersistsInProgressSubmission` — row inserts with `IN_PROGRESS`, id/attempt round-trip via `findById`.
2. `duplicateAttemptViolatesUniqueConstraint` — `(assignment, student, attempt)` unique → `DataIntegrityViolationException`.
3. `findPageAppliesFiltersAndPagination` — no-filter paging (sizes, total, totalPages), `assignmentId`/`studentId`/`status`/combined filters (status row flipped via domain `save()`).
4. `bulkCreateCreatesOneModuleRowPerModuleId` — N rows `IN_PROGRESS`, `findBySubmissionId` round-trip.
5. `bulkCreateDuplicatesViolateUniqueConstraint` — `(submission_id, module_id)` unique → `DataIntegrityViolationException`.
6. `bulkCreateCreatesPendingGradingsWithResolvedMethod` — `PENDING` rows, method matches draft (`AUTO`/`TEACHER_MANUAL`), `findBySubmissionModuleId`.
7. `submissionModulesEachHaveOneGrading` — join shape: submission → 2 modules → 1 grading each via `findBySubmissionModuleIds`.

## Scope (Phase 2) — API #37 start attempt
`POST /api/v1/assignments/{assignmentId}/submissions` (role = STUDENT, no body). V4 chapter 6 spec.
Starts a new attempt: validates role + class membership, assignment `PUBLISHED`, within
`open_at`–`close_at`, under `max_submissions`; creates the `submissions` row, one
`submission_modules` row per assignment module, and one `gradings` row per module with
`method` derived from the module's `task_type` (`QUIZ → AUTO`, else `TEACHER_MANUAL`).

Implementation: read-only submission-context ports + JPA adapters
(`AssignmentWindowRepository`, `AssignmentModuleRepository`, `StudentClassEnrollmentRepository`
under the same `modules/submission/` package) so the service never touches shared JPA repos directly.

```bash
cd backend
./gradlew test --tests 'com.english_hub.core.modules.submission.application.service.SubmissionServiceTest' \
               --tests 'com.english_hub.core.modules.submission.presentation.rest.SubmissionControllerTest' \
               --tests 'com.english_hub.core.modules.submission.integration.SubmissionApiIntegrationTest'
# -> 22 Phase-2 tests, BUILD SUCCESSFUL
./gradlew test   # full suite: 156 tests (unit + integration), all green
```

Smoke test (needs a running app with a seeded/local DB and a student bearer token):
```bash
curl -s -X POST http://localhost:8080/api/v1/assignments/{assignmentId}/submissions \
  -H "Authorization: Bearer <studentAccessToken>"
# 201
# {
#   "id": 88, "assignmentId": 5, "attemptNumber": 1, "status": "IN_PROGRESS",
#   "createdAt": "2026-09-22T...",
#   "modules": [ { "id": 150, "moduleId": 9, "skill": "LISTENING", "status": "IN_PROGRESS" }, ... ]
# }
```

### What the 22 Phase-2 tests cover
- `SubmissionServiceTest` (11, Mockito): happy path creates submission + modules + grading drafts
  (`AUTO`, `TEACHER_MANUAL`), attempt number increments, 400 not-published / not-open-yet / closed /
  limit-reached, unlimited when `max_submissions` null, 404 unknown + soft-deleted, 403 non-student,
  403 student not in class.
- `SubmissionControllerTest` (1, Mockito): 201 mapping, exact body fields.
- `SubmissionApiIntegrationTest` (10, Testcontainers + MockMvc + real JWT): full lifecycle assertion
  (response JSON incl. `createdAt`, `modules[]` ids/skills/status, DB rows: submission count,
  submission-modules count, grading methods), second attempt → `attemptNumber: 2`, DRAFT/not-open/
  closed/limit/unknown/deleted/403 cases with exact V4 error messages.

### Error contract (exact strings)
| Code | Message |
|---|---|
| 400 | `Không thể bắt đầu làm bài tập này lúc này.` (single message for all start preconditions) |
| 404 | `Không tìm thấy bài tập.` |
| 403 | `Bạn không có quyền thực hiện thao tác này.` |
| 401 | `Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.` |

## Next (for whoever picks up Phase 3)
- APIs #38 `GET /submissions/{id}` and #39 `GET /submissions` (list/detail with modules + gradings) reuse the Phase 1 read ports and the `AssignmentWindow`/`ModuleInfo` read models; add teacher/admin visibility + ownership guards.
- APIs #40 `POST /submissions/{id}/submit`, #42 `GET /submission-modules/{id}`, #43 `POST /submission-modules/{id}/submit`, #46/#47 presigned-upload URLs.