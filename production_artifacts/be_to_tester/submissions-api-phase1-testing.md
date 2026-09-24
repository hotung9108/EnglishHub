# Submissions/Answers API — Phase 1 + Phase 2 + Phase 3 + Phase 4 + Phase 5 + Phase 6 Testing Instructions

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
./gradlew test   # full suite: 248 tests (unit + integration), all green
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
./gradlew test   # full suite: 248 tests (unit + integration), all green
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

Flow routing: **QUIZ** and **REWRITE** task types use the answers-array flow. **ESSAY/RECORDING**
currently return 400 `Loại phần làm bài này chưa được hỗ trợ.` — their R2 submit lands in Phase 8.

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
# essay module stub -> 400 "Loại phần làm bài này chưa được hỗ trợ."
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
| 400 | `Loại phần làm bài này chưa được hỗ trợ.` (ESSAY/RECORDING until Phase 8) |
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
modules `questions` and `answers` are empty arrays (the file-metadata answer shape from V4 lands with
the Phase 8 upload feature).

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

## Next (for whoever picks up the next feature)
- Auto-grading of Quiz answers on submit (read `is_correct` snake_case from `correct_answer`, promote
  graded modules/submission to `GRADED`, `max_score_snapshot` = sum of question scores, exact-set
  multiple-choice + trimmed short-answer matching, unanswered → 0).
- #46/#47 presigned R2 upload URLs + #43 Writing/Speaking R2 submit (which then also fills the
  Essay/Speaking `answers` file metadata in #42), per the Phase 8 flow.