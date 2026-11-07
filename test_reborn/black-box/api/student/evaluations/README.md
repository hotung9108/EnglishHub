# evaluations

Kiểm thử nhóm **evaluations**; giữ nguyên workflow của `test/api/collections/evaluations/collection.postman_collection.json`.

Đây là bản Staging để import/chạy. Bản nguồn cũ là tham khảo và bằng chứng; không chạy đồng thời nhiều biến thể trên cùng dữ liệu.

Coverage tĩnh: 130 request, 127 test script, 397 vị trí `pm.test`, 739 vị trí `pm.expect`. Không phải số assertion thực thi hoặc kết quả PASS.

## Trước khi chạy

- Import `collection.json` và `environment.staging.json` vào Postman, chọn đúng environment.
- Điền tài khoản, token và ID từ dữ liệu QA Staging đã xác minh. Không dùng tài khoản/ID Local; không đoán ID còn trống.
- Có thể lưu thông tin riêng vào `environment.staging.private.json` (runner ưu tiên file này; Git bỏ qua). Không commit credentials vào file mẫu.
- Các literal dùng cho negative/boundary test và công thức tạo password fixture được giữ nguyên; chúng không phải tài khoản mặc định.
- Chạy đúng thứ tự toàn collection; token/ID do request trước sinh ra phải được giữ động. Không tự điền cố định biến workflow.

## Biến môi trường

| Biến | Giá trị mẫu / cách cấp |
|---|---|
| `_cleanupId` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `_createdIds` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `_qa19Eval61Content` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `adminEmail` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `adminId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `adminPassword` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `adminToken` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `adminTokenRefresh` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `aiPollCount` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `authorEvaluationId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `authzDeleteEvaluationId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `authzUpdateEvaluationId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `baseUrl` | `https://api-staging.hotung9108.me` |
| `classId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `classIdA` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `createdEvaluationId` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `deleteEvaluationId` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `evaluationCountOfStudent` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `evaluationId` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `expiredAccessToken` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `expiredToken` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `extraFieldEvaluationId` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `malformedToken` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `noEvaluationStudentId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `nonMemberId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `originalClassId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `originalContent` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `otherClassId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `otherTeacherEmail` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `otherTeacherId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `otherTeacherPassword` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `otherTeacherToken` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `otherTeacherTokenRefresh` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `overLimitContent` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `ownEvaluationId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `qa19Results` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `stagingOrigin` | `https://api-staging.hotung9108.me` |
| `studentBId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `studentEmail` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `studentId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `studentPassword` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `studentToken` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `studentTokenRefresh` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `teacherEmail` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `teacherId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `teacherPassword` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `teacherToken` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `teacherTokenRefresh` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |

Static lookup không chứng minh đầy đủ producer/consumer khi script tạo tên biến động. Các fixture/case definitions trong collection là nguồn dữ liệu kiểm thử gốc.

## Endpoint và thay đổi dữ liệu

Danh sách đầy đủ theo đúng thứ tự nằm trong [endpoints.json](endpoints.json). `mayMutate=true` đánh dấu POST/PUT/PATCH/DELETE; GET và script cũng có thể có side effect. Các script có thể publish, đổi trạng thái, tạo tài khoản, xóa fixture hoặc gửi thông báo theo workflow gốc.

| Method | URL | Số request |
|---|---|---:|
| POST | `{{baseUrl}}/api/v1/auth/login` | 6 |
| GET | `{{baseUrl}}/api/v1/students/{{studentId}}/evaluations?limit=100` | 6 |
| POST | `{{baseUrl}}/api/v1/students/{{studentId}}/evaluations` | 24 |
| GET | `{{baseUrl}}/api/v1/students/{{studentId}}/evaluations` | 8 |
| GET | `{{baseUrl}}/api/v1/students/{{studentId}}/evaluations?classId={{classIdA}}` | 1 |
| GET | `{{baseUrl}}/api/v1/students/{{studentId}}/evaluations?page=1&limit=2` | 1 |
| GET | `{{baseUrl}}/api/v1/students/{{studentId}}/evaluations?page=2&limit=2` | 1 |
| GET | `{{baseUrl}}/api/v1/students/{{otherStudentId}}/evaluations` | 1 |
| GET | `{{baseUrl}}/api/v1/students/{{missingStudentId}}/evaluations` | 1 |
| GET | `{{baseUrl}}/api/v1/students/{{studentId}}/evaluations?page=0` | 1 |
| GET | `{{baseUrl}}/api/v1/students/{{studentId}}/evaluations?limit=101` | 1 |
| GET | `{{baseUrl}}/api/v1/students/{{studentId}}/evaluations?classId=-1` | 1 |
| GET | `{{baseUrl}}/api/v1/students/abc/evaluations` | 1 |
| GET | `{{baseUrl}}/api/v1/students/-1/evaluations` | 1 |
| GET | `{{baseUrl}}/api/v1/students/{{studentId}}/evaluations?classId=abc` | 1 |
| GET | `{{baseUrl}}/api/v1/students/{{studentId}}/evaluations?page=abc` | 1 |
| GET | `{{baseUrl}}/api/v1/students/{{studentId}}/evaluations?page=999&limit=20` | 1 |
| GET | `{{baseUrl}}/api/v1/students/{{noEvaluationStudentId}}/evaluations` | 1 |
| GET | `{{baseUrl}}/api/v1/students/{{studentId}}/evaluations?classId={{missingClassId}}` | 1 |
| GET | `{{baseUrl}}/api/v1/students/{{studentId}}/evaluations?limit=1` | 1 |
| POST | `{{baseUrl}}/api/v1/students/{{nonMemberStudentId}}/evaluations` | 1 |
| POST | `{{baseUrl}}/api/v1/students/{{missingStudentId}}/evaluations` | 1 |
| GET | `{{baseUrl}}/api/v1/evaluations/{{createdEvaluationId}}` | 1 |
| GET | `{{baseUrl}}/api/v1/evaluations/{{evaluationId}}` | 10 |
| GET | `{{baseUrl}}/api/v1/evaluations/{{ownEvaluationId}}` | 1 |
| GET | `{{baseUrl}}/api/v1/evaluations/{{otherEvaluationId}}` | 1 |
| GET | `{{baseUrl}}/api/v1/evaluations/{{missingEvaluationId}}` | 1 |
| GET | `{{baseUrl}}/api/v1/evaluations/abc` | 1 |
| GET | `{{baseUrl}}/api/v1/evaluations/-1` | 1 |
| PUT | `{{baseUrl}}/api/v1/evaluations/{{authorEvaluationId}}` | 8 |
| GET | `{{baseUrl}}/api/v1/evaluations/{{authorEvaluationId}}` | 9 |
| PUT | `{{baseUrl}}/api/v1/evaluations/{{authzUpdateEvaluationId}}` | 1 |
| PUT | `{{baseUrl}}/api/v1/evaluations/{{ownEvaluationId}}` | 1 |
| PUT | `{{baseUrl}}/api/v1/evaluations/{{evaluationId}}` | 3 |
| PUT | `{{baseUrl}}/api/v1/evaluations/{{missingEvaluationId}}` | 1 |
| PUT | `{{baseUrl}}/api/v1/evaluations/abc` | 1 |
| PUT | `{{baseUrl}}/api/v1/evaluations/-1` | 1 |
| DELETE | `{{baseUrl}}/api/v1/evaluations/{{deleteEvaluationId}}` | 2 |
| GET | `{{baseUrl}}/api/v1/evaluations/{{deleteEvaluationId}}` | 1 |
| DELETE | `{{baseUrl}}/api/v1/evaluations/{{authzDeleteEvaluationId}}` | 1 |
| DELETE | `{{baseUrl}}/api/v1/evaluations/{{ownEvaluationId}}` | 1 |
| DELETE | `{{baseUrl}}/api/v1/evaluations/{{evaluationId}}` | 4 |
| DELETE | `{{baseUrl}}/api/v1/evaluations/{{missingEvaluationId}}` | 1 |
| DELETE | `{{baseUrl}}/api/v1/evaluations/abc` | 1 |
| DELETE | `{{baseUrl}}/api/v1/evaluations/-1` | 1 |
| GET | `{{baseUrl}}/api/v1/students/{{studentId}}/evaluations?page=-1` | 1 |
| GET | `{{baseUrl}}/api/v1/students/{{studentId}}/evaluations?limit=0` | 1 |
| GET | `{{baseUrl}}/api/v1/students/{{studentId}}/evaluations?limit=-1` | 1 |
| GET | `{{baseUrl}}/api/v1/students/{{studentId}}/evaluations?limit=abc` | 1 |
| GET | `{{baseUrl}}/api/v1/students/{{studentId}}/evaluations?classId=0` | 1 |
| GET | `{{baseUrl}}/api/v1/students/9223372036854775808/evaluations` | 1 |
| GET | `{{baseUrl}}/api/v1/students/{{studentId}}/evaluations?page=2147483648` | 1 |
| GET | `{{baseUrl}}/api/v1/evaluations/9223372036854775808` | 1 |
| PUT | `{{baseUrl}}/api/v1/evaluations/9223372036854775808` | 1 |
| DELETE | `{{baseUrl}}/api/v1/evaluations/9223372036854775808` | 1 |
| DELETE | `{{baseUrl}}/api/v1/evaluations/{{_cleanupId}}` | 1 |
| POST | `{{baseUrl}}/api/v1/auth/logout` | 4 |

## Test case và dữ liệu nguồn

- `test/api/test-cases/evaluations/SUITE 14 API Student Evaluation..pdf`

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

Quyền đọc theo quyết định #102. Quyết định mới của người dùng ngày02/11/2026: BE20-64/Qase3158 lọc classId không tồn tại phải trả404, thông báo không tìm thấy lớp. Test kiểm tra error envelope, nội dung thông báo và không có data/pagination. Quyết định này thay thế expected200/danh sách rỗng cũ.

### Token hết hạn — cập nhật02/11/2026

Runner tự nạp bearer thật đã hết hạn từ baseline-verified fixture Auth, dùng cho BE20-76 và ADD POST/GET/PUT/DELETE expiredToken. Không sửa JWT/exp hoặc tự ký token. Nếu chưa có fixture, dùng `python test/api/staging/auth/prepare_expiry.py` và chờ access ready; file private không đưa vào report.

Mỗi case tạo một evaluation QA riêng để chứng minh Teacher còn quyền truy cập bằng token hợp lệ. Sau request401, test kiểm tra response chỉ có error, evaluation còn nguyên id/content và danh sách đầy đủ theo classId không thay đổi. Các fixture mới được đăng ký cả ledger và queue cleanup cũ; không sửa evaluation có sẵn để kiểm tra DELETE/PUT.

Retest trước quyết định mới:5case hết hạn đều đạt, không skip; cleanup verified empty. Các failure BE20-64 trong report cũ dùng expected200 đã được thay thế bằng quyết định404; không sửa report lịch sử thànhPass. Bản assertion mới cần chạy lại. Chi tiết lịch sử: `production_artifacts/test_reports/review-20261101/EVALUATIONS-EXPIRY-REPAIR-20261102.md`.

[Biên bản và bằng chứng](../../../../production_artifacts/test_reports/workspace-migration/api-staging-semantic-review-20261101/README.md).
