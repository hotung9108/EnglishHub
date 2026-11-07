# auth

Kiểm thử nhóm **auth**; giữ nguyên workflow của `test/api/collections/auth/collection.postman_collection.json`.

Đây là bản Staging để import/chạy. Bản nguồn cũ là tham khảo và bằng chứng; không chạy đồng thời nhiều biến thể trên cùng dữ liệu.

Coverage tĩnh: 35 request, 29 test script, 204 vị trí `pm.test`, 1516 vị trí `pm.expect`. Không phải số assertion thực thi hoặc kết quả PASS.

## Trước khi chạy

- Import `collection.json` và `environment.staging.json` vào Postman, chọn đúng environment.
- Điền tài khoản, token và ID từ dữ liệu QA Staging đã xác minh. Không dùng tài khoản/ID Local; không đoán ID còn trống.
- Có thể lưu thông tin riêng vào `environment.staging.private.json` (runner ưu tiên file này; Git bỏ qua). Không commit credentials vào file mẫu.
- Các literal dùng cho negative/boundary test và công thức tạo password fixture được giữ nguyên; chúng không phải tài khoản mặc định.
- Chạy đúng thứ tự toàn collection; token/ID do request trước sinh ra phải được giữ động. Không tự điền cố định biến workflow.

## Biến môi trường

| Biến | Giá trị mẫu / cách cấp |
|---|---|
| `accessTokenTtlSeconds` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `adminEmail` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `adminPassword` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `aiPollCount` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `apiBaseUrl` | `https://api-staging.hotung9108.me/api/v1` |
| `baseUrl` | `https://api-staging.hotung9108.me` |
| `base_url` | `https://api-staging.hotung9108.me` |
| `classId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `expiredAccessRefreshToken` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `expiredAccessToken` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `expiredRefreshToken` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `gradingFixtureWaitSeconds` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `noEvaluationStudentId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `nonMemberId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `otherClassId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `otherTeacherEmail` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
| `otherTeacherId` | Cần giá trị Staging hoặc kiểm tra producer/dynamic lookup trong script |
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
| POST | `{{baseUrl}}/api/v1/auth/login` | 35 |

## Test case và dữ liệu nguồn

- `test/api/test-cases/auth/EAM-[Staging] Kiểm thử Manual API Auth - Lần 1_.pdf`

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

Expected logout theo quyết định nghiệp vụ #21: không cần xác thực access token, chỉ thu hồi refresh token. Qase 297 đã retest logout 200 và refresh sau đó 401. Qase 299 vẫn cần token thật đã hết hạn. Qase 300 needs-spec-confirm về idempotence; không ép 200 theo code. Các case DB/manual/TTL chưa đủ điều kiện vẫn ghi rõ gap.

[Biên bản và bằng chứng](../../../../production_artifacts/test_reports/workspace-migration/api-staging-semantic-review-20261101/README.md).

### Tự động hóa bổ sung — 02/11/2026

Phần này thay thế trạng thái needs-spec-confirm của 281/287/300 bên trên theo quyết định mới của người dùng. Đã thêm DB assertions theo phiên, Swagger Authorize thật, fixture hết hạn và chế độ --require-complete. Case313 là OBSERVED, không phải PASS hoặc tự đóng. TTL mặc định900 theo handoff, private config có thể ghi đè bằng hợp đồng deployment. Xem [hướng dẫn và lệnh chạy đầy đủ](AUTOMATION.md). Toàn Auth phiên bản mới chưa được chạy trên Staging.
