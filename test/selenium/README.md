# EnglishHub Selenium Framework

Framework JavaScript dùng chung cho test UI Auth, Giáo viên, Học viên và Admin. QA-28 khởi tạo nền tảng; các task sau thêm Page Object và test vào cùng cấu trúc.

## Cài và chạy trên Windows

Yêu cầu Node.js 22+, Chrome/Edge và mạng để tải dependency/driver lần đầu.

```powershell
cd test/selenium
npm.cmd ci --no-audit --no-fund --cache .cache/npm
Copy-Item .env.example .env  # Chỉ làm nếu chưa có .env
# Điền SELENIUM_TEACHER_EMAIL và SELENIUM_TEACHER_PASSWORD trong .env
npm.cmd run test:login
```

Hoặc mở `test/scripts/run-selenium-login.bat`. Nếu chưa có `.env`, launcher tạo file mẫu rồi dừng để bạn điền tài khoản. Không commit `.env`.

| Lệnh | Phạm vi |
| --- | --- |
| `npm.cmd test` | Smoke form, không đăng nhập |
| `npm.cmd run test:login` | Smoke và login Giáo viên |
| `node run.js --role=admin` | Smoke và login Admin |
| `node run.js --role=student` | Smoke và login Học viên |
| `npm.cmd run test:roles` | Smoke và login ba role |
| `npm.cmd run check` | Kiểm tra config/redaction, không mở browser |
| `npm.cmd run test:self` | Chrome trên fixture local, không phải kết quả staging |
| `npm.cmd run test:teacher` | QA29: 51 case Giáo viên, tự cleanup và chuẩn bị fixture staging |
| `npm.cmd run test:teacher:watch -- --case=QA29-003` | QA29: quan sát một case |

Default staging origin là `https://staging.hotung9108.me`; mở URL gốc và chờ form, không truy cập trực tiếp `/login`. Chọn đúng tab role trước khi điền tài khoản. Login kiểm tra `/{role}/dashboard`, vùng `main` và role trong `localStorage['eh_user']`. Mỗi case có session Chrome riêng và luôn đóng driver; không gọi logout.

## Cấu hình

Các biến nằm trong `.env.example`: `SELENIUM_BASE_URL`, `SELENIUM_BROWSER=chrome|edge`, `SELENIUM_HEADLESS=true|false`, `SELENIUM_TIMEOUT_MS` (1000–120000), tài khoản `SELENIUM_ADMIN_EMAIL/PASSWORD`, `SELENIUM_TEACHER_EMAIL/PASSWORD`, `SELENIUM_STUDENT_EMAIL/PASSWORD`.

Biến môi trường tiến trình ưu tiên hơn `.env`. `TEST_ENV=dev` dùng localhost:5173 khi không đặt `SELENIUM_BASE_URL`; `SELENIUM_BASE_URL` luôn ưu tiên. Selenium Manager tải driver vào `.cache/selenium`. Có thể cấu hình `SELENIUM_BROWSER_BINARY`, `SELENIUM_DRIVER_PATH` hoặc `SELENIUM_GRID_URL`.

## Cấu trúc và thêm test

```text
config/env.js              # Cấu hình và tài khoản ngoài source
utils/browser-factory.js   # Chrome/Edge/Grid và timeout
utils/reporter.js          # HTML/JSON, redaction
pages/BasePage.js          # Explicit wait
pages/auth/LoginPage.js    # Locator/thao tác login
pages/teacher/             # Page Object của luồng Giáo viên
pages/student/             # Page Object của luồng Học viên
pages/admin/               # Page Object của luồng Admin
tests/auth/login.test.js   # Các bước và kỳ vọng smoke/login
tests/teacher/             # Case Giáo viên
tests/student/             # Case Học viên
tests/admin/               # Case Admin
tests/framework/           # Kiểm tra cấu hình/reporter
run.js                    # Session, thứ tự chạy, report và exit code
legacy/                   # Khung cũ chưa xác minh, không chạy mặc định
```

1. Thêm Page Object trong `pages/<luồng>/`, kế thừa BasePage. Giữ locator và thao tác tại Page Object, dùng explicit wait.
2. Thêm case trong `tests/<luồng>/` theo `tests/auth/login.test.js`: `{id, title, async run(page) {...}}`.
3. Import case vào `run.js` và gọi `execute(case)`. Runner hiện dùng LoginPage làm trang bắt đầu; trong case khởi tạo Page Object tiếp theo bằng `page.driver` và `page.config`, rồi thực hiện thao tác/kiểm tra.
4. Thêm lệnh npm nếu cần chọn nhóm case mới. Không tạo framework riêng theo mã QA-29/QA-30.

## Report và bằng chứng QA-28

Mỗi run tạo `reports/run-.../report.html`, `summary.json` và screenshot. Exit 0 là Passed, 1 là lỗi, 2 là thiếu tài khoản/Blocked. Reporter che credential cấu hình trong error và xóa input trước screenshot; không dump token/DOM/storage. Ảnh có thể chứa danh tính tài khoản QA.

[Bằng chứng QA-28](../../production_artifacts/test_reports/QA-28/README.md): người dùng đã chạy trên staging ngày 11/10/2026 lúc 18:19, smoke/login Giáo viên đều Passed. Report đó thuộc phiên bản standalone trước khi tổ chức lại, được giữ nguyên để truy vết. Không chạy lại browser khi tích hợp theo yêu cầu người dùng. Không suy ra Admin/Học viên, mọi luồng UI, usability hoặc maintainability đã đạt.

Khung Selenium cũ đã lưu trong `legacy/` vì có JSON/import/cú pháp chưa chạy được; không dùng để nghiệm thu. Project này có package/lockfile riêng, không cần cài package test cũ ở thư mục cha để chạy login.

## QA29 — luồng Giáo viên

[Hướng dẫn QA29](QA29-README.md) và [51 test case](QA29-TEST-CASES.md) dùng chung package, cấu hình, browser factory, BasePage và LoginPage ở đây. Case nằm trong `tests/teacher/`, Page Object trong `pages/teacher/`, API fixture/cleanup/report trong `support/teacher/`; `run-teacher.js` điều phối vòng đời riêng của bộ test Giáo viên. `npm.cmd run check` kiểm tra cả QA28 và QA29, không gọi staging hoặc mở browser.

[Bàn giao QA29](../../production_artifacts/test_reports/QA-29/README.md): task đã hoàn tất kiểm thử và bàn giao issue; lượt ngày 15/10/2026 đạt 41 Passed / 7 Failed / 3 Blocked. Đây là kết quả trước khi tích hợp vào repo, không phải lần chạy mới trên develop. Mọi launcher QA29 nằm trong `test/scripts/`.
