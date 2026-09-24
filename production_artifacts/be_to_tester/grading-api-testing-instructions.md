# Grading API (#48–#57) — Tester Handoff (BE-TASK-9)

## Scope

Base path: `/api/v1`. Send `Authorization: Bearer <accessToken>` using the role and account under test.

- #48 `GET /submission-modules/{id}/grading`
- #49 `POST /submission-modules/{id}/grading/ai-analyze`
- #50 `PUT /gradings/{id}`
- #51 `GET /gradings/{id}`
- #52 `GET /gradings?classId=&studentId=&status=&page=1&limit=20`
- #53 `GET /answers/{id}/annotations`
- #54 `POST /answers/{id}/annotations`
- #55 `PATCH /annotations/{id}/review`
- #56 `DELETE /annotations/{id}`
- #57 `GET /gradings/{id}/change-logs`

## Test data

Use a development/test database with the prerequisite class, enrolled student, assignment modules, submissions, answers and teachers. `GradingMockDataSeeder` runs under the `seed` profile. It adds a submitted attempt with one Writing and one Speaking grading in `PENDING`; use their logged `submissionModuleId` values for #49. Existing `AI_GRADED` and `COMPLETED` fixtures remain available.

The pending Writing/Speaking grading uses `GradingMethod.AUTO` and has no AI feedback, transcript, final score, final feedback, review fields or annotations. The seed runner saves the fixture through Spring Data repositories. It also retains a baseline `TRUNCATE` through `createNativeQuery` to clear grading/annotation rows before seeding; run the seed profile only against a disposable development/test database.

## API scenarios

### #48 and #51 — read grading

- Teacher responsible for the class and the submission's student can read the grading.
- A teacher from another class and unrelated users receive `403`.
- Error responses use the existing `{ "error": "..." }` envelope.

### #49 — request AI analysis

- Call with both pending Writing and pending Speaking fixtures. Expect HTTP `202`.
- Confirm the grading remains `PENDING`; `aiFeedback`, `finalScore`, `finalFeedback` and `gradedAt` stay null. The stub does not fabricate transcript or annotations.
- Only the responsible teacher can make the request. A non-owner gets `403`.
- A grading that is not `PENDING`, a non-submitted module, or a skill other than Writing/Speaking is rejected with `400`.

### #50 — update final grade

- Responsible teacher can update a score within `0..maxScoreSnapshot`.
- A teacher from another class and a caller whose role is not `TEACHER` get `403`.
- A score below zero or above the snapshot maximum gets `400`.
- A numerically changed score creates one change-log entry. A numerically equal score (for example `8.0` and `8.00`) or feedback-only update creates none.

### #52 — list gradings

- Exercise `classId`, `studentId`, and `status` filters individually and together; check rows and pagination for the requested `page`/`limit`.
- Response is the endpoint-specific `{ "data": [...], "pagination": { "page": ..., "limit": ..., "total": ... } }` shape.

### #53 — list annotations

- Read annotations for an answer the caller may access.
- Response is `{ "data": [...] }`; it is an ordinary list and has no `pagination`/`meta` fields or `page`/`size` parameters.

### #54–#57 — annotations and change log

- #54 teacher-created annotation uses `source=TEACHER` and `reviewStatus=ACCEPTED`; reject negative, reversed, or out-of-content offsets.
- AI annotations begin in `PENDING`. #55 lets the responsible teacher review AI annotations as `ACCEPTED` or `REJECTED`; teacher-created annotations cannot be reviewed through this endpoint.
- #56 permits the responsible teacher to delete an annotation.
- #57 returns change-log entries for a grading, newest first, to an authorized teacher/admin.

Errors retain the current `ApiError{error}` contract. No new `ApiResponse` or `ApiPageMeta` wrapper is used.

## Automated checks

Run from `backend/` with Java 21:

```bash
./gradlew assemble
./gradlew test \
  --tests 'com.english_hub.core.modules.grading.domain.model.GradingTest' \
  --tests 'com.english_hub.core.modules.grading.domain.model.AnswerAnnotationTest' \
  --tests 'com.english_hub.core.modules.grading.application.service.GradingServiceTest' \
  --tests 'com.english_hub.core.modules.grading.presentation.rest.GradingControllerMockMvcTest' \
  --tests 'com.english_hub.core.modules.grading.integration.GradingPersistenceIntegrationTest' \
  --tests 'com.english_hub.core.modules.grading.integration.GradingApiIntegrationTest'
```

## Implementation decisions and fixes affecting this handoff

- `GradingService` is one concrete class with constructor injection. `GradingAiAnalysisService` remains an interface with `GradingAiAnalysisServiceImpl` as the async stub.
- #49 retains the `PENDING` condition; #52 uses the existing pagination envelope; #53 is not paginated.
- The `Grading.aiTranscript` JSONB mapping now uses Jackson 2 `com.fasterxml.jackson.databind.JsonNode`, following the workaround documented for `Answer.content`. This was a suspected pre-existing bug, confirmed and fixed here for the first time. No database column type or migration changed.
- The seeder's transcript node creation/validation is aligned to Jackson 2. Its score-versus-answer assertion applies to `AUTO` gradings whose status is not `PENDING`; the existing `PENDING` invariants remain unchanged.
- The response-envelope mismatch with `.agents/rules/common-conventions.md` was left for PM/team follow-up as agreed.

## Latest CHECK result (24/09/2026)

- `./gradlew assemble`: **PASS**.
- Six Cụm 6 test classes: **30 pass, 0 fail, 0 skipped**. Both Testcontainers classes ran with PostgreSQL/Docker.
- Prohibited-keyword scan across Cụm 6 production/tests and the seeder: `JdbcTemplate` 0, `SELECT * FROM` 0, `@ManyToOne` 0, `@PreAuthorize` 0, `@AuthenticationPrincipal` 0. `createNativeQuery` has one baseline-only match: `GradingMockDataSeeder.java:545`, the existing table reset. It appears in baseline commit `47afcddfb0d61fe284b825a11e6903f6192b2771` at line 250 and is not an added/deleted line in the Cụm 6 diff.
- No git add, commit or push was performed.

## Worktree note

Current branch is `feature/grading-api`; it has no upstream tracking branch configured, so ahead/behind is unavailable. The worktree also contains changes outside Cụm 6: `.gitignore`, `docker-compose.dev.yml`, `docs/DATAMOCK_GUIDE.md`, `production_artifacts/be_to_tester/mock-data-task-06.md`, `docs/Agent_Coding_Workflow.md`, `docs/Repo_status.md`, and active task files `BE-TASK-9.yaml`/`BE-TASK-10.yaml`. These were not modified while consolidating the handoff.
