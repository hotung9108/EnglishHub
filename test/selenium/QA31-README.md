# QA31 — Selenium Admin trên staging

Bản hiện tại **2026-10-20-admin-r7**, **50 case**. Người dùng đã chạy full r6: **35 Pass / 9 Fail / 6 Blocked**, không lỗi fixture. [Bàn giao kết quả](../../production_artifacts/test_reports/QA-31/README.md), [issue đã đăng](../../production_artifacts/test_reports/QA-31/ISSUE-LINKS-2026-10-20.md), [quy trình đủ 50 case](QA31-TEST-CASES.md). R7 sửa phân loại 050 và gắn link issue vào case/report cho lần chạy sau: không suy ra thiếu chức năng từ việc không có menu sidebar riêng; chưa chạy staging r7, không đổi counts r6.

Kết quả trước: full r2 có 35 case, **26 Pass / 6 Fail / 3 Blocked**. Retest r5 chọn 21 case, **11 Pass / 7 Fail / 3 Blocked**. Không đổi kết quả cũ hoặc gộp thành full run 50 case mới. Task còn In Progress; đã đăng 9 issue #189–197. Report/evidence thô giữ local, không commit vào repo công khai.

## Chạy từ thư mục gốc repo

Trong `test/selenium`, chạy `npm.cmd ci`, sao chép `.env.example` thành `.env` và điền `SELENIUM_ADMIN_EMAIL/PASSWORD` của tài khoản Admin QA riêng. Không commit `.env`. Sau đó từ thư mục gốc repo chạy toàn bộ 50 case, hoặc bấm đúp launcher trong `test/scripts`:

```powershell
.\test\scripts\QA31-Run-Report.cmd
```

Chỉ chạy 10 case mới:

```powershell
.\test\scripts\QA31-Run-Report.cmd -Cases "041,042,043,044,045,046,047,048,049,050"
```

Chỉ kiểm tra config/registry, không mạng/browser/fixture:

```powershell
.\test\scripts\QA31-Run-Report.cmd -CheckOnly
```

Watch một case hoặc mở menu chọn case:

```powershell
.\test\scripts\QA31-Run-Report.cmd -Watch -Case QA31-043 -Slow 2500
.\test\scripts\QA31-Watch-Admin.cmd
```

Run mặc định headless. Watch là chạy lại với fixture cần thiết, không phải video run cũ. Mỗi case có browser/session Admin mới; không chạy song song hoặc thao tác tay trong browser automation. Không dùng đồng thời `-Case` và `-Cases`.

Worktree `BTL_PRJ1/EnglishHub-qa31`, branch `feature/qa-31-admin-selenium`; framework QA28/QA29, Node >=22, Selenium 4.35.0, Chrome/Edge. `.env`, dependencies và driver cache riêng không đưa lên Git. Cần Admin test trong `SELENIUM_ADMIN_EMAIL/PASSWORD` hoặc alias `QA28_ADMIN_EMAIL/PASSWORD`; xem `.env.example`. Frontend chỉ `https://staging.hotung9108.me`, API staging `https://api-staging.hotung9108.me/api/v1`.

## Dữ liệu và bằng chứng

Setup API chỉ tạo prerequisite QA theo case chọn: Teacher/Student, tối đa ba lớp setup, bài PUBLISHED và grading có lịch sử khi cần. Dùng prefix `qa31-...@example.invalid` và `QA31-...`; tên fullname không chứa chữ số. User tạo qua UI có tên/email phân biệt với setup. Không sửa/xóa dữ liệu QA30 hoặc user thật.

Case sửa/khóa chỉ được tác động ID/email/role QA trong ledger đã xác minh. Case 041–042 dừng trước mutation khi không tìm được Student hoặc hồ sơ hiện sai người. Nếu đã vào luồng khóa thì finally khôi phục ACTIVE đúng QA. Dữ liệu được giữ cùng `fixture-ledger.json` để review; chưa tự cleanup tài khoản/lớp. Không chạy lặp vô ích làm tăng dữ liệu.

Preflight HTTP/browser/dung lượng temp >=512 MiB chạy trước tạo fixture. Temp/cache nằm trên D dưới worktree. Nếu có lock, xem PID trong `.cache/qa31.lock`, xác minh tiến trình đã thoát trước khi xóa riêng lock; không xóa khi run còn hoạt động.

Run ghi thư mục `test/selenium/reports/qa31-<UTC timestamp>/`, HTML/JSON/JUnit/TRIAGE, ledger, ảnh/DOM, bước thực tế, API readback/network metadata và source snapshot/hash. Launcher tự mở HTML mới khi xong. `reports/latest-qa31.json` có thể trỏ lượt Watch; cần phân biệt với full run. Log console ở `.cache/qa31-console-*.log`.

Không ghi mật khẩu/token/body request hoặc signed storage URL. Evidence ngày/role lấy từ UI và API đọc lại; API setup không được thay cho hành vi Admin đang kiểm thử. Native input date dùng setter và input/change events qua Selenium, không sửa kết quả hoặc gọi API để thay UI filter; giá trị ISO được xác minh.

## Phạm vi

| Nhóm | Case | Kiểm tra |
| --- | --- | --- |
| Login/navigation | 001–002 | Vai trò, URL, sidebar |
| Accounts search/edit/status | 003–008 | Search/empty/role filter/cancel/save/lock; không tìm QA thì Blocked |
| Teacher/Student wizard | 009–014, 034–035 | Required/name/email, create UI, search, Teacher detail |
| Classes | 015–020, 022–024 | Create/search/roster/profile/settings/archive/restore |
| Assignments trong lớp | 021 | Bài PUBLISHED, UI và quyền API |
| Reports cơ bản | 025–028 | Class/teacher filter, số liệu, progress/reset select |
| Audit cơ bản | 029–031 | ID/status/score/detail/history trên grading QA |
| Settings cá nhân | 032–033 | Chỉ đọc email/password fields, không thay cấu hình hệ thống |
| Accounts role creation | 036–038 | ADMIN/TEACHER/STUDENT, API phải đúng role đã chọn |
| Search đối chứng | 039–040 | User có sẵn, không do run tạo, tìm email và tên |
| Student status | 041–042 | Lock/unlock từ list/detail, nhận dạng và cleanup đúng QA |
| Reports date | 043–045 | Khoảng chứa/loại bài QA, reset ngày/select, KPI/readback |
| Audit status | 046–047 | COMPLETED/PENDING, yêu cầu dòng đối chứng và đúng mọi dòng hiển thị |
| System settings | 048–049 | Form theo FE-23, lưu sau reload/reset; thiếu form thì Fail/Blocked |
| Nội dung hệ thống | 050 | Khảo sát entry; thiếu luồng/đặc tả thì Blocked/SCOPE_REVIEW, không đại diện CRUD hoặc tự xác nhận bug |

Expected dựa trên yêu cầu QA31/FE-23; không đổi kỳ vọng theo source để làm Pass. Failed cần review, chưa tự xác nhận nguyên nhân hoặc tạo issue. Blocked ghi rõ phụ thuộc/fixture; bước sau điểm dừng chưa được kiểm tra. Thiếu form hệ thống không được Pass vì có cài đặt cá nhân.

Coverage còn cần kết quả mới, CRUD nội dung với contract cụ thể, pagination, Audit empty history/score filters, error/retry và các tổ hợp validation. Chưa đo >80% code coverage. Issue Markdown tự sinh chỉ là draft; trước Done cần issue liên kết testcase theo mẫu QA29 và phạm vi được chấp nhận, không cần sản phẩm hết mọi bug.

## Kiểm tra cục bộ

`npm.cmd run check` trong `test/selenium`: **64/64 Pass**, gồm kiểm tra link issue trong report. Đã kiểm tra date input/events trên Chrome với HTML cục bộ. CheckOnly/syntax không thay cho staging run; kết quả thật r6 xem báo cáo bàn giao.
