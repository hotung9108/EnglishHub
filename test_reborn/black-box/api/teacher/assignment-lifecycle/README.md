# assignments

Kiểm thử nhóm **assignments**; giữ nguyên workflow của `test/api/collections/assignments/collection.postman_collection.json`.

Đây là bản Staging để import/chạy. Bản nguồn cũ là tham khảo và bằng chứng; không chạy đồng thời nhiều biến thể trên cùng dữ liệu.

Coverage tĩnh: 94 request, 95 test script, 218 vị trí `pm.test`, 27 vị trí `pm.expect`. Không phải số assertion thực thi hoặc kết quả PASS.

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
| `adminToken` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `aiPollCount` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `apiBaseUrl` | `https://api-staging.hotung9108.me/api/v1` |
| `baseUrl` | `https://api-staging.hotung9108.me` |
| `classId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `expiredAccessToken` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `memberEmail` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `memberPassword` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `memberStudentId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `missingId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `noEvaluationStudentId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `nonMemberEmail` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `nonMemberId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `nonMemberPassword` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `otherClassId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `otherTeacherEmail` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `otherTeacherId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `otherTeacherPassword` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `otherTeacherToken` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `stagingOrigin` | `https://api-staging.hotung9108.me` |
| `studentBId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `studentEmail` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `studentId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `studentMemberToken` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `studentNonMemberToken` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `teacherEmail` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `teacherId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `teacherPassword` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `teacherToken` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `title201` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |

Static lookup không chứng minh đầy đủ producer/consumer khi script tạo tên biến động. Các fixture/case definitions trong collection là nguồn dữ liệu kiểm thử gốc.

## Endpoint và thay đổi dữ liệu

Danh sách đầy đủ theo đúng thứ tự nằm trong [endpoints.json](endpoints.json). `mayMutate=true` đánh dấu POST/PUT/PATCH/DELETE; GET và script cũng có thể có side effect. Các script có thể publish, đổi trạng thái, tạo tài khoản, xóa fixture hoặc gửi thông báo theo workflow gốc.

| Method | URL | Số request |
|---|---|---:|
| POST | `{{baseUrl}}/api/v1/auth/login` | 2 |
| POST | `{{apiBaseUrl}}/classes` | 2 |
| POST | `{{apiBaseUrl}}/classes/{{ownedClassId}}/members` | 1 |
| POST | `{{apiBaseUrl}}/classes/{{ownedClassId}}/assignments` | 25 |
| PATCH | `{{apiBaseUrl}}/assignments/{{publishedToCloseAssignmentId}}/status` | 2 |
| PATCH | `{{apiBaseUrl}}/assignments/{{publishedBackAssignmentId}}/status` | 2 |
| PATCH | `{{apiBaseUrl}}/assignments/{{closedBackAssignmentId}}/status` | 3 |
| GET | `{{apiBaseUrl}}/classes/{{ownedClassId}}/assignments?page=1&limit=20` | 1 |
| GET | `{{apiBaseUrl}}/classes/{{ownedClassId}}/assignments?status=DRAFT` | 1 |
| GET | `{{apiBaseUrl}}/classes/{{ownedClassId}}/assignments?status=PUBLISHED` | 1 |
| GET | `{{apiBaseUrl}}/classes/{{ownedClassId}}/assignments?status=CLOSED` | 1 |
| GET | `{{apiBaseUrl}}/classes/{{ownedClassId}}/assignments?status=ARCHIVED` | 1 |
| GET | `{{apiBaseUrl}}/classes/{{ownedClassId}}/assignments?page=0&limit=20` | 1 |
| GET | `{{apiBaseUrl}}/classes/{{ownedClassId}}/assignments?page=-1&limit=20` | 1 |
| GET | `{{apiBaseUrl}}/classes/{{ownedClassId}}/assignments?page=1&limit=0` | 1 |
| GET | `{{apiBaseUrl}}/classes/{{ownedClassId}}/assignments?page=1&limit=101` | 1 |
| GET | `{{apiBaseUrl}}/classes/{{missingId}}/assignments` | 1 |
| GET | `{{apiBaseUrl}}/classes/{{ownedClassId}}/assignments` | 6 |
| GET | `{{apiBaseUrl}}/assignments/{{ownedAssignmentId}}` | 9 |
| GET | `{{apiBaseUrl}}/assignments/{{missingId}}` | 1 |
| POST | `{{apiBaseUrl}}/classes/{{missingId}}/assignments` | 1 |
| POST | `{{apiBaseUrl}}/classes/{{unassignedClassId}}/assignments` | 1 |
| PUT | `{{apiBaseUrl}}/assignments/{{ownedAssignmentId}}` | 11 |
| PUT | `{{apiBaseUrl}}/assignments/{{missingId}}` | 1 |
| PATCH | `{{apiBaseUrl}}/assignments/{{draftToPublishAssignmentId}}/status` | 1 |
| PATCH | `{{apiBaseUrl}}/assignments/{{draftJumpAssignmentId}}/status` | 1 |
| PATCH | `{{apiBaseUrl}}/assignments/{{statusInvalidAssignmentId}}/status` | 2 |
| PATCH | `{{apiBaseUrl}}/assignments/{{ownedAssignmentId}}/status` | 5 |
| PATCH | `{{apiBaseUrl}}/assignments/{{missingId}}/status` | 1 |
| DELETE | `{{apiBaseUrl}}/assignments/{{deleteAssignmentId}}` | 1 |
| DELETE | `{{apiBaseUrl}}/assignments/{{ownedAssignmentId}}` | 5 |
| DELETE | `{{apiBaseUrl}}/assignments/{{missingId}}` | 1 |

## Test case và dữ liệu nguồn

- `test/api/test-cases/assignments/SIUTE 12_Assignments api.pdf`

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

Giữ các rule ownership, thời gian/giới hạn, chuyển trạng thái một chiều và soft delete từ handoff. Class 225 trong full report bị giữ lại vì 409; không coi ledger definition rỗng là cleanup thành công. Không đổi rule delete để ép dọn fixture pass.

### Bổ sung assertion — 02/11/2026

-1498/1499/1500 kiểm tra mảng data, pagination, trạng thái từng phần tử và fixture DRAFT/PUBLISHED/CLOSED tương ứng phải xuất hiện.
-1522 GET lại ID mới tạo, kiểm tra id/title và trạng thái DRAFT theo AssignmentDetailResponse. Contract detail chỉ công bố id/title/status/modules; không suy diễn field khác phải xuất hiện trong response này.
-1566 kiểm tra detail404, bài vắng trên các trang list, đồng thời truy vấn Neon read-only theo đúng assignmentId+classId trước/sau DELETE: row phải còn và is_deleted chuyển false sang true.
-Python runner tự dùng cấu hình Neon/JDBC đang có, giống Auth; thiếu DB evidence sẽ có assertion lỗi rõ, không coi case đã kiểm tra xong. Credential không đưa vào collection/report.
-Teardown kiểm tra status từng DELETE.409 được ghi RETAINED, các lỗi khác bị fail; bỏ assertion luôn đúng “Dọn dẹp fixture đã hoàn tất”. Control cuối vẫn giữ dữ liệu phụ thuộc và báo cleanup_error nếu chưa dọn được.

Targeted retest1498/1499/1500/1522/1566 với prerequisites và cleanup:33assertion pass,0fail/skip. Dùng lại lớp QA248/teacher1338, không tạo user/class; bài mới được xóa mềm theo contract. Đây không phải kết quả chạy lại toàn76case. Full suite có thể tiếp tục cleanup_error khi lịch sử assignment ngăn xóa lớp; không hard-delete DB để làm xanh.

[Biên bản và bằng chứng](../../../../production_artifacts/test_reports/workspace-migration/api-staging-semantic-review-20261101/README.md).
