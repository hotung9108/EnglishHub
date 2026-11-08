# submissions

Kiểm thử nhóm **submissions**; giữ nguyên workflow của `test/api/collections/submissions/collection.postman_collection.json`.

Đây là bản Staging để import/chạy. Bản nguồn cũ là tham khảo và bằng chứng; không chạy đồng thời nhiều biến thể trên cùng dữ liệu.

Coverage tĩnh: 92 request, 92 test script, 297 vị trí `pm.test`, 151 vị trí `pm.expect`. Không phải số assertion thực thi hoặc kết quả PASS.

## Trước khi chạy

- Import `collection.json` và `environment.staging.json` vào Postman, chọn đúng environment.
- Điền tài khoản, token và ID từ dữ liệu QA Staging đã xác minh. Không dùng tài khoản/ID Local; không đoán ID còn trống.
- Có thể lưu thông tin riêng vào `environment.staging.private.json` (runner ưu tiên file này; Git bỏ qua). Không commit credentials vào file mẫu.
- Các literal dùng cho negative/boundary test và công thức tạo password fixture được giữ nguyên; chúng không phải tài khoản mặc định.
- Chạy đúng thứ tự toàn collection; token/ID do request trước sinh ra phải được giữ động. Không tự điền cố định biến workflow.

## Biến môi trường

| Biến | Giá trị mẫu / cách cấp |
|---|---|
| `adminEmail` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `adminPassword` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `adminToken` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `aiPollCount` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `apiBaseUrl` | `https://api-staging.hotung9108.me/api/v1` |
| `authToken` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `baseUrl` | `https://api-staging.hotung9108.me` |
| `be18` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `be18Assignments` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `checkerToken` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `classId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `expiredAccessToken` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `expiredToken` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `expiredTokenCandidate` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `invalidToken` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `lockedStudentToken` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `noEvaluationStudentId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `nonMemberId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `otherClassId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `otherTeacherEmail` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `otherTeacherId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `stagingOrigin` | `https://api-staging.hotung9108.me` |
| `studentBEmail` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `studentBId` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `studentBPassword` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `studentBToken` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `studentEmail` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `studentId` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `studentPassword` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `studentToken` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `teacherEmail` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `teacherId` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `teacherPassword` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `teacherToken` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |

Static lookup không chứng minh đầy đủ producer/consumer khi script tạo tên biến động. Các fixture/case definitions trong collection là nguồn dữ liệu kiểm thử gốc.

## Endpoint và thay đổi dữ liệu

Danh sách đầy đủ theo đúng thứ tự nằm trong [endpoints.json](endpoints.json). `mayMutate=true` đánh dấu POST/PUT/PATCH/DELETE; GET và script cũng có thể có side effect. Các script có thể publish, đổi trạng thái, tạo tài khoản, xóa fixture hoặc gửi thông báo theo workflow gốc.

| Method | URL | Số request |
|---|---|---:|
| POST | `{{baseUrl}}/api/v1/auth/login` | 2 |
| POST | `{{apiBaseUrl}}/auth/login` | 4 |
| GET | `{{apiBaseUrl}}/submissions?page=1&limit=1` | 2 |
| POST | `{{apiBaseUrl}}/assignments/{{publishedOpenAssignmentId}}/submissions` | 7 |
| POST | `{{apiBaseUrl}}/assignments/{{secondAttemptAssignmentId}}/submissions` | 1 |
| POST | `{{apiBaseUrl}}/assignments/{{unlimitedAssignmentId}}/submissions` | 1 |
| POST | `{{apiBaseUrl}}/assignments/{{notMemberAssignmentId}}/submissions` | 1 |
| POST | `{{apiBaseUrl}}/assignments/{{unknownAssignmentId}}/submissions` | 1 |
| POST | `{{apiBaseUrl}}/assignments/{{deletedAssignmentId}}/submissions` | 1 |
| POST | `{{apiBaseUrl}}/assignments/{{draftAssignmentId}}/submissions` | 1 |
| POST | `{{apiBaseUrl}}/assignments/{{notOpenAssignmentId}}/submissions` | 1 |
| POST | `{{apiBaseUrl}}/assignments/{{closedAssignmentId}}/submissions` | 1 |
| POST | `{{apiBaseUrl}}/assignments/{{limitReachedAssignmentId}}/submissions` | 1 |
| POST | `{{apiBaseUrl}}/assignments/abc/submissions` | 1 |
| POST | `{{apiBaseUrl}}/assignments/-1/submissions` | 1 |
| POST | `{{apiBaseUrl}}/assignments/{{limitedConcurrencyAssignmentId}}/submissions` | 1 |
| POST | `{{apiBaseUrl}}/assignments//submissions` | 1 |
| POST | `{{apiBaseUrl}}/assignments/{{maxOneOpenAssignmentId}}/submissions` | 1 |
| POST | `{{apiBaseUrl}}/assignments/{{maxThreeOpenAssignmentId}}/submissions` | 1 |
| POST | `{{apiBaseUrl}}/assignments/{{maxThreeAtLimitAssignmentId}}/submissions` | 1 |
| POST | `{{apiBaseUrl}}/assignments/{{exactOpenBoundaryAssignmentId}}/submissions` | 1 |
| POST | `{{apiBaseUrl}}/assignments/{{exactCloseBoundaryAssignmentId}}/submissions` | 1 |
| POST | `{{apiBaseUrl}}/assignments/{{emptyModulesAssignmentId}}/submissions` | 1 |
| POST | `{{apiBaseUrl}}/assignments/{{lockedAssignmentId}}/submissions` | 1 |
| POST | `{{apiBaseUrl}}/assignments/{{inProgressMaxOneAssignmentId}}/submissions` | 1 |
| POST | `{{apiBaseUrl}}/assignments/{{precedenceAssignmentId}}/submissions` | 1 |
| POST | `{{apiBaseUrl}}/assignments/{{removedMemberAssignmentId}}/submissions` | 1 |
| POST | `{{apiBaseUrl}}/assignments/{{perStudentAssignmentId}}/submissions` | 1 |
| POST | `{{apiBaseUrl}}/assignments/{{unlimitedConcurrencyAssignmentId}}/submissions` | 1 |
| POST | `{{apiBaseUrl}}/assignments/0/submissions` | 1 |
| POST | `{{apiBaseUrl}}/assignments/9223372036854775808/submissions` | 1 |
| POST | `{{apiBaseUrl}}/assignments/1.5/submissions` | 1 |
| POST | `{{apiBaseUrl}}/assignments/{{validationAssignmentId}}/submissions` | 2 |
| GET | `{{apiBaseUrl}}/assignments/{{validationAssignmentId}}/submissions` | 1 |
| GET | `{{apiBaseUrl}}/submissions?studentId={{studentId}}&page=1&limit=20` | 1 |
| GET | `{{apiBaseUrl}}/submissions?assignmentId={{teacherAssignmentId}}&page=1&limit=20` | 1 |
| GET | `{{apiBaseUrl}}/submissions?page=1&limit=20` | 1 |
| GET | `{{apiBaseUrl}}/submissions?studentId={{studentBId}}&page=1&limit=20` | 1 |
| GET | `{{apiBaseUrl}}/submissions?page=0&limit=20` | 1 |
| GET | `{{apiBaseUrl}}/submissions?page=1&limit=101` | 1 |
| GET | `{{apiBaseUrl}}/submissions/{{submittedSubmissionId}}` | 3 |
| GET | `{{apiBaseUrl}}/submissions/{{foreignSubmissionId}}` | 1 |
| GET | `{{apiBaseUrl}}/submissions/{{unknownSubmissionId}}` | 1 |
| GET | `{{apiBaseUrl}}/submissions/{{inProgressSubmissionId}}` | 1 |
| GET | `{{apiBaseUrl}}/submissions/{{teacherVisibleSubmissionId}}` | 1 |
| GET | `{{apiBaseUrl}}/submissions/abc` | 1 |
| GET | `{{apiBaseUrl}}/submissions/-1` | 1 |
| GET | `{{apiBaseUrl}}/submission-modules/{{submittedModuleId}}` | 2 |
| GET | `{{apiBaseUrl}}/submission-modules/{{inProgressModuleId}}` | 1 |
| GET | `{{apiBaseUrl}}/submission-modules/{{foreignModuleId}}` | 1 |
| GET | `{{apiBaseUrl}}/submission-modules/{{unknownModuleId}}` | 1 |
| GET | `{{apiBaseUrl}}/submission-modules/{{gradedModuleId}}` | 1 |
| POST | `{{apiBaseUrl}}/submission-modules/{{writingModuleId}}/document-upload-url` | 4 |
| POST | `{{apiBaseUrl}}/submission-modules/{{quizModuleId}}/document-upload-url` | 1 |
| POST | `{{apiBaseUrl}}/submission-modules/{{speakingModuleId}}/audio-upload-url` | 4 |
| POST | `{{apiBaseUrl}}/submission-modules/{{quizModuleId}}/audio-upload-url` | 1 |
| POST | `{{apiBaseUrl}}/submission-modules/{{quizModuleId}}/submit` | 1 |
| POST | `{{apiBaseUrl}}/submission-modules/{{shortAnswerModuleId}}/submit` | 1 |
| POST | `{{apiBaseUrl}}/submission-modules/{{alreadySubmittedModuleId}}/submit` | 1 |
| POST | `{{apiBaseUrl}}/submission-modules/{{emptyAnswersModuleId}}/submit` | 1 |
| POST | `{{apiBaseUrl}}/submission-modules/{{foreignQuestionModuleId}}/submit` | 1 |
| POST | `{{apiBaseUrl}}/submission-modules/{{authzQuizModuleId}}/submit` | 1 |
| POST | `{{apiBaseUrl}}/submission-modules/{{invalidShapeModuleId}}/submit` | 1 |
| POST | `{{apiBaseUrl}}/submission-modules/{{authnQuizModuleId}}/submit` | 1 |
| POST | `{{apiBaseUrl}}/submissions/{{finalSubmitSubmissionId}}/submit` | 1 |
| POST | `{{apiBaseUrl}}/submissions/{{alreadySubmittedId}}/submit` | 1 |
| POST | `{{apiBaseUrl}}/submissions/{{unknownSubmissionId}}/submit` | 1 |
| POST | `{{apiBaseUrl}}/submissions/{{foreignSubmissionId}}/submit` | 1 |
| POST | `{{apiBaseUrl}}/submissions/{{teacherSubmitSubmissionId}}/submit` | 1 |
| POST | `{{apiBaseUrl}}/submissions/{{anonSubmitSubmissionId}}/submit` | 1 |
| POST | `{{apiBaseUrl}}/submissions/{{persistenceSubmissionId}}/submit` | 1 |

## Test case và dữ liệu nguồn

- `test/api/test-cases/submissions/SUITE 13 Submissions.pdf`
- `test/api/test-cases/submissions/test-cases.csv`

## Chạy bằng Newman

Cần Python 3.8+, Node.js, Newman và `newman-reporter-htmlextra`. Từ `test/api`, dùng `npm ci` khi cần cài dependency từ lockfile đã có, hoặc `npm install -g newman newman-reporter-htmlextra`.

```powershell
python run.py
# Tùy chọn: python run.py --iterations 1 --delay 100 --timeout-request 30000
```


## Chưa xác minh

- NEEDS_VERIFICATION: contract, role permissions, fixture ownership and current Staging data.
- REQUIRES_RUNTIME_VERIFICATION: no API/Newman/runner has been executed.
- Existing scripts send additional login/fixture/cleanup requests; visible request count excludes these.
- QA-isolated data required. Preserve collection variables during a run; read fixture/cleanup scripts before rerun.
- NEEDS_VERIFICATION: script dependencies and sandbox compatibility require Postman/Newman runtime review.

## Kiểm tra trước và đọc lỗi (cập nhật)

`python run.py --check` kiểm tra offline, không chạy collection. Runner tự kiểm tra trước cả khi không thêm --check; thiếu adminEmail/adminPassword, JSON lỗi hoặc dependency không nạp được sẽ dừng và tạo report chẩn đoán.

Có thể cấp hai biến Admin chung tại `test/api/staging/environment.staging.private.json` (Git bỏ qua). Mẫu: `test/api/staging/environment.staging.private.example.json`. File private riêng của suite có độ ưu tiên cao hơn. Không sao chép tài khoản Local hoặc điền secret vào file mẫu.

Report JSON/HTML trong reports/ giữ errors, toolDiagnostics, failures đã che secret, stats và newmanExitCode. Các trạng thái: ready (chỉ offline), configuration_error, runner_error, test_failed, passed, interrupted. Không lưu raw console/body/header/environment. Chi tiết và runner dùng chung tại [README Staging](../README.md).

run.py của suite là điểm vào độc lập, dùng module `test/api/staging_runner.py`; khi mang suite sang máy khác cần kèm module này và `test/api/newman-staging.cjs`, cùng dependency Newman/htmlextra. Xem thay đổi collection, fixture và cleanup trong biên bản rà soát mới nhất.

### Rà soát theo yêu cầu nghiệp vụ — 01/11/2026

Case GRADED/correctAnswer đã có fixture tự chấm thật (cập nhật02/11 bên dưới), không gán trạng thái DB. Full report cũ giữ các lớp 227–230; runtime reporter phải liệt kê resource chưa dọn. Không coi scope gap là case đã pass.

### Fixture SUBMITTED/GRADED và JWT hết hạn — 02/11/2026

-2797: runner đọc bearer thật đã hết hạn từ file private fixture Auth, đã có baseline hợp lệ; không sửa JWT hoặc refresh token. Trước request âm có baseline Student hợp lệ bắt đầu attempt; sau401 kiểm tra không thêm attempt.
-2851: dùng luồng nộp toàn bài theo contract force-flip module chưa nộp sang SUBMITTED; tránh gọi submit-module kích hoạt auto-grading. Vẫn yêu cầu SUBMITTED, gradingPENDING, đủ hai câu hỏi đúng ID và correctAnswer=null.
-2855: tạo Quiz sở hữu riêng, nộp đáp án đúng rồi nộp toàn bài; chờ tối đa30giây cho GRADED/COMPLETED. Kiểm tra ID, điểm10/10, đủ hai câu hỏi và đáp án đúng theo schemaAPI. Không còn skip vô điều kiện.

Retest Staging2797/2851 đạt.2855 đã thực thi và phát hiện contract mismatch: MULTIPLE_CHOICE dùng is_correct thay isCorrect; SHORT_ANSWER dùng correct_answer thay correctAnswer. Giữ assertion, không đổi expected để làm xanh. Bằng chứng: `production_artifacts/test_reports/review-20261101/SUBMISSIONS-FIXTURES-REPAIR-20261102.md`.

Quyết định mới ngày 02/11/2026: người dùng chốt 2855 theo đặc tả và yêu cầu tạo issue. Theo dõi tại [#263](https://github.com/hotung9108/EnglishHub/issues/263); không còn chờ PM chốt tên trường. Assertion giữ `isCorrect`/`correctAnswer`, chờ backend sửa và retest.

Token dùng cho rejection-only được đọc từ `../auth/fixtures/expiry-state.private.json`; refresh fixture đã consumed vẫn không ngăn tái sử dụng accessJWT hết hạn. Nếu chưa có baseline-verified expired bearer, dùng `python test/api/staging/auth/prepare_expiry.py` và chờ đến thời gian access ready được in ra. Không chia sẻ file private hoặc token vào report.

Full suite vẫn có thể giữ lớp do lịch sử assignment/submission chặn DELETE409; bản sửa fixture không thay đổi rule cleanup này.

[Biên bản và bằng chứng](../../../../production_artifacts/test_reports/workspace-migration/api-staging-semantic-review-20261101/README.md).
