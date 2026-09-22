# Submissions/Answers API — Phase 1 + Phase 2 + Phase 3 Testing Instructions

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
./gradlew test   # full suite: 190 tests (unit + integration), all green
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
# -> Phase 2 + Phase 3 tests, BUILD SUCCESSFUL
./gradlew test   # full suite: 190 tests (unit + integration), all green
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

## Scope (Phase 3) — APIs #38 and #39 (read)
`GET /api/v1/submissions/{id}` and `GET /api/v1/submissions`, per V4 chapter 6 spec.
Both reuse the Phase 1 read ports and the `AssignmentWindow`/`ModuleInfo` read models +
`ClassTeachingRepository` (new port + `ClassTeachingJpaAdapter`) for teacher ownership.

- **#38 detail**: `{ id, assignmentId, studentId, attemptNumber, status, submittedAt, createdAt, modules:[{ id (=submissionModuleId), moduleId, skill, taskType, status, grading:{ id, method, status, finalScore, maxScoreSnapshot, aiFeedback, finalFeedback } | null }] }`.
  Modules are ordered by the assignment module's `orderIndex`. Domain `Grading` gained
  `aiFeedback`/`finalFeedback` (mapped both ways) so the detail payload exposes them.
- **#39 list**: filters `assignmentId`, `studentId`, `status`, `page` (default 1), `limit` (default 20, max 100);
  `{ data:[ { id, studentId, attemptNumber, status, submittedAt, modules:[{ id, moduleId, skill, taskType, status, grading:{ finalScore, maxScoreSnapshot, status } | null }] } ], pagination:{ page, limit, total } }`.
- **Role scoping**:
  - STUDENT: sees only own (a `studentId` ≠ caller → 403; `studentId` omitted → forced to self).
  - TEACHER: `assignmentId` is **required** (else 400) and must be an assignment of a class they
    teach (else 403); `studentId`/`status` optional.
  - ADMIN: filters as provided (unconstrained).
  - Invalid `status` value → 400 `status không hợp lệ.`; invalid page/limit → 400 `Dữ liệu không hợp lệ.`

Smoke tests (running app, seeded DB, bearer tokens):
```bash
# detail — student sees own attempt
curl -s http://localhost:8080/api/v1/submissions/{id} -H "Authorization: Bearer <studentAccessToken>"
# 200 { "id": 88, "assignmentId": 5, "studentId": 41, ..., "modules":[ { "id": 150, "moduleId": 9,
#       "skill": "READING", "taskType": "QUIZ", "status": "IN_PROGRESS",
#       "grading": { "id": 77, "method": "AUTO", "status": "PENDING", "finalScore": null,
#                    "maxScoreSnapshot": null, "aiFeedback": null, "finalFeedback": null } }, ... ] }

# detail — another student -> 403; unknown id -> 404 "Không tìm thấy lượt làm bài."
curl -s http://localhost:8080/api/v1/submissions/{id} -H "Authorization: Bearer <otherStudentToken>"

# list — student scoped to self
curl -s "http://localhost:8080/api/v1/submissions?page=1&limit=20" -H "Authorization: Bearer <studentAccessToken>"

# list — teacher (assignmentId required)
curl -s "http://localhost:8080/api/v1/submissions?assignmentId=5&status=IN_PROGRESS" \
  -H "Authorization: Bearer <teacherAccessToken>"
# 200 { "data":[ ... ], "pagination": { "page": 1, "limit": 20, "total": 1 } }
```

### What the Phase-3 tests cover (+16 service + 2 controller + 16 API integration)
- `SubmissionServiceTest` (+15): #38 own-detail with modules/gradings ordered by `orderIndex`,
  student-other 403, 404, teacher-of-class ok, teacher-of-other-class 403, admin ok;
  #39 student forced scoping + own-id passthrough, foreign `studentId` 403, teacher missing
  `assignmentId` 400, teacher own assignment ok, teacher foreign assignment 403, admin unfiltered,
  filter forwarding (assignmentId/status), invalid pagination 400, invalid status 400.
- `SubmissionControllerTest` (+2): #38 detail mapping (full body incl. grading), #39 list + pagination mapping.
- `SubmissionApiIntegrationTest` (+16, Testcontainers + MockMvc + real JWT): student #38 happy path
  (grading `PENDING`, methods AUTO/TEACHER_MANUAL per module), cross-student 403, 404, teacher-of-class
  200, teacher-of-other-class 403, graded-state detail (`GRADED`/`COMPLETED` + `finalScore` +
  `aiFeedback` via domain `save`), admin 200; #39 student own-only, foreign-`studentId` 403,
  teacher `assignmentId` required 400, teacher own assignment 200, foreign assignment 403,
  `assignmentId` filter correctness, grading summaries after grading, admin unfiltered, invalid status 400,
  pagination shape.

### Error contract (Phase 3 additions)
| Code | Message |
|---|---|
| 404 | `Không tìm thấy lượt làm bài.` (#38 only) |
| 400 | `assignmentId là bắt buộc đối với giáo viên.` (#39, teacher without assignmentId) |
| 400 | `status không hợp lệ.` (#39, unknown status value) |
| 400 | `Dữ liệu không hợp lệ.` (#39, invalid page/limit) |
| 403 | `Bạn không có quyền thực hiện thao tác này.` (#38/#39 role/ownership checks) |

## Next (for whoever picks up Phase 4)
- API #43 (Quiz/Short Answer submit, `POST /submission-modules/{id}/submit`): `AnswerRepository`
  (`bulkCreate`, `findBySubmissionModuleId`), `SubmissionModuleRepository.updateStatus`, service
  validations (IN_PROGRESS only, questionId belongs to module), then 400/404 cases.
- Then #40 `POST /submissions/{id}/submit` (final submit + auto-grading), #42
  `GET /submission-modules/{id}`, #46/#47 presigned-upload URLs, #43 Writing/Speaking.