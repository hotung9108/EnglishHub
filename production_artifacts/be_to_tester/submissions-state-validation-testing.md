# Submissions — state validation on #40, #42, #43, #46, #47

BE-TASK-12 (`@be-secondary`). Every rule below is enforced in
`SubmissionService` (module `com.english_hub.core.modules.submission`).

## Rule set

| Endpoint | Rule | Code / message |
|---|---|---|
| `POST /submissions/{id}/submit` (#40) | `submission.status` phải là `IN_PROGRESS`. Module nào còn `IN_PROGRESS` **vẫn được force-flip sang `SUBMITTED`** (giữ nguyên hành vi cũ). | `400` `Bài làm này đã được nộp.` |
| `POST /submission-modules/{id}/submit` (#43) | Module **và** `submission` cha đều phải `IN_PROGRESS`. Kiểm tra module chạy trước, kiểm tra submission cha sau. | `400` `Phần làm bài này đã được nộp.` (module) · `400` `Bài làm này đã được nộp.` (submission cha) |
| `POST /submission-modules/{id}/audio-upload-url` (#46) | Module **và** `submission` cha đều phải `IN_PROGRESS`. | `400` `Không thể upload ghi âm cho phần làm bài này.` |
| `POST /submission-modules/{id}/document-upload-url` (#47) | Module **và** `submission` cha đều phải `IN_PROGRESS`. | `400` `Không thể upload tài liệu cho phần làm bài này.` |
| `GET /submission-modules/{id}` (#42) | `submission_module` **và** `submission` cha đều phải là `SUBMITTED` hoặc `GRADED`. | `400` `Phần làm bài chưa được nộp.` |

**Thứ tự ưu tiên ở #42** (quan trọng khi test): `404` (không tìm thấy) → `403`
(sai người dùng / sai lớp) → `400` (chưa nộp). Người dùng không sở hữu bài vẫn nhận `403`,
không phải `400`.

**Breaking change cần lưu ý:** #42 trước đây trả `200` cho module `IN_PROGRESS`. Nay `400`.
Muốn đọc lại module khi đang làm dở thì dùng `GET /submissions/{id}` (#38) — endpoint đó
không có state gate và vẫn trả `modules[]` kèm `status` cho mọi lượt làm bài.

## Manual smoke test

```bash
BASE=http://localhost:8080/api/v1
STUDENT="Authorization: Bearer <studentAccessToken>"
```

1. `POST $BASE/assignments/{id}/submissions` → `201`, lấy `submissionId` và
   `modules[0].id` → `submissionModuleId`.
2. `GET $BASE/submission-modules/$submissionModuleId` → `400`
   `{"error":"Phần làm bài chưa được nộp."}` (module lẫn submission đều `IN_PROGRESS`).
3. `POST $BASE/submission-modules/$submissionModuleId/submit` với body quiz hợp lệ
   (xem `submissions-api-phase1-testing.md`) → `200`, module chuyển `SUBMITTED`.
4. `GET $BASE/submission-modules/$submissionModuleId` → **vẫn `400`** vì
   `submission` cha còn `IN_PROGRESS` → đây là case "module submitted nhưng bài chưa nộp".
5. `POST $BASE/submissions/$submissionId/submit` → `200` (module `IN_PROGRESS` còn lại bị
   force-flip `SUBMITTED`).
6. `GET $BASE/submission-modules/$submissionModuleId` → `200`, `status: "SUBMITTED"`,
   `questions[].correctAnswer` vẫn `null`.
7. `POST $BASE/submissions/$submissionId/submit` lần 2 → `400` `Bài làm này đã được nộp.`
8. Trên một submission mới (chưa #40): `POST $BASE/submission-modules/{speakingModuleId}/audio-upload-url`
   → `200`; sau khi #40 → `400` `Không thể upload ghi âm cho phần làm bài này.`
9. Tương tự cho `POST $BASE/submission-modules/{essayModuleId}/document-upload-url`:
   `200` trước #40, `400` `Không thể upload tài liệu cho phần làm bài này.` sau #40.
10. Sau khi grading (`GRADED`), `GET #42` → `200` và `correctAnswer` hiện.

## Automated coverage

- `SubmissionServiceTest` — `submitModuleRejectsASubmissionThatIsAlreadySubmitted`,
  `getModuleDetailRejectsAModuleThatIsNotSubmittedYet`,
  `getModuleDetailRejectsASubmissionThatIsNotSubmittedYet`,
  `getAudioUploadUrl_rejectsAnAlreadySubmittedSubmission`,
  `getDocumentUploadUrl_rejectsAnAlreadySubmittedSubmission`. Các case #42 cũ dùng fixture
  `IN_PROGRESS` đã đổi sang `SUBMITTED`/`GRADED`; `getModuleDetailHidesCorrectAnswersUntilGraded`
  đổi tên thành `getModuleDetailHidesCorrectAnswersWhileSubmitted`.
- `SubmissionApiIntegrationTest` — `getSubmissionModuleDetailRejectsAnInProgressQuiz`,
  `getSubmissionModuleDetailRejectsASubmissionThatIsNotSubmittedYet`,
  `submitModuleRejectsWhenTheSubmissionIsAlreadySubmitted`,
  `getSubmissionModuleDetailIntrospectsASubmittedQuiz` (gộp cả kiểm tra field sau #43+#40).
- `SubmissionUploadUrlApiIntegrationTest` — `audioUploadUrl_isRejectedWhenTheSubmissionIsAlreadySubmitted`,
  `documentUploadUrl_isRejectedWhenTheSubmissionIsAlreadySubmitted`,
  `submitModule_isRejectedWhenTheSubmissionIsAlreadySubmitted`;
  `submittedEssayAnswerExposesDocumentMetadataInModuleDetail` giờ gọi #40 trước khi đọc #42.

## Regression risk cho FE

- FE đọc #42 để dựng form làm bài (lấy `questionId`) **trước khi submit** sẽ gặp `400`.
  Form làm bài phải lấy câu hỏi từ endpoint khác hoặc gọi #42 sau khi #40.
- FE gọi #43 hoặc #46/#47 sau khi đã bấm "Nộp bài" (`#40`) sẽ gặp `400` — cần disable nút
  upload/nút submit module ngay khi `submission.status != IN_PROGRESS`.
