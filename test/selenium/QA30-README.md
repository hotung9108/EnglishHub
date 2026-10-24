# QA30 — Selenium cho luồng Học viên trên staging

**Sau phản hồi 19/10: QA30 trở lại In Progress, đang review lại bàn giao.** Runner v8-independent-checks có full run đủ 45 case: **24 Pass / 18 Fail / 3 Blocked**, không thay đổi kết quả gốc. [Bản hiệu chỉnh issue theo mẫu QA29](../../production_artifacts/test_reports/QA-30/issue-correction-2026-10-19/README.md) ghi 8 issue đã viết lại và 5 hành vi đã tách thành issue riêng; source issue-links đã cập nhật. Report/source snapshot cũ giữ liên kết theo thời điểm chạy, không tự coi là bản bàn giao hiện hành. Chưa đánh dấu Done lại, chưa chạy lại staging trong lượt sửa issue. Các ghi nhận v6/v7 dưới đây là lịch sử nền và hướng dẫn preflight còn áp dụng.

Bộ **45 case**, runner **v6** dùng framework QA28 và phần cải tiến chung từ QA29 (PR #167 đã merge). Đã đối chiếu `origin/develop` (`321ce42`) và khảo sát lại **11 màn sau đăng nhập trên staging lúc 20:34 ngày 18/10**, không có lỗi điều hướng. Frontend HTTP 200, API phản hồi 401 khi chưa đăng nhập và login QA30 thành công; lỗi 530 trước đó đã hết tại thời điểm khảo sát. [Bản đồ màn/nút và giới hạn bao phủ](QA30-UI-MAP.md) ghi rõ căn cứ khảo sát. Case/expected sinh từ registry tại [QA30-TEST-CASES.md](QA30-TEST-CASES.md). Khảo sát không thay thế kết quả chạy test; chưa chạy hoặc lỗi setup không tính Pass.

**Quy trình hiện tại:** người dùng có thể tự bấm chạy; theo ủy quyền ngày 19/10, agent được chạy full suite/retest trên fixture QA riêng. Các issue đã xác nhận và cùng review được bàn giao theo DoD; review bằng chứng trước khi tạo issue mới, tránh trùng nhóm hiện có. Các lượt thử kỹ thuật cũ không phải kết quả nghiệm thu bản test hiện tại.

## Bấm mở Watch, nhập case sau

Mở `QA30-Watch-Student.cmd` ở thư mục gốc workspace (bản trong repo: `test/scripts/QA30-Watch-Student.cmd`). Menu **QA30 WATCH v8** liệt kê 45 case; nhập `7`, `007`, `QA30-007` hoặc tên đầy đủ. Enter trống để thoát. Chỉ case được chọn chạy; Chrome hiện ra và report tự mở khi kết thúc. Đóng menu cũ trước khi mở lại file.

## Kiểm tra môi trường trước khi chạy — v6

Runner kiểm tra dung lượng (tối thiểu 512 MiB trống), thử ghi 4 KiB và mở/đóng Chrome trắng **trước khi tạo dữ liệu staging**. Temp và profile tạm của Node/ChromeDriver/Chrome dùng thư mục riêng `test/selenium/.cache/qa30-runtime/run-*` trên ổ chứa dự án (workspace hiện tại là D). Chỉ đổi biến môi trường của tiến trình QA30 và các tiến trình con; không đổi Windows hoặc xóa dữ liệu trên ổ C. Mỗi case kiểm tra lại khả năng ghi/dung lượng trước khi mở browser.

V6 kiểm tra GET frontend và API không đăng nhập trước khi mở Chrome và tạo fixture. API có phản hồi 401/403 vẫn được coi là có kết nối; tài khoản/quyền được kiểm tra trong setup/login sau đó. HTTP 530/5xx hoặc lỗi transport sẽ dừng Blocked, ghi nguyên nhân và những case chưa chạy. Không tự retry request tạo/nộp dữ liệu. `node tools/check-student-staging.mjs` kiểm tra riêng kết nối, không đăng nhập/tạo fixture.

Lỗi khởi tạo/mất session, hết dung lượng hoặc quyền ghi được ghi `BLOCKED / ENVIRONMENT_REVIEW` và dừng suite. Những case phía sau là **chưa chạy**, không tạo thêm hàng chục Fail. Assertion của web vẫn ghi Fail và tiếp tục các case khác; những Fail trước khi môi trường hỏng được giữ nguyên. Profile tạm do chính lượt chạy tạo được dọn sau khi đóng browser; lỗi dọn được lưu trong JSON.

Có thể kiểm tra riêng Chrome trắng, không truy cập staging, đăng nhập hay tạo dữ liệu:

```powershell
cd test/selenium
node tools/check-student-runtime.mjs
```

Đã xác minh probe Chrome thực thành công bằng Temp trên D và **70 kiểm tra local đạt**. Chuỗi launcher cũng đã kiểm tra bằng `.\QA30-Run-Report.cmd -CheckOnly` từ workspace: không network/browser/setup/test. Đây là kiểm tra local riêng với full run staging ghi tại phần bàn giao đầu tài liệu. Xem [bản chuẩn bị 18/10](../../production_artifacts/test_reports/QA-30/PREPARATION-2026-10-18.md) để đối chiếu lịch sử.

Từ 19/10, launcher Watch dùng `--fresh-fixtures --watch --delay-ms=1500`, không dùng `--quick`: nghỉ khoảng **1,5 giây trước mỗi thao tác được đánh dấu** để dễ quan sát. Có thể tăng bằng `.\QA30-Watch-Student.cmd -DelayMs 2500` ở workspace. Full run không Watch không thêm thời gian quan sát. Runner tạo lớp mới và **chỉ dữ liệu case cần**, có log tiến độ: case 007 chỉ cần một bài Writing, không tạo cả bộ bài, bài chấm sẵn và evaluation. Case xem điểm mới chuẩn bị bài chấm; case đánh giá định kỳ mới tạo evaluation. Thời gian phụ thuộc staging; không bảo đảm một số giây cố định. Explicit wait thoát khi dữ liệu sẵn sàng. Menu đã kiểm tra bằng Windows PowerShell với mã số/ID/tên của đủ 45 case; kiểm tra menu không mở Selenium.

## Đầu vào và chạy

Windows, Node.js 22+, Chrome/Edge, `curl.exe`; cài dependency từ `test/selenium/package-lock.json`:

```powershell
cd test/selenium
npm.cmd ci --no-audit --no-fund --cache .cache/npm
Copy-Item .env.example .env # Chỉ khi chưa có .env
```

Điền `SELENIUM_ADMIN_EMAIL/PASSWORD`, `SELENIUM_TEACHER_EMAIL/PASSWORD`, `SELENIUM_STUDENT_EMAIL/PASSWORD` bằng tài khoản QA. Biến `QA28_*` cũ vẫn được hỗ trợ. Runner xác minh tài khoản Học viên đầu vào rồi tạo/tái sử dụng một tài khoản Học viên QA30 riêng để không nộp bài vào tài khoản dùng chung. Không đổi profile/password của tài khoản đầu vào.

Frontend cố định cho fixture là `https://staging.hotung9108.me`; API `https://api-staging.hotung9108.me/api/v1`. Không chạy fixture trên production. `QA30_DATA_TIMEOUT_MS` mặc định 60000, giới hạn 1000–300000; explicit wait thoát ngay khi đúng dữ liệu xuất hiện. Browser/driver/Grid dùng cấu hình `SELENIUM_*` chung. Mặc định Chrome headless.

```powershell
npm.cmd run prepare:student                          # Chuẩn bị riêng khi cần
npm.cmd run test:student                             # Đủ 45 case, tự tạo lớp/bộ bài mới
npm.cmd run test:student -- --case=QA30-011           # Retest một case
npm.cmd run test:student:watch -- --case=QA30-003     # Hiện browser, delay quan sát
npm.cmd run test:student -- --case=QA30-011 --fresh-fixtures # Case riêng với lớp/bộ bài mới
npm.cmd run check                                    # Kiểm tra local, không gọi staging
npm.cmd run docs:student                             # Sinh tài liệu case từ registry
```

Mở `test/scripts/QA30-Run-Report.cmd` để chạy cả bộ, lưu terminal log và tự mở report. Trong workspace hiện tại cũng có `QA30-Run-Report.cmd` ngay thư mục gốc. Mỗi lượt full tự tạo lớp/bộ bài/evaluation mới để không phụ thuộc trạng thái các lượt cũ; tài khoản QA30 vẫn được tái sử dụng. `test/scripts/QA30-Run-Student.cmd` hỗ trợ truyền tham số case. `--case` dùng lại fixture hiện có; nếu bài đã hoàn tất mà case cần editor chưa nộp, report ghi Blocked và hướng dẫn dùng `--fresh-fixtures`. Không thao tác tay trong browser automation hoặc chạy hai suite QA30 đồng thời. Không dọn dữ liệu hay ghi đè report cũ.

## Dữ liệu QA

- `.cache/qa30-account.json`: email/password tổng hợp của tài khoản QA30, giữ local và không chia sẻ.
- `fixtures/qa30.json`: IDs lớp, module, bài nộp/điểm/evaluation; không chứa password. Giữ cùng account cache để tái sử dụng đúng chủ sở hữu.
- Full run dùng 14 bài riêng cho các luồng nộp bài, nháp, navigation, Speaking chưa ghi và MCQ hủy nộp trắng. Chạy một case lấy đúng phần cần từ `support/student/scenario-plan.js`. Schema v3 tạo mới dữ liệu schema cũ thay vì dùng sai loại module.
- Writing dùng **WRITING + ESSAY** theo whitelist backend; `REWRITE` chỉ hợp lệ với Reading. Case 011 đối chiếu UI cho nộp text với API ESSAY chỉ lưu file: nếu mất nội dung ghi `CONTRACT_GAP_REVIEW`, cần review FE/BE; không tự coi là luồng text đã được backend hỗ trợ. Các module maxScore 10; bài chấm sẵn có điểm 7.5, feedback xác định và `maxSubmissions=1` để kiểm tra hết lượt. Bài khác giới hạn 10 lượt, so UI với API.
- Một evaluation định kỳ có nội dung QA30 xác định. API chuẩn bị dữ liệu, sau đó Selenium kiểm tra đúng nội dung hiển thị.
- Không xóa/tái sử dụng tài nguyên QA29 hoặc lớp/bài thật. Giữ dữ liệu QA30 cũ để review; mỗi lượt full có classId riêng. `--fresh-fixtures` cho case riêng cũng giữ lại bộ cũ và tạo lớp/bộ bài mới, không thực hiện cleanup.

## Phạm vi và assertions

| Luồng chính | Case |
| --- | --- |
| Login và lớp học | QA30-001–004 |
| Bài tập và tổng quan | QA30-005–008 |
| Validation/nháp, nộp Writing văn bản/PDF | QA30-009–012 |
| Nộp Reading đúng/sai, Listening, Speaking | QA30-013–016 |
| Nộp/chấm MCQ Reading đúng/sai và Listening | QA30-025–027 |
| Kết quả, điểm thô, bộ lọc, lịch sử | QA30-017–019, QA30-024 |
| Tên bài, kỹ năng và trạng thái bảng điểm | QA30-028 |
| Đánh giá định kỳ, nhận xét và tìm kiếm | QA30-020–023 |
| Lọc lớp/trạng thái bài; tìm/lọc bảng điểm | QA30-029–032 |
| Lọc nhận xét và mở đúng bài từ nhận xét | QA30-033–034 |
| Kết quả từ lịch sử, tab nhận xét, về bảng điểm | QA30-035–037 |
| File sai định dạng, Speaking chưa ghi, bộ đếm từ | QA30-038–040 |
| Quay lại danh sách, mở bài từ lớp, nút Dashboard | QA30-041–043 |
| Hủy nộp MCQ trắng và chặn khi hết lượt | QA30-044–045 |

Nộp bài chỉ Pass khi trạng thái submission/module đã lưu là SUBMITTED/GRADED, đáp án đúng nội dung đã nhập; file PDF/audio phải có storage key và upload status READY. Không gọi API submit để làm xanh case UI bị lỗi. Reading đúng/sai đối chiếu điểm 10/0; Speaking không Pass chỉ vì UI bật trạng thái ghi âm hoặc chuyển trang kết quả.

Readback khóa theo submissionId của lượt mới/resume đã ghi nhận khi mở editor; URL kết quả phải khớp ID đó. Với IN_PROGRESS chỉ đọc submission detail, không gọi API module detail yêu cầu đã nộp. Case Overview kiểm tra đúng ô giới hạn/số lượt, case lịch sử so số dòng và từng attempt với API, case điểm so đúng ô điểm thô với maximum API. Các lỗi điều hướng, nhãn metadata và bộ lọc được ghi riêng; không thay route bằng JavaScript nội bộ hoặc submit API để vượt lỗi ứng dụng.

PDF/Writing và câu trả lời là dữ liệu tổng hợp. Không đánh giá chất lượng AI chấm, nội dung audio Listening, chất lượng phát âm, tính đúng từng KPI analytics, accessibility/responsive, hoặc toàn bộ phân hệ Học viên. Trang đã có API vẫn có thể có giới hạn/chức năng chưa hoàn thiện; Fail cần xem bằng chứng trước khi tạo issue.

Browser QA30 bật thiết bị microphone tổng hợp của Chromium để không cần người dùng cấp quyền hoặc nói vào micro. Case Speaking vẫn bắt buộc có file audio READY trong API; thiết bị tổng hợp không bỏ qua bước upload của ứng dụng.

## Cấu trúc và report

```text
run-student.js                  # Lock, snapshot, fixture, session và kết quả theo case
pages/student/StudentPage.js    # Điều hướng thực qua sidebar/card và explicit wait
tests/student/cases.js          # Registry 45 case; gọi navigation-cases.js
tests/student/navigation-cases.js # Cases 029–045 theo bản đồ UI
support/student/fixtures.js     # Dữ liệu QA riêng và API readback
support/student/scenario-plan.js # Chỉ chuẩn bị dữ liệu cần cho case được chọn
support/student/ui-contract.js  # Đọc nhãn, số lượt và lịch sử đã đối chiếu DOM
utils/suite-reporter.js         # Reporter dùng chung QA29/QA30
tests/framework/student.test.js # Chặn false pass và kiểm tra report
```

Mỗi lượt trong `reports/qa30-<timestamp>/`: `report.html`, `summary.json`, `junit.xml`, `TRIAGE.md`, ảnh/text/**DOM HTML** theo case, `evidence/QA30-xxx.json`, draft issue, ledger và `source-snapshot/` cùng SHA-256. `testRevision=v6-staging-readiness` phân biệt bản này với run cũ. `runtime` ghi thư mục Temp/dung lượng; `stagingHealth` ghi trạng thái frontend/API; `browserPreflight` ghi phiên bản browser mở thử. Nếu preflight bị chặn thì chưa có fixture hoặc evidence case. Locator/format chưa nhận diện ghi `UI_CONTRACT_REVIEW`; số UI khác API ghi `PRODUCT_CANDIDATE`, vẫn cần review. Chrome ghi thêm `browserNetwork`: method, endpoint không query, status và lỗi transport của request UI; không lưu auth, header, body hoặc signed URL. Đây là bằng chứng riêng với `apiObservations` của harness. `reports/latest-qa30.txt` trỏ tới lượt hoàn tất mới nhất. Reporter lưu sau từng case; case chưa chạy không tính Pass. Exit code 0 cho PASSED/PREPARED, 1 khi có lỗi, 2 khi Blocked, 130 khi người chạy ngắt.

Nguồn đối chiếu: `production_artifacts/fe_to_tester/FE_STUDENT_PORTAL_REAL_API_TEST_GUIDE.md`, source `frontend/src/pages/Student*.tsx`, API Student Evaluations/Submission/Grading trong repo. Mã TASK-FE-22 trong backlog hiện tại chỉ phần ghi âm thật; phạm vi QA30 được bám theo bốn luồng chính trong yêu cầu tester và hướng dẫn Student Portal.

Không commit `.env`, account cache, ledger staging hay report thô. Review ảnh/text trước khi chia sẻ; token và credential cấu hình được che trong report. [Bàn giao QA30](../../production_artifacts/test_reports/QA-30/README.md) ghi kết quả thực chạy và các issue liên quan.
