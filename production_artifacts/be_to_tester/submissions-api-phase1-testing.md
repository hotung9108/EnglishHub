# Submissions/Answers API — Phase 1 + 2 + 3 + 4 + 5 + 6 + 7a + 7b + 8 Testing Instructions

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
./gradlew test   # full suite: 286 tests (unit + integration), all green
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
./gradlew test   # full suite: 286 tests (unit + integration), all green
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

## Scope (Phase 4) — API #43 submit one submission_module (Quiz / Short Answer)
`POST /api/v1/submission-modules/{submissionModuleId}/submit` (role = STUDENT, JSON body), V4 chapter 6 spec.
Submits all answers of one module in a single request; only allowed while the module is `IN_PROGRESS`
(each module submits exactly once). After a successful submit the server persists one `answers` row per
payload item and flips `submission_modules.status → SUBMITTED`.

Request body (Quiz = MULTIPLE_CHOICE questions, Short Answer = SHORT_ANSWER questions):
```json
{ "answers": [ { "questionId": 21, "content": { "selectedOptionIds": [1] } },
               { "questionId": 22, "content": { "text": "The answer is..." } } ] }
```

Flow routing: **QUIZ** and **REWRITE** task types use the answers-array flow.
**ESSAY/RECORDING** use the file flow described in Phase 8 below.

Implementation notes:
- New domain `Answer` (submissionModuleId, questionId, content-as-JSON-string) + `AnswerRepository`
  port (`bulkCreate`, `findBySubmissionModuleId`); new `ModuleQuestion` read model +
  `ModuleQuestionRepository` port (`findByModuleIdOrderByOrderIndexAsc`) wrapping the shared
  `questions` entity. `SubmissionPersistenceMapper` maps `Answer` both ways.
- Per-question-type content validation: `MULTIPLE_CHOICE` ⇒ `content.selectedOptionIds` must be an
  array; `SHORT_ANSWER` ⇒ `content.text` must be a non-blank string. Missing/empty `answers`, null
  `questionId`/`content`, duplicate `questionId`, or wrong content shape → 400.
- Guard order: role = STUDENT (403) → module exists (404) → module `IN_PROGRESS` (400 if not) →
  submission exists (404) → submission owner (403) → task type supported (400) → payload valid.
- Response: `200 { "message": "Đã nộp phần làm bài.", "submissionModuleId": 150, "status": "SUBMITTED",
  "answers": [ { "id": 340, "questionId": 21, "content": { "selectedOptionIds": [1] } } ] }`.

Smoke tests (running app, seeded DB incl. questions for the quiz module, bearer tokens):
```bash
# success — student submits their own quiz module
curl -s -X POST http://localhost:8080/api/v1/submission-modules/{submissionModuleId}/submit \
  -H "Authorization: Bearer <studentAccessToken>" -H "Content-Type: application/json" \
  -d '{"answers":[{"questionId":21,"content":{"selectedOptionIds":[1]}}]}'

# already submitted / not IN_PROGRESS -> 400 "Phần làm bài này đã được nộp."
# missing or malformed answers -> 400 "Nội dung câu trả lời không hợp lệ."
# questionId not in the module -> 404 "Không tìm thấy phần làm bài hoặc câu hỏi."
# another student / teacher -> 403 "Bạn không có quyền thực hiện thao tác này."
# essay / recording module -> Phase-8 file flow (empty body {}); storage disabled -> 500 "Lưu trữ chưa được cấu hình."
```

### What the Phase-4 tests cover (+14 service + 1 controller + 9 API integration)
- `SubmissionServiceTest` (+14, Mockito): quiz happy path (answers persisted, module flipped to
  `SUBMITTED`), REWRITE/SHORT_ANSWER happy path, non-student 403, unknown module 404, already-submitted 400,
  another student 403, missing submission 404, missing/empty answers 400, null questionId/content 400,
  duplicate questionId 400, unknown question 404, wrong shape for quiz 400, wrong shape for short answer 400,
  essay stub 400.
- `SubmissionControllerTest` (+1): 200 mapping of submit result (message, submissionModuleId, status, answers[]).
- `SubmissionApiIntegrationTest` (+9, Testcontainers + MockMvc + real JWT, seeded `questions` rows for the
  quiz module): success (response JSON + `answers` rows in DB + module status `SUBMITTED`), resubmit 400,
  unknown question 404, missing/empty answers 400, malformed quiz content 400, duplicate questionId 400,
  foreign student 403, teacher 403, essay stub 400.

### Error contract (Phase 4 additions)
| Code | Message |
|---|---|
| 400 | `Phần làm bài này đã được nộp.` (module already submitted / status ≠ IN_PROGRESS) |
| 400 | `Nội dung câu trả lời không hợp lệ.` (missing/empty answers, null questionId/content, duplicate, wrong shape) |
| 404 | `Không tìm thấy phần làm bài hoặc câu hỏi.` (module, submission, or question not found) |
| 400 | `Loại phần làm bài này chưa được hỗ trợ.` (task type outside QUIZ/REWRITE/ESSAY/RECORDING) |
| 403 | `Bạn không có quyền thực hiện thao tác này.` (#43 non-student / not the owner) |

## Scope (Phase 5) — API #40 final submit of an entire submission
`POST /api/v1/submissions/{submissionId}/submit` (role = STUDENT, no body), V4 chapter 6 spec.
Locks the whole attempt: sets `submissions.status → SUBMITTED` + `submitted_at = now()`, and flips every
`submission_modules.status` still `IN_PROGRESS → SUBMITTED`. Modules already individually submitted via
#43 are left as-is (their answers persist). This phase implements the **submission mechanics only** —
auto-grading / scoring / answer-content augmentation is deliberately **out of scope** (separate feature):
grading rows stay `PENDING` with `final_score` null and the submission stays `SUBMITTED`.

Guard order: role = STUDENT (403) → submission exists (404) → owner (403) → status = `IN_PROGRESS`
(400 if not). Response:
`200 { "message": "Nộp bài thành công.", "status": "SUBMITTED", "submittedAt": "<ISO-8601 offset>" }`

Smoke tests (running app, seeded DB, student bearer token):
```bash
# success — a student submits their own attempt (nothing else required)
curl -s -X POST http://localhost:8080/api/v1/submissions/{submissionId}/submit \
  -H "Authorization: Bearer <studentAccessToken>"
# -> 200 {"message":"Nộp bài thành công.","status":"SUBMITTED","submittedAt":"..."}

# already submitted / not IN_PROGRESS -> 400 "Bài làm này đã được nộp."
# unknown submission -> 404 "Không tìm thấy lượt làm bài."
# another student / teacher -> 403 "Bạn không có quyền thực hiện thao tác này."
```

### What the Phase-5 tests cover (+7 service + 1 controller + 7 API integration)
- `SubmissionServiceTest` (+7, Mockito): happy path (submission → `SUBMITTED` with `submittedAt`, all
  `IN_PROGRESS` modules flipped, already-`SUBMITTED` module untouched, **no grading rows written**
  `verify(gradingRepository, never()).save/bulkCreate`), no-modules attempt still locks, non-student 403,
  unknown 404, another student 403, already-`SUBMITTED` 400, already-`GRADED` 400.
- `SubmissionControllerTest` (+1): 200 mapping (message, status, submittedAt).
- `SubmissionApiIntegrationTest` (+7, Testcontainers + MockMvc + real JWT): direct #40 on a mixed
  quiz+essay attempt (submission + both modules `SUBMITTED`, `submittedAt` set, gradings `PENDING` with
  `finalScore` null in DB), quiz module submitted earlier via #43 keeps its answers while the essay module
  is force-flipped, essay-only assignment (grading stays `PENDING`), resubmit 400, foreign student 403,
  teacher 403, unknown submission 404.

### Error contract (Phase 5 additions)
| Code | Message |
|---|---|
| 400 | `Bài làm này đã được nộp.` (#40, submission status ≠ IN_PROGRESS) |
| 404 | `Không tìm thấy lượt làm bài.` (#40, unknown submission) |
| 403 | `Bạn không có quyền thực hiện thao tác này.` (#40 non-student / not the owner) |

## Scope (Phase 6) — API #42 read one submission_module detail
`GET /api/v1/submission-modules/{submissionModuleId}` (bearer token), V4 chapter 6 spec.
Reads one module of an attempt: skill/taskType/status, its `grading` detail, its `questions`
(prompt + type + score + orderIndex), and its `answers`. **`correctAnswer` is revealed per question
only when `submission_module.status = GRADED`; otherwise it is null/absent.** For Essay/Speaking
modules `questions` stays empty and `answers` surfaces the file-metadata shape `{ id, questionId: null,
content: null, docStorageKey, docMimeType, docUploadStatus }` (or the `audio*` equivalent) once the
module is submitted via #43 — see Phase 8.

Visibility (same rule as #38, reuse `verifyReadAccess`): STUDENT sees only their own module (else 403),
TEACHER only classes they teach (else 403), ADMIN any, other roles 403. Unknown module id or a module
whose parent submission is missing → `404 "Không tìm thấy phần làm bài."`.

Response (module Quiz, đã chấm example):
```json
{ "id": 150, "moduleId": 9, "skill": "READING", "taskType": "QUIZ", "status": "GRADED",
  "grading": { "id": 77, "method": "AUTO", "status": "COMPLETED", "finalScore": 8.0,
               "maxScoreSnapshot": 10.0, "aiFeedback": null, "finalFeedback": null },
  "questions": [ { "id": 21, "content": "Which word best describes...?",
                   "questionType": "MULTIPLE_CHOICE", "score": 1.0, "orderIndex": 1,
                   "correctAnswer": { "options": [ { "id": 1, "content": "Option A", "isCorrect": true }, ... ] } } ],
  "answers": [ { "id": 340, "questionId": 21, "content": { "selectedOptionIds": [1] } } ] }
```

Smoke tests (running app, seeded DB incl. quiz questions, bearer tokens):
```bash
# student reads their own quiz module (IN_PROGRESS -> correctAnswer absent)
curl -s http://localhost:8080/api/v1/submission-modules/{submissionModuleId} \
  -H "Authorization: Bearer <studentAccessToken>"

# another student / teacher of another class -> 403 "Bạn không có quyền thực hiện thao tác này."
# unknown id -> 404 "Không tìm thấy phần làm bài."
```

### What the Phase-6 tests cover (+11 service + 1 controller + 7 API integration)
- `SubmissionServiceTest` (+11, Mockito): quiz IN_PROGRESS detail (grading PENDING, questions with
  content/type/score/orderIndex + `correctAnswer` null, answers re-parsed to JSON), quiz GRADED
  (`correctAnswer` populated), SUBMITTED (`correctAnswer` still null), no-grading-row → `grading` null,
  essay module (empty questions/answers + TEACHER_MANUAL grading), foreign student 403, class-teacher ok,
  foreign-class teacher 403, admin ok, unknown module 404, orphaned parent submission 404.
- `SubmissionControllerTest` (+1): 200 full-body mapping (grading detail, questions + correctAnswer,
  answers content).
- `SubmissionApiIntegrationTest` (+7, Testcontainers + MockMvc + real JWT, seeded `Question` rows):
  IN_PROGRESS quiz introspection (questions fields, answers empty, grading PENDING), GRADED quiz via
  `grade()` helper (correctAnswer options revealed, grading COMPLETED 8.0/10.0), SUBMITTED quiz with
  #43 answers (answers echoed, correctAnswer hidden), essay module (empty questions/answers,
  TEACHER_MANUAL PENDING), foreign student + foreign teacher 403, class-teacher + admin 200, unknown id 404.

### Error contract (Phase 6 additions)
| Code | Message |
|---|---|
| 404 | `Không tìm thấy phần làm bài.` (#42, unknown module / missing parent submission) |
| 403 | `Bạn không có quyền thực hiện thao tác này.` (#42 non-owner student / non-teaching teacher / other roles) |

## Scope (Phase 7a) — S3-compatible storage layer (no HTTP endpoints yet)
Provider-agnostic object-storage layer. Works with **any S3-compatible store** — Cloudflare R2,
NeonDB Storage, MinIO, AWS S3 — switching provider requires **only** changing the
`app.storage.s3.*` properties (endpoint + region + access keys + bucket), no code change.

- New port `application/port/StorageService`:
  - `generatePresignedPutUrl(storageKey, contentType)` → `PresignedUpload(uploadUrl, storageKey, expiresAt)`,
    presigned URL fixed at **15 minutes**.
  - `objectExists(storageKey)` → head-object check (consumed later by #43 Writing/Speaking submit).
- `infrastructure/storage/`:
  - `StorageProperties` — `app.storage.s3.*` (`enabled`, `endpoint`, `region`, `accessKeyId`,
    `secretAccessKey`, `bucket`, `pathStyle`).
  - `S3StorageService` — AWS SDK v2 (`S3Client` + `S3Presigner`), `endpointOverride` +
    path-style access, `Closeable`.
  - `S3StorageConfiguration` — conditional beans: `S3StorageService` when
    `app.storage.s3.enabled=true`; otherwise `UnavailableStorageService` (falls back with a clear
    `500 "Lưu trữ chưa được cấu hình."` on use) so the app **boots fine without any credentials**.
- Properties added to `application.properties` / `application-dev.properties` with `STORAGE_S3_*`
  env-var overrides (default `app.storage.s3.enabled=false`).
- `build.gradle`: AWS SDK v2 BOM `software.amazon.awssdk:bom:2.55.4` + `software.amazon.awssdk:s3`.
  (AWS SDK serializes with Jackson 2, already on the classpath via Hibernate JSON — no conflict with
  the Jackson 3 HTTP mapper.)

### Run the automated suite (no external credentials needed)
```bash
cd backend
./gradlew test --tests 'com.english_hub.core.modules.submission.infrastructure.storage.*'
# -> 4 tests, BUILD SUCCESSFUL (minio image: quay.io/minio/minio:latest, pulled automatically)
./gradlew test   # full suite: 286 tests, all green
```

### What the 4 Phase-7a tests cover
- `S3StorageServiceIntegrationTest` (2, MinIO Testcontainers):
  1. `presignedPutUrl_hasExpectedShape_andAllowsDirectUpload` — presigned PUT URL points at the MinIO
     endpoint with path-style key (`/englishhub-test/submissions/88/module-150/audio.webm`) + an
     `X-Amz-Signature`, `expiresAt` ≈ now + 15 min, `objectExists` false before → direct HTTP `PUT`
     (plain `java.net.http`, no secrets) → `objectExists` true after. This proves the exact flow R2 /
     NeonDB must support, against any S3-compatible endpoint.
  2. `objectExists_returnsFalse_forMissingKey`.
- `UnavailableStorageServiceTest` (2): fallback throws `ApiException` 500 with
  `Lưu trữ chưa được cấu hình.` for both methods.

### Notes
- `org.testcontainers:minio` has no 2.x release (stops at 1.21.4), and `docker pull minio/minio:latest`
  is denied in this environment — MinIO therefore runs via the existing `GenericContainer` (2.0.5)
  with the `quay.io/minio/minio:latest` image.
- Real-bucket smoke testing (R2 / NeonDB) is **deferred**: credentials will be added and testing
  requested by the backend owner later. No storage endpoints exist yet (they land in Phase 7b).

### Neon Storage operational notes (learned during the live smoke, 2026-09-24)
- **Buckets are branch-scoped.** The S3 endpoint (`https://<branch-id>.storage.c-<N>.<region>.aws.neon.tech`)
  selects the branch; credentials are scoped to that branch. The same bucket name on a *different* branch
  is a *different* bucket — the reason a "private `english-hub-dev`" and a "public `english-hub-dev`"
  appeared to coexist.
- **Access level is NOT settable via the S3 API.** `PutBucketAcl`/`PutBucketPolicy` return
  `501 Not Implemented`, and a plain S3 `CreateBucket` always creates a **`private`** bucket.
  Use the Neon Console (Object storage tab) or the Neon API/CLI
  (`neon buckets create <name> --access-level public_read`) to set `private` vs `public_read`.
- **`public_read` means anonymous `GetObject`/`HeadObject`** at
  `https://<branch-id>.storage.c-<N>.<region>.aws.neon.tech/<bucket>/<key>` — no CDN / custom domain
  (unlike Cloudflare R2's `r2.dev`). Writes always require credentials, so presigned PUT works on either
  access level. Object URLs are still "obscure-by-unknown-key", not a fix for sensitive data.
- **Current decision**: the app targets the **private** `english-hub-dev` bucket on branch
  `br-blue-tree-b3ldfn4i`. All Phase 7/8 storage operations (presigned PUT, `objectExists`) are
  authenticated and work fine. Serving files to reviewers is deferred to a future **presigned GET**
  endpoint (see Next) instead of a public bucket.
- **Live smoke discovered + fixed**: a `NoSuchBucket` for `english-hub-dev` mid-smoke prompted an S3-API
  bucket creation (private by construction) and exposed a pre-existing bug — `Grading.aiTranscript` was
  typed Jackson 3 (`tools.jackson.JsonNode`) while Hibernate 7.4.5's JSONB mapper uses Jackson 2, which
  crashed `dev,seed` boots at `GradingMockDataSeeder`. Fixed to the String-facing pattern used by
  `Answer`/`Question` (via `JsonbValueCodec`); suite stays 276 green.
- **Cleanup (2026-09-24)**: smoke objects removed from `english-hub-dev` (now empty); the leftover typo
  bucket `englhish-hub-dev` was deleted. `uploads` (empty) left untouched.

## Scope (Phase 7b) — presigned upload URL endpoints (#46, #47)
`POST /api/v1/submission-modules/{submissionModuleId}/audio-upload-url` and
`POST /api/v1/submission-modules/{submissionModuleId}/document-upload-url` (role = STUDENT, JSON body
`{ "mimeType": "..." }`), V4 chapter 6 spec. Both consume the Phase 7a `StorageService` port and return a
15-minute presigned PUT URL so the client can upload straight to the bucket, then call `#43` to submit.

Guard order (both): role = STUDENT (403) → module exists (404 `Không tìm thấy phần làm bài.`) → parent
submission exists (404) → owner (403) → module `IN_PROGRESS` (400) → task-type/skill bounds (400).
Response: `200 { "uploadUrl", "storageKey", "expiresAt" }`.

- **#46 audio**: guard `task_type = RECORDING` **or** `skill = SPEAKING`; MIME whitelist
  `audio/webm → .webm`, `audio/mpeg → .mp3`, `audio/wav → .wav` (other MIME → 400
  `Định dạng file không được hỗ trợ.`); 400 for non-Speaking or non-`IN_PROGRESS`:
  `Không thể upload ghi âm cho phần làm bài này.`; key `submissions/{submissionId}/module-{smId}/audio.{ext}`.
- **#47 document**: guard `task_type in [ESSAY, REWRITE]`; MIME whitelist `application/pdf → .pdf`,
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document → .docx`; 400 for others:
  `Định dạng file không được hỗ trợ.`; 400 for non-Writing or non-`IN_PROGRESS`:
  `Không thể upload tài liệu cho phần làm bài này.`; key `submissions/{submissionId}/module-{smId}/essay.{ext}` (both ESSAY and REWRITE).

Smoke tests (running app, seeded DB with a SPEAKING/RECORDING module + a WRITING/ESSAY module, student bearer token):
```bash
# get a speaking upload URL, then PUT a file straight to the bucket
curl -s -X POST http://localhost:8080/api/v1/submission-modules/{smId}/audio-upload-url \
  -H "Authorization: Bearer <studentAccessToken>" -H "Content-Type: application/json" \
  -d '{"mimeType":"audio/mpeg"}'
# -> 200 {"uploadUrl":"https://<endpoint>/submissions/88/module-150/audio.mp3?...","storageKey":"submissions/88/module-150/audio.mp3","expiresAt":"..."}
curl -s -T sample.mp3 "<uploadUrl from above>"

# writing document url + PUT a pdf
curl -s -X POST http://localhost:8080/api/v1/submission-modules/{smId}/document-upload-url \
  -H "Authorization: Bearer <studentAccessToken>" -H "Content-Type: application/json" \
  -d '{"mimeType":"application/pdf"}'
curl -s -T essay.pdf "<uploadUrl>"

# error cases
# non-Speaking module / already SUBMITTED -> 400 "Không thể upload ghi âm cho phần làm bài này."
# bad mime (e.g. audio/ogg, text/plain) -> 400 "Định dạng file không được hỗ trợ."
# non-Writing module / already SUBMITTED -> 400 "Không thể upload tài liệu cho phần làm bài này."
# unknown id -> 404 "Không tìm thấy phần làm bài."
# other student / teacher -> 403 "Bạn không có quyền thực hiện thao tác này."
```

### What the Phase-7b tests cover (+14 service + 2 controller + 8 API integration)
- `SubmissionServiceTest` (+14, Mockito + mocked `StorageService`): audio happy path (storage key
  `submissions/88/module-150/audio.webm` forwarded with the MIME), `.mp3`/`.wav` mapping, unsupported MIME 400,
  non-student 403, unknown module 404, missing parent 404, foreign student 403, module `SUBMITTED` 400,
  non-Speaking/Recording module 400; document happy path (`essay.pdf`), `.docx` + REWRITE acceptance,
  `text/plain` 400, non-Writing module 400, `SUBMITTED` 400.
- `SubmissionControllerTest` (+2): both endpoint mappings → 200 exact body (uploadUrl, storageKey, expiresAt).
- `SubmissionUploadUrlApiIntegrationTest` (+8, Postgres + **MinIO** containers, dynamic
  `app.storage.s3.*` → real `S3StorageService` bean): audio/webm and document/pdf **uploadUrl → direct HTTP
  `PUT` succeeds → injected `StorageService.objectExists(key) == true`**, exact storage-key shapes,
  unsupported MIME 400, non-Speaking/non-Writing 400, already-`SUBMITTED` 400, foreign student + teacher
  403, unknown id 404.

### Error contract (Phase 7b additions)
| Code | Message |
|---|---|
| 404 | `Không tìm thấy phần làm bài.` (#46/#47 unknown module or missing parent) |
| 400 | `Không thể upload ghi âm cho phần làm bài này.` (#46 non-Speaking/Recording, not IN_PROGRESS) |
| 400 | `Không thể upload tài liệu cho phần làm bài này.` (#47 non-Writing, not IN_PROGRESS) |
| 400 | `Định dạng file không được hỗ trợ.` (#46/#47 unsupported MIME) |
| 403 | `Bạn không có quyền thực hiện thao tác này.` (#46/#47 non-student / not the owner) |

## Scope (Phase 8) — API #43 submit for Writing/Speaking (ESSAY / RECORDING)
The same `POST /api/v1/submission-modules/{submissionModuleId}/submit` now handles **ESSAY** and
**RECORDING** modules. The client uploads the file via **#46/#47**, then calls #43 with an **empty body
`{}`** — the server ignores `payload.answers` and inspects storage itself.

- **ESSAY** → probes (in order) `submissions/{submissionId}/module-{smId}/essay.pdf` then `essay.docx`
  via `StorageService.objectExists`.
- **RECORDING** → probes `audio.webm`, then `audio.mp3`, then `audio.wav`.
- First hit wins: creates **one** `answers` row with `question_id` null, `content` null,
  `doc_storage_key`/`doc_mime_type`/`doc_upload_status = READY` (or the `audio_*` columns) and flips
  `submission_modules.status → SUBMITTED`.
- No hit → the same row is created with `upload_status = UPLOADING` and a **null** storage key (file in
  flight / not uploaded). This means **calling submit without #46/#47 still succeeds** (UPLOADING), it
  does not block.
- Response `200`:
  ```json
  { "message": "Đã nộp phần làm bài.", "submissionModuleId": 151, "status": "SUBMITTED",
    "answers": [ { "id": 341, "questionId": null, "content": null,
                   "docStorageKey": "submissions/88/module-151/essay.pdf",
                   "docMimeType": "application/pdf", "docUploadStatus": "READY",
                   "audioStorageKey": null, "audioMimeType": null, "audioUploadStatus": null } ] }
  ```
- `#42` module detail now returns the same file-metadata inside `answers` for submitted Essay/Speaking
  modules.
- `REWRITE` is **unchanged** (short-answer path) — note: `#47` still allows a REWRITE doc upload, which
  is currently a non-functional asymmetry (PM follow-up logged in Next).
- `audio_file_size_bytes` / `doc_file_size_bytes` / `audio_duration_seconds` stay `null` (no size HEAD);
  an `UPLOADING` answer never auto-flips to `READY` (no background job, V4 semantics).

Smoke tests (running app with storage enabled + seeded SPEAKING/RECORDING + WRITING/ESSAY modules,
student bearer token; storage keys use the app's bucket):
```bash
# 1) upload an audio file, then submit that RECORDING module with an empty body
curl -s -X POST http://localhost:8080/api/v1/submission-modules/{smId}/audio-upload-url \
  -H "Authorization: Bearer <studentAccessToken>" -H "Content-Type: application/json" \
  -d '{"mimeType":"audio/webm"}'                 # -> { uploadUrl, storageKey, expiresAt }
curl -s -T sample.webm "<uploadUrl>" -H "Content-Type: audio/webm"
curl -s -X POST http://localhost:8080/api/v1/submission-modules/{smId}/submit \
  -H "Authorization: Bearer <studentAccessToken>" -H "Content-Type: application/json" -d '{}'
# -> 200 {"answers":[{"id":...,"questionId":null,"content":null,"audioStorageKey":"submissions/.../audio.webm",
#        "audioMimeType":"audio/webm","audioUploadStatus":"READY", ...}]}

# 2) submit an ESSAY module WITHOUT uploading anything first
#    -> 200, but docUploadStatus "UPLOADING" and docStorageKey null (submit is NOT blocked)

# resubmitting the same module -> 400 "Phần làm bài này đã được nộp."
```

- **Live smoke #43 essay/recording against **real Neon Storage** is DONE** (2026-09-24, right after the full
  suite went green): bootRun `dev,seed` on :8080, assignment 3 force-opened (was past window), student
  `vo.bao.quynh@gmail.com` started submission 218. Essay (sm 871): presigned document PUT (`application/pdf`)
  → 200 → `submit {}` → `docStorageKey submissions/218/module-871/essay.pdf`, `docMimeType application/pdf`,
  `docUploadStatus READY`, `questionId/content null`. Recording (sm 872): presigned audio PUT (`audio/webm`)
  → 200 → `submit {}` → `audioStorageKey .../audio.webm`, `audioMimeType audio/webm`, `audioUploadStatus
  READY`. No-upload case (attempt 2, sm 875): `submit {}` → `docUploadStatus UPLOADING`, `docStorageKey null`
  (submission not blocked, as designed). Resubmit sm 871 → 400 `Phần làm bài này đã được nộp.`. #42 detail
  for sm 871 echoes the file metadata. Smoke objects deleted afterwards (bucket empty; boto3 against the same
  endpoint).

### What the Phase-8 tests cover (+6 service + 0 controller + 5 MinIO API integration, 1 integration converted)
- `SubmissionServiceTest` (+6, Mockito + mocked `StorageService.objectExists`): essay READY with
  `essay.pdf` (probes pdf first, never probes docx), probes `essay.docx` when pdf missing, essay
  `UPLOADING` when nothing exists (both probes called, null key), recording READY with `audio.webm`,
  probes `audio.mp3` when webm missing, recording `UPLOADING` (all three probes). Each asserts the answer
  row is created with `questionId` null + `content` null and the module flips to `SUBMITTED`.
- `SubmissionUploadUrlApiIntegrationTest` (+5, Postgres + MinIO e2e): essay READY after a real presigned
  PUT → #43 (key + `application/pdf` + READY, null questionId/content), essay UPLOADING when nothing
  uploaded, recording READY after real PUT (`audio/webm`), recording UPLOADING when nothing uploaded,
  `#42` module detail echoes the essay metadata after submit.
- `SubmissionApiIntegrationTest` (1 converted, no MinIO/config): essay submit without storage configured
  → `500 "Lưu trữ chưa được cấu hình."` (documents the storage dependency of the file flow).
- Previous "essay stub → 400" tests were removed/replaced (essay is now supported).

### Error contract (Phase 8 additions)
| Code | Message |
|---|---|
| 500 | `Lưu trữ chưa được cấu hình.` (essay/recording submit when `app.storage.s3.enabled=false`) |
| (unchanged) | #43 guards for QUIZ/REWRITE remain; `Loại phần làm bài này chưa được hỗ trợ.` now only for task types outside QUIZ/REWRITE/ESSAY/RECORDING |

## Next (for whoever picks up the next feature)
- **Presigned GET serving (approved follow-up, bucket stays private)** — extend the `StorageService`
  port with `generatePresignedGetUrl(storageKey, ttl)` (e.g. 15 min, matching PUTs) and implement it in
  `S3StorageService` via `S3Presigner.presignGetObject`. Expose a secured endpoint (student-owner /
  teacher) so the FE can render `<audio>` / download essays — this is how reviewers read the submitted
  files on a private bucket (no `public_read` needed). Log it on the task board ahead of the
  grading/review screens.
- **Resolve the REWRITE doc-upload asymmetry (PM decision needed)** — `#47` grants a
  `document-upload-url` for `REWRITE` modules, but `#43` routes REWRITE to the short-answer path, so a
  REWRITE document is never persisted/checked. Either keep REWRITE short-answers and narrow `#47` to
  `ESSAY` only, or let REWRITE submit accept an optional attached document.
- Auto-grading of Quiz answers on submit (read `is_correct` snake_case from `correct_answer`, promote
  graded modules/submission to `GRADED`, `max_score_snapshot` = sum of question scores, exact-set
  multiple-choice + trimmed short-answer matching, unanswered → 0).
- **Live smoke of #46/#47 against the real provider is DONE** (2026-09-24): with `dev,seed` + a
  force-opened assignment, student `vo.bao.quynh@gmail.com` uploaded an mp3 and a pdf straight to the
  `english-hub-dev` bucket via the presigned URLs (200s). Gotcha: the presign signs `content-type`, so
  the direct PUT must send the exact MIME from the URL call — curl's default
  `application/x-www-form-urlencoded` returns `403 SignatureDoesNotMatch`. Smoke objects were
  subsequently cleaned up (bucket now empty). Phase 8's submit reuses the same probe mechanism.