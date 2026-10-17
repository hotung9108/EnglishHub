# QA29 — Selenium cho luồng Giáo viên

QA29 đã hoàn tất kiểm thử và bàn giao issue/Trello theo xác nhận của tester. Lượt staging ngày 15/10/2026 có **41 Passed / 7 Failed / 3 Blocked**. Xem [bàn giao và issue liên quan](../../production_artifacts/test_reports/QA-29/README.md). Kết quả này thuộc bản standalone; việc tích hợp source vào repo không tạo ra kết quả staging mới.

## Cài đặt và cấu hình

Yêu cầu Windows, Node.js 22+, Chrome/Edge và `curl.exe`. Tại thư mục gốc repo:

```powershell
cd test/selenium
npm.cmd ci --no-audit --no-fund --cache .cache/npm
Copy-Item .env.example .env # Chỉ làm nếu chưa có .env
```

Điền tài khoản QA riêng trong `.env`: `SELENIUM_ADMIN_EMAIL/PASSWORD`, `SELENIUM_TEACHER_EMAIL/PASSWORD`, `SELENIUM_STUDENT_EMAIL/PASSWORD`, `QA29_OUTSIDER_EMAIL/PASSWORD`. Giáo viên outsider phải khác giáo viên chính. `SELENIUM_BASE_URL` phải là `https://staging.hotung9108.me`; API fixture bị giới hạn ở staging `https://api-staging.hotung9108.me/api/v1`.

Cấu hình dùng chung với QA28: `SELENIUM_BROWSER`, `SELENIUM_HEADLESS`, `SELENIUM_TIMEOUT_MS`, `SELENIUM_BROWSER_BINARY`, `SELENIUM_DRIVER_PATH`, `SELENIUM_GRID_URL`. Tên biến cũ `QA28_*` vẫn được đọc khi biến `SELENIUM_*` tương ứng chưa được đặt. Nếu chuyển từ bản standalone, copy `.env` và hai ledger `fixtures/staging.json`, `fixtures/cleanup-state.json` vào đúng vị trí local để tiếp tục truy vết dữ liệu QA; không commit các file này.

Runner tự cập nhật tên `QA29_CLASS_NAME`, `QA29_STUDENT_NAME`, `QA29_ASSIGNMENT_TITLE` và ledger sau bước chuẩn bị. `QA29_SCORE` mặc định 7; `QA29_DATA_TIMEOUT_MS` mặc định 180000, giới hạn 1000–300000. Explicit wait kết thúc ngay khi đúng dữ liệu hiển thị; hết hạn vẫn Failed, không tự Pass.

## Chạy

```powershell
npm.cmd run test:teacher
npm.cmd run test:teacher -- --case=QA29-010
npm.cmd run test:teacher:watch -- --case=QA29-003
npm.cmd run test:teacher:watch -- --delay-ms=4000
npm.cmd run check
```

Launcher Windows nằm trong `test/scripts/`: `QA29-Run-Teacher.cmd`, `QA29-Watch-Teacher.cmd`, `QA29-Run-Report.cmd`, `QA29-Prepare-Fixtures.cmd`, `QA29-Cleanup.cmd`. Run Report chạy headless, lưu terminal log và mở report khi hoàn tất. Watch hiện browser và mặc định dừng 2,5 giây trước thao tác để quan sát; không thao tác tay trong cửa sổ automation.

Mỗi lượt khóa một runner, dọn bài QA cũ/profile tạm rồi chuẩn bị fixture nền và mở rộng trước Selenium. Cleanup thất bại thì dừng. Mỗi case có browser session riêng, kiểm tra role sau login; case lỗi không ngăn case kế tiếp. Không chạy nhiều suite trên cùng dữ liệu QA.

Cleanup chỉ nhận dạng chính xác định dạng tài nguyên do suite tạo và xác minh chủ sở hữu là giáo viên QA đã cấu hình; bảo vệ tài khoản dùng chung. API xóa bài là soft-delete. Sau run giữ dữ liệu cho review, lần tiếp theo mới dọn. Ledger/class cũ có dữ liệu liên quan có thể được giữ lại và ghi rõ trong log.

```powershell
npm.cmd run cleanup:teacher             # Chỉ kiểm kê, có gọi API đọc
npm.cmd run cleanup:teacher -- --apply  # Thực hiện dọn tài nguyên QA
npm.cmd run prepare:teacher             # Chuẩn bị riêng khi cần
```

## Cấu trúc

```text
run-teacher.js                  # Điều phối session, fixture, evidence và exit code
config/env.js                   # Cấu hình dùng chung; .env ở test/selenium
pages/teacher/                  # Locator và thao tác Teacher
tests/teacher/                  # Registry 51 case và assertions nghiệp vụ
support/teacher/                # Fixture API, cleanup, lock, report, phân loại lỗi
tests/framework/                # Kiểm tra local, API giả lập và reporter
tools/                          # Launcher PowerShell và tiện ích tạo tài liệu/Postman
fixtures/qa29-writing-sample.pdf # Bài viết tổng hợp, không có dữ liệu người học
```

`npm.cmd run docs:teacher` sinh [QA29-TEST-CASES.md](QA29-TEST-CASES.md) trực tiếp từ registry, không chạy Selenium. PDF mẫu đã có sẵn; `fixtures/build-sample.py` tạo lại với Python `reportlab` và `PyMuPDF`, không cần cho chạy test thông thường.

## Phạm vi và bằng chứng

51 case bao phủ login/logout; lớp, học viên, bảng điểm; tạo/preview/sửa/lịch bài bốn kỹ năng; chấm/nhận xét/AI; quyền ngoài lớp; profile/password/settings và ngân hàng đề. Xem quy trình và expected cụ thể trong tài liệu case. API chỉ chuẩn bị fixture và đối chiếu dữ liệu; thao tác UI dùng Selenium.

Không suy ra bao phủ toàn dự án từ số case. Ngân hàng đề kiểm tra mở modal, chưa xác minh xác nhận giao đề; export kiểm tra file thật khác rỗng, chưa xác minh từng ô; AI kiểm tra luồng gợi ý, không đánh giá chất lượng mô hình. Speaking dùng WAV giả lập cho luồng chấm thủ công.

Mỗi run tạo `reports/qa29-<timestamp>/` với `report.html`, `summary.json`, `junit.xml`, `TRIAGE.md`, ảnh `QA29-xxx.png`, `evidence/QA29-xxx.json`, draft issue, ledger và download. `pre-run-cleanup/cleanup.json` ghi dọn dữ liệu; `source-snapshot/` giữ module thực sự dùng trong run, kèm SHA-256 trong summary. `reports/latest-qa29.txt` trỏ tới report mới nhất. Run Report thêm `terminal.log`.

Passed nghĩa assertions đạt; Failed cần review bằng chứng và không tự đồng nghĩa bug ứng dụng; Blocked là thiếu điều kiện/control. Dừng giữa chừng giữ ABORTED và không tính case chưa chạy là Pass. Exit code 0 đạt, 1 có lỗi, 2 có Blocked, 130 khi ngắt bằng Ctrl+C. Report được lưu sau từng case.

`.env`, ledger staging, `node_modules/`, `.cache/`, report và `*.local.postman_environment.json` được ignore. Report có thể chứa danh tính QA; review trước khi chia sẻ. Reporter che credential cấu hình/JWT/Bearer; không dump body login hoặc auth header.

## Postman QA29-039

`postman/QA29-039/` có collection kiểm tra API đọc lớp ngoài quyền và environment mẫu trống. Điền hai tài khoản QA, ID lớp và chủ sở hữu đã xác minh. Request kiểm tra giáo viên A không đọc được lớp của B; 403/404 là deny, 200 là lỗi. Setup sai/không đọc được bằng chủ sở hữu không được tính Pass. Đây là kiểm tra API, không thay thế verdict UI.

`npm.cmd run postman:teacher-access` tạo environment local từ `.env` và `fixtures/cleanup-state.json`. File có credential phải giữ local. Collection chỉ chạy khi người dùng Send/Run trong Postman; việc tạo file không chứng minh kết quả staging.
