# Auto grading on module submit

Delivered by @be-primary for @tester. Implements the deterministic answer-comparison grading that
`docs/api/api_v4_design_chapter_6_submissions_answers.md` section 6.4 and 6.6 already promised.

## Scope

When a student submits a `submission_module`, the answers are compared against
`questions.correct_answer` **after the submit transaction commits**, on a background executor.

| `skill` + `taskType` | Auto graded |
|:---|:---:|
| `READING` + `QUIZ` | yes |
| `READING` + `REWRITE` | yes (**newly allowed module pair**) |
| `LISTENING` + `QUIZ` | yes |
| `LISTENING` + `REWRITE` | no — not a creatable pair |
| `WRITING` + `ESSAY` | no — teacher |
| `SPEAKING` + `RECORDING` | no — teacher |

## Two client-visible behaviour changes

1. **`READING` + `REWRITE` is now a valid module pair.** `POST /assignments/{id}/modules` used to
   reject it with `Skill và taskType không hợp lệ.`
2. **`REWRITE` no longer accepts document upload.** `POST /submission-modules/{id}/document-upload-url`
   now returns `400 Không thể upload tài liệu cho phần làm bài này.` for a `REWRITE` module.
   `REWRITE` is answered with an `answers` array through
   `POST /submission-modules/{id}/submit`, exactly like `QUIZ`.

## The submit response is unchanged and carries no verdict

Grading is asynchronous, so `POST /submission-modules/{id}/submit` still returns `200` immediately
with `status: "SUBMITTED"` and the raw answer content. There is **no** `isCorrect` or `score` in
that response. Poll `GET /submission-modules/{id}` until `grading.status` leaves `PENDING`.

## What to assert

| Field | Expected after grading |
|:---|:---|
| `gradings.method` | `AUTO` |
| `gradings.status` | `COMPLETED` |
| `gradings.finalScore` | sum of the scores of the correct questions, capped at the module `maxScore` |
| `gradings.maxScoreSnapshot` | the module `maxScore` |
| `gradings.gradedAt` | non-null |
| `gradings.reviewedBy`, `gradings.reviewedAt` | `null` |
| `answers.content.isCorrect` | boolean, merged into the existing JSONB |
| `answers.content.score` | number, merged into the existing JSONB |
| `submission_modules.status` | `GRADED` |

### Comparison rules

- `MULTIPLE_CHOICE`: the set of `selectedOptionIds` must equal exactly the set of option ids flagged
  `isCorrect`. Selecting a correct option **plus** a wrong one is `false`. An empty selection is
  `false`.
- `SHORT_ANSWER`: `text` is compared after Unicode NFC folding, trimming, collapsing internal
  whitespace runs and `Locale.ROOT` lowercasing. **Punctuation is significant** — `"English"` vs
  `"English."` is `false`.
- Unanswered questions score `0` and get `isCorrect: false`. Partial submissions are allowed.
- A module the teacher grades stays `PENDING` / `SUBMITTED` and is never touched.

### Idempotency and failure

- Grading is idempotent: once the grading row leaves `PENDING`, later runs skip it, so no score can
  be counted twice.
- A grading failure sets `gradings.status = FAILED` and never fails the student's submit request,
  which has already committed.

## Fixtures

- `AutoGradingIntegrationTest` (new, Testcontainers, deliberately **not** `@Transactional`) covers the
  whole path end to end, including that the response precedes grading.
- `AutoGraderTest`, `AnswerComparatorTest` cover comparison and scoring rules.
- `AutoGradingServiceTest` covers eligibility, the grading-row lock and idempotency.
- `AutoGradingListenerTest` covers that a rejected executor task and a failed failure-record both
  leave the committed submit untouched.

## Notes for manual testing

- Auto grading is a background task. When verifying by hand, allow a short delay before reading the
  grading, and re-read rather than assuming the first read is final.
- `essay` and `recording` modules cannot be submitted without object storage configured, so the
  integration test supplies a stub `StorageService`. Expect `500 Lưu trữ chưa được cấu hình.` on
  those modules in an unconfigured environment.
- No database migration was added, so this deploys as code only.