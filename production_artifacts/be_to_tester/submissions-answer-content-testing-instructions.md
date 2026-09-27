# Submissions — typed `content` contract for `POST /submission-modules/{id}/submit`

Delivered by @be-primary for @tester. Follows the `correctAnswer` typed contract shipped in
`d7462d1` for the Question API.

## Scope

`SubmitModuleRequest.AnswerPayload.content` is no longer a raw `JsonNode`. It is now a **sealed
interface** `AnswerContent` with exactly two permitted subtypes, mirroring
`question/presentation/rest/dto/correctanswer/`:

```
backend/src/main/java/com/english_hub/core/modules/submission/presentation/rest/dto/answercontent/
├── AnswerContent.java                    sealed interface, permits both subtypes
├── MultipleChoiceAnswerContent.java      record(List<Long> selectedOptionIds)
├── ShortAnswerAnswerContent.java         record(String text)
└── AnswerContentDeserializer.java        ValueDeserializer<AnswerContent>
```

**Wire format is unchanged.** No discriminator field is added, no key is renamed. `{"selectedOptionIds": [...]}`
still means multiple choice and `{"text": "..."}` still means short answer; the subtype is resolved
from the payload shape, exactly like `CorrectAnswerDeserializer` does for `correctAnswer`.

## What changed for the client

Only the **error granularity**. Previously every malformed `content` collapsed into one message;
now the failing layer reports itself.

| Case | Status | `error` |
|:---|:---:|:---|
| Success | `200` | `"Đã nộp phần làm bài."` |
| `{}` or `{"answers":[]}` | `400` | `Nội dung câu trả lời không hợp lệ.` (unchanged) |
| Duplicate `questionId` | `400` | `Nội dung câu trả lời không hợp lệ.` (unchanged) |
| Shape does not match the question's `questionType` | `400` | `Nội dung câu trả lời không hợp lệ.` (unchanged) |
| Unrecognised shape, e.g. `{"answer":"x"}` | `400` | `Nội dung câu trả lời phải là {"selectedOptionIds": [...]} cho MULTIPLE_CHOICE hoặc {"text": "..."} cho SHORT_ANSWER.` **(new)** |
| `content` absent or `null` | `400` | `content là bắt buộc.` **(new)** |
| `selectedOptionIds: []` | `400` | `selectedOptionIds không được để trống.` **(new)** |
| `selectedOptionIds: [0]` | `400` | `selectedOptionIds phải là số nguyên dương.` **(new)** |
| `text: "   "` | `400` | `text không được để trống.` **(new)** |

The last four are **breaking only in message text**, not in status code — all were `400` before too.

### Validation ordering (deliberate, please regression-test it)

Field-level rules fire **before** the service checks the shape against the question type. So posting
`{"text": "   "}` to a `MULTIPLE_CHOICE` question returns `text không được để trống.`, **not** the
type-mismatch message. Covered by `submitModuleRejectsBlankShortAnswerTextBeforeCheckingTheQuestionType`.

## Behaviour deliberately left alone

- **Read path is untouched.** `SubmitModuleResponse.AnswerResponse.content`,
  `AnswerDetailResponse.content` and `AnswerResult.content` are still `JsonNode`. Seeded/legacy rows
  keep their snake_case `selected_option_ids` / `answer_text` keys plus `is_correct` / `score`
  grading extras, and they are still returned verbatim.
- **Persistence is unchanged.** `answers.content` is still JSONB holding camelCase
  `selectedOptionIds` / `text` for API-submitted answers.
- **Essay / Speaking modules** (`taskType` `ESSAY` / `RECORDING`) never reach the content contract;
  they submit `{}` and the service resolves the uploaded file.

## Known looseness (same as the `correctAnswer` contract)

Jackson coerces a JSON scalar into `String` by default, so `{"text": 123}` is accepted and becomes
`text: "123"`. Documented in `AnswerContentDeserializerTest.coercesNonStringText`. Tightening it
would mean disabling scalar coercion globally, which is out of scope here.

## Run the automated suite

Tests use **Testcontainers** (`postgres:16-alpine`) — Docker must be running; no local DB needed.

```bash
cd backend

# New tests for this change
./gradlew test --tests '*AnswerContentDeserializerTest'   # 10 tests: shape resolution + rejection
./gradlew test --tests '*AnswerContentValidationTest'     # 10 tests: bean-validation rules + cascade

# Regression
./gradlew test --tests '*SubmissionServiceTest'          # 78 tests
./gradlew test --tests '*SubmissionControllerTest'      # 10 tests
./gradlew test --tests '*SubmissionApiIntegrationTest'  # 54 tests, real HTTP + JSONB round-trip

./gradlew test   # full suite: 526 tests, all green
```

## Coverage added

`AnswerContentDeserializerTest` — subtype resolution, precedence when both keys are present,
rejection of unrecognised/non-object/wrongly-typed payloads, and the `toMap()` rendering used for
the JSONB column.

`AnswerContentValidationTest` — every bean-validation rule, plus two cascade guards. The cascade is
easy to regress: `SubmitModuleRequest.answers` needs `List<@Valid AnswerPayload>` **and**
`AnswerPayload.content` needs `@Valid`. Drop either and a malformed answer silently reaches the
service.

`SubmissionServiceTest` — `submitModuleRejectsWrongContentShapeForQuiz` and
`...ForShortAnswer` are replaced by `submitModuleRejectsAnAnswerWhoseShapeDoesNotMatchTheQuestionType`
and `submitModuleRejectsAnAnswerWithNoClaimedQuestionType`, since shape detection is no longer the
service's job. Helpers `multipleChoice`/`shortAnswer` now build `AnswerPayload` directly.

`SubmissionControllerTest` — added `projectsTheSealedAnswerContentOntoTheServicePayload` (captures the
`AnswerPayload` handed to the service to assert both the type and the rendered map) and
`passesANullPayloadListThroughWhenNoAnswersAreSent`.

`SubmissionApiIntegrationTest` — added 5 cases: unrecognised shape, empty selection, non-positive
option id, blank text ordering, and null content.

## Manual smoke test

1. `POST /api/v1/assignments/{id}/submissions` as a student, then
   `GET /api/v1/submission-modules/{id}` to get a `MULTIPLE_CHOICE` question id.
2. Submit `{"answers":[{"questionId":<mcId>,"content":{"selectedOptionIds":[1]}}]}` → `200`, and the
   response `answers[0].content` is `{"selectedOptionIds":[1]}`.
3. Submit the same with `{"text":"The answer is..."}` → `400`
   `Nội dung câu trả lời không hợp lệ.`
4. Submit with `{"answer":"x"}` → `400` with the new shape message.
5. Re-fetch the module detail and confirm `answers[].content` still round-trips unchanged.
