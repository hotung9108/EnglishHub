# grading

Kiểm thử nhóm **grading**; giữ nguyên workflow của `test/api/collections/grading/collection.postman_collection.json`.

Đây là bản Staging để import/chạy. Bản nguồn cũ là tham khảo và bằng chứng; không chạy đồng thời nhiều biến thể trên cùng dữ liệu.

Coverage tĩnh: 125 request, 4 test script, 21 vị trí `pm.test`, 115 vị trí `pm.expect`. Không phải số assertion thực thi hoặc kết quả PASS.

## Trước khi chạy

- Import `collection.json` và `environment.staging.json` vào Postman, chọn đúng environment.
- Điền tài khoản, token và ID từ dữ liệu QA Staging đã xác minh. Không dùng tài khoản/ID Local; không đoán ID còn trống.
- Có thể lưu thông tin riêng vào `environment.staging.private.json` (runner ưu tiên file này; Git bỏ qua). Không commit credentials vào file mẫu.
- Các literal dùng cho negative/boundary test và công thức tạo password fixture được giữ nguyên; chúng không phải tài khoản mặc định.
- Chạy đúng thứ tự toàn collection; token/ID do request trước sinh ra phải được giữ động. Không tự điền cố định biến workflow.

## Biến môi trường

| Biến | Giá trị mẫu / cách cấp |
|---|---|
| `_above_max_score` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `_baseline_score` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `_before` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `_changed_score` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `_control_score` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `_decimal_score` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `_equal_score_repr` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `_fixture` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `_max_score` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `_representative_score` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `adminEmail` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `adminPassword` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `aiPollCount` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `annotation` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `answer` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `apiBaseUrl` | `https://api-staging.hotung9108.me/api/v1` |
| `baseUrl` | `https://api-staging.hotung9108.me` |
| `class1` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `classId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `disposablePendingGradingId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `expiredAccessToken` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `expiredTeacherToken` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `fixture_` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `g` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `gradingFixtureWaitSeconds` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `legacyNullSnapshotRejectGradingId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `legacyNullSnapshotSuccessGradingId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `missing` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `missingGradingId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `noEvaluationStudentId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `nonMemberId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `otherClassId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `otherTeacherEmail` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `otherTeacherId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `otherTeacherPassword` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `ownedGradingId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `runExtendedCases` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `seedClassId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `seedPassword` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `sm` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `stagingOrigin` | `https://api-staging.hotung9108.me` |
| `studentBId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `studentEmail` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `studentId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `studentPassword` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `teacherEmail` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `teacherId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `teacherPassword` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |

Static lookup không chứng minh đầy đủ producer/consumer khi script tạo tên biến động. Các fixture/case definitions trong collection là nguồn dữ liệu kiểm thử gốc.

## Endpoint và thay đổi dữ liệu

Danh sách đầy đủ theo đúng thứ tự nằm trong [endpoints.json](endpoints.json). `mayMutate=true` đánh dấu POST/PUT/PATCH/DELETE; GET và script cũng có thể có side effect. Các script có thể publish, đổi trạng thái, tạo tài khoản, xóa fixture hoặc gửi thông báo theo workflow gốc.

| Method | URL | Số request |
|---|---|---:|
| POST | `{{baseUrl}}/api/v1/auth/login` | 2 |
| GET | `{{apiBaseUrl}}/classes/{{seedClassId}}` | 2 |
| GET | `{{apiBaseUrl}}/submission-modules/{{sm}}/grading` | 8 |
| POST | `{{apiBaseUrl}}/submission-modules/{{sm}}/grading/ai-analyze` | 11 |
| PUT | `{{apiBaseUrl}}/gradings/{{g}}` | 22 |
| GET | `{{apiBaseUrl}}/answers/{{answer}}/annotations` | 6 |
| POST | `{{apiBaseUrl}}/answers/{{answer}}/annotations` | 19 |
| PATCH | `{{apiBaseUrl}}/annotations/{{annotation}}/review` | 19 |
| DELETE | `{{apiBaseUrl}}/annotations/{{annotation}}` | 7 |
| GET | `{{apiBaseUrl}}/gradings/{{g}}/change-logs` | 7 |
| GET | `{{apiBaseUrl}}/submission-modules/{{missing}}/grading` | 1 |
| GET | `{{apiBaseUrl}}/submission-modules/abc/grading` | 1 |
| POST | `{{apiBaseUrl}}/submission-modules/{{missing}}/grading/ai-analyze` | 1 |
| POST | `{{apiBaseUrl}}/submission-modules/abc/grading/ai-analyze` | 1 |
| PUT | `{{apiBaseUrl}}/gradings/{{missing}}` | 1 |
| PUT | `{{apiBaseUrl}}/gradings/abc` | 1 |
| GET | `{{apiBaseUrl}}/answers/{{missing}}/annotations` | 1 |
| GET | `{{apiBaseUrl}}/answers/abc/annotations` | 1 |
| POST | `{{apiBaseUrl}}/answers/{{missing}}/annotations` | 1 |
| POST | `{{apiBaseUrl}}/answers/abc/annotations` | 1 |
| DELETE | `{{apiBaseUrl}}/annotations/{{missing}}` | 1 |
| DELETE | `{{apiBaseUrl}}/annotations/abc` | 1 |
| GET | `{{apiBaseUrl}}/gradings/{{missing}}/change-logs` | 1 |
| GET | `{{apiBaseUrl}}/gradings/abc/change-logs` | 1 |
| GET | `{{apiBaseUrl}}/gradings/{{g}}` | 2 |
| GET | `{{apiBaseUrl}}/gradings?page=1&limit=20` | 1 |
| GET | `{{apiBaseUrl}}/gradings?classId={{class1}}` | 1 |
| GET | `{{apiBaseUrl}}/answers/{{answer}}/annotations?page=2&limit=1` | 1 |
| GET | `{{apiBaseUrl}}/gradings/{{g}}/change-logs?page=2&limit=1` | 1 |
| PATCH | `{{apiBaseUrl}}/annotations/{{missing}}/review` | 1 |
| PATCH | `{{apiBaseUrl}}/annotations/abc/review` | 1 |

## Test case và dữ liệu nguồn

- `test/api/test-cases/grading/SUITE 15.pdf`
- `test/api/test-cases/grading/Testcase_PUT_Grading_EnglishHub.xlsx`
- `test/api/test-cases/grading/create_testcase_workbook.mjs`
- `test/api/test-cases/grading/test-cases--a93849ed39.csv`
- `test/api/test-cases/grading/test-cases--ed7815d3d6.csv`
- `test/api/test-cases/grading/test-cases.csv`
- `test/api/test-cases/grading/test-cases.json`

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

Giữ REQ theo nghiệp vụ đã chốt và OBS riêng. Report09:29 ngày02/11 có39case chưa chạy vì bị đánh dấu external. Bản sửa bên dưới đã thay cờ chặn chung bằng fixture API thật; không giả kết quả AI/audio/approval. Runtime reporter giữ _suite15Summary và caseId, không bỏ mất NOT_RUN/FIXTURE_FAILED/VERIFY_FAILED.

### Bản sửa fixture Grading — 02/11/2026

-Tám case JWT hết hạn dùng lại bearer Auth đã có baseline hợp lệ, thực sự hết hạn; không sửa exp/signature. Các endpoint auth/role/ID dùng target QA hợp lệ để kiểm tra401/403/404 mà không cần gọi AI.
-REQ005/006 dựng moduleREADING/LISTENING qua luồng whole-submit và kiểm tra grading cònPENDING qua các lần đọc trước request. Nếu đã auto-grade sangCOMPLETED thì báo `PENDING_FIXTURE_UNAVAILABLE`, không coi đó là bug của request chưa gửi. Chỉ có response400 không đủ chứng minh nhánh kiểm tra skill nếu tiền điều kiện đã sai.
-Writing/Speaking upload PDF/WAV QA thật, submit qua API, kiểm tra202 của yêu cầu phân tích riêng với việc xử lý AI sau đó.202 không có nghĩa AI đã chấm thành công.
-Các case review/visibility chờ gradingAI_GRADED thật, kiểm tra annotationAI đúng answer và trạng thái. Kết quả AI được tái sử dụng trong đúng run nếu còn chưa duyệt. Không có annotation phù hợp hoặc jobFAILED thì báo lỗi fixture có moduleId/gradingId, không tínhPASS hoặc tạo annotationAI bằng DB.
-Có thể cung cấp `fixture_BE19-...` QA đã có từ môi trường, nhưng vẫn phải chứng minh qaOwned/ID/lớp/skill/trạng thái/sourceAI đúng như kiểm tra sẵn có.
-Actor token được tái sử dụng khi còn hạn, xác minh lại `/users/me`; refresh session riêng được logout khi thay và cuối lượt. Cleanup quét cả annotationAI phát sinh sau202 trên đúng answer sở hữu trước khi xóa mềm assignment.
-Report thêm `storageRetention` để ghi file submission còn lưu theo lịch sử. Ledger API rỗng không có nghĩa object storage đã xóa. File và hướng dẫn nằm trong `test/api/fixtures/grading/`.

CácOBS vẫn chỉ là quan sát, chưa nâng thànhPASS nghiệp vụ. REQ099/104/105 không được tínhđạt khi chưa có kết quảAI chưa duyệt. Fullsuite vẫn có thể cleanup409 do lịch sửassignment ngăn xóalớp.

Đã có retest riêng nhóm39case bị ảnh hưởng; chưa chạy lại toàn125item. Xem `production_artifacts/test_reports/review-20261101/GRADING-FIXTURES-REPAIR-20261102.md` để đọc kết quả và giới hạn môi trườngAI.

[Biên bản và bằng chứng](../../../../production_artifacts/test_reports/workspace-migration/api-staging-semantic-review-20261101/README.md).
