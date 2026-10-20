# QA31 — Bàn giao Selenium luồng Admin

Suite gồm **50 test case** trên framework QA28/QA29: tài khoản, Teacher/Student, lớp/roster, bài tập trong lớp, Reports, Audit và cấu hình theo FE-23. [Hướng dẫn Run/Watch](../../../test/selenium/QA31-README.md), [quy trình và kỳ vọng từng case](../../../test/selenium/QA31-TEST-CASES.md).

## Kết quả đã chạy

Full run r6 ngày 20/10/2026: **35 Pass / 9 Fail / 6 Blocked**, đủ 50 case, không lỗi fixture. Retest r5 trước đó chọn 21 case: 11 Pass / 7 Fail / 3 Blocked; không gộp hai lượt thành một kết quả mới.

Revision r7 sửa case 050 thành Blocked/SCOPE_REVIEW khi không xác định được luồng nội dung từ khảo sát sidebar, đồng thời gắn link issue vào case/report. **Chưa chạy staging r7**; không sửa kết quả gốc r6. Framework trước đóng gói đạt 64/64 checks cục bộ; không thay cho staging hoặc số test nghiệp vụ.

Report HTML/JSON/JUnit, ảnh, DOM, network, source snapshot và ledger được giữ trong `test/selenium/reports/qa31-<timestamp>/` ở máy chạy, ngoài Git. `reports/latest-qa31.json` trỏ report gần nhất; mỗi lần chạy tạo thư mục riêng. Bàn giao report cùng evidence qua kênh nội bộ, không commit thông tin tài khoản, định danh fixture hoặc artifact thô vào repo công khai.

## Issue và giới hạn

[9 issue #189–197 đã đăng, mapping testcase và comment Trello](ISSUE-LINKS-2026-10-20.md). [Bản issue công khai](issues/public) dùng placeholder, có bước tái hiện, Expected/Actual, bằng chứng quan sát và tiêu chí retest. Lỗi API tạo ADMIN là diagnostic riêng liên quan 036, không cộng thêm Selenium Fail.

| Case | Chưa xác minh được |
|---|---|
| 006/007/008 | Hủy/sửa/khóa Accounts vì lỗi tìm user tại 003 |
| 041 | Khóa Student từ danh sách vì lỗi tìm kiếm tại 014 |
| 042 | Khóa Student từ hồ sơ vì danh tính sai tại 020 |
| 049 | Save/reload/reset cấu hình vì thiếu form tại 048 |
| 050 | Luồng quản lý nội dung; thiếu menu riêng chưa chứng minh thiếu chức năng |

Không tính bước sau blocker là Pass hoặc bug mới. Chưa đo code coverage >80%, chưa bao phủ CRUD nội dung đầy đủ, phân trang, Audit empty history/score filters, error/retry và mọi tổ hợp validation. Task giữ **In Progress** đến khi phạm vi được thống nhất và các giới hạn bàn giao được chấp nhận.

## Dữ liệu test

API chỉ tạo prerequisite QA; hành vi đang kiểm thử chạy qua Selenium. Chỉ mutate user/class trong ledger và xác minh danh tính trước thao tác; không dùng tài khoản thật thay fixture bị lỗi. Khóa/đổi trạng thái có khôi phục ACTIVE theo guard. Fixture giữ để review, chưa tự cleanup; tránh chạy đồng thời hoặc lặp không cần thiết. Run mặc định headless; Watch chạy lại case với dữ liệu QA mới và browser hiển thị, không phải phát video run cũ.
