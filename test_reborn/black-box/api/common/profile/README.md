# profiles

Kiểm thử nhóm **profiles**; giữ nguyên workflow của `test/api/collections/profiles/collection.postman_collection.json`.

Đây là bản Staging để import/chạy. Bản nguồn cũ là tham khảo và bằng chứng; không chạy đồng thời nhiều biến thể trên cùng dữ liệu.

Coverage tĩnh: 41 request, 41 test script, 165 vị trí `pm.test`, 72 vị trí `pm.expect`. Không phải số assertion thực thi hoặc kết quả PASS.

## Trước khi chạy

- Import `collection.json` và `environment.staging.json` vào Postman, chọn đúng environment.
- Điền tài khoản, token và ID từ dữ liệu QA Staging đã xác minh. Không dùng tài khoản/ID Local; không đoán ID còn trống.
- Có thể lưu thông tin riêng vào `environment.staging.private.json` (runner ưu tiên file này; Git bỏ qua). Không commit credentials vào file mẫu.
- Các literal dùng cho negative/boundary test và công thức tạo password fixture được giữ nguyên; chúng không phải tài khoản mặc định.
- Chạy đúng thứ tự toàn collection; token/ID do request trước sinh ra phải được giữ động. Không tự điền cố định biến workflow.

## Biến môi trường

| Biến | Giá trị mẫu / cách cấp |
|---|---|
| `DEFAULT_PASSWORD` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `accessTokenTtlSeconds` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `adminEmail` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `adminPassword` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `aiPollCount` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `apiBaseUrl` | `https://api-staging.hotung9108.me/api/v1` |
| `authToken` | Động theo script; để trống ban đầu, kiểm tra producer trước khi chạy |
| `baseUrl` | `https://api-staging.hotung9108.me` |
| `base_url` | `https://api-staging.hotung9108.me` |
| `bearer_token_18qx` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `classId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `expiredAccessRefreshToken` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `expiredAccessToken` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `expiredRefreshToken` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `gradingFixtureWaitSeconds` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `lockedStudentToken` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `noEvaluationStudentId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `nonMemberId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `otherClassId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `otherTeacherEmail` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `otherTeacherId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `profile0Email` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `profile0Id` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `profile1Email` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `profile1Id` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `profile2Email` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `profile3Email` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `profile4Email` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `profile5Email` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `profile6Email` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `profile7Email` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `profile8Email` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `profile9Email` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `stagingOrigin` | `https://api-staging.hotung9108.me` |
| `studentBId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `studentEmail` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `studentId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `teacherEmail` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `teacherId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |

Static lookup không chứng minh đầy đủ producer/consumer khi script tạo tên biến động. Các fixture/case definitions trong collection là nguồn dữ liệu kiểm thử gốc.

## Endpoint và thay đổi dữ liệu

Danh sách đầy đủ theo đúng thứ tự nằm trong [endpoints.json](endpoints.json). `mayMutate=true` đánh dấu POST/PUT/PATCH/DELETE; GET và script cũng có thể có side effect. Các script có thể publish, đổi trạng thái, tạo tài khoản, xóa fixture hoặc gửi thông báo theo workflow gốc.

| Method | URL | Số request |
|---|---|---:|
| POST | `{{baseUrl}}/api/v1/auth/login` | 2 |
| GET | `{{base_url}}/api/v1/users/me` | 7 |
| PUT | `{{base_url}}/api/v1/users/me` | 16 |
| PATCH | `{{base_url}}/api/v1/users/me/password` | 14 |
| POST | `{{base_url}}/api/v1/auth/login` | 2 |
| POST | `{{base_url}}/api/v1/users/me/avatar` | 2 |

## Test case và dữ liệu nguồn

- `test/api/test-cases/profiles/EAM-2026-09-23 USER PROFILE API.pdf`

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

Giữ ba gap avatar theo report và handoff BE14; chưa có contract upload multipart. Không hạ expected validation theo service chỉ để pass. Report không có assertion fail chưa chứng minh các gap đã được kiểm thử.

[Biên bản và bằng chứng](../../../../production_artifacts/test_reports/workspace-migration/api-staging-semantic-review-20261101/README.md).

### Phạm vi PM chốt — 02/11/2026

Không có chức năng upload file avatar. Đã loại EAM-1047 và EAM-1048 cùng thư mục chờ upload khỏi collection đang chạy và endpoints.json; Profiles còn41 request item. Các case cập nhật/xóa avatarUrl và EAM-1046 kiểm tra URL sai vẫn giữ nguyên. Bản nguồn và report cũ được giữ làm lịch sử; chúng không phản ánh phạm vi active mới.
