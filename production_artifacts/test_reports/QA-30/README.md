# QA30 — đang review lại bộ test và bàn giao issue

**Cập nhật sau phản hồi của người dùng 19/10: QA30 trở lại In Progress, chưa được chấp nhận hoàn tất.** Đã viết lại 8 issue #173–#180 theo mẫu QA29 và tách 5 hành vi bị gộp thành #182–#186. [Danh sách và phạm vi issue hiện hành](issue-correction-2026-10-19/README.md) thay thế cách gộp cũ. Mỗi issue có dữ liệu, bước tái hiện, expected/actual, bằng chứng và retest; đã đọc lại xác minh cả 13 issue. Không có run staging mới trong lượt sửa tài liệu. Kết quả gốc giữ **24 Pass / 18 Fail / 3 Blocked**. Các đoạn dưới và [báo cáo hoàn thành cũ](COMPLETION-2026-10-19.md) chỉ là lịch sử, không phải xác nhận Done hiện tại.

**Cập nhật retest do agent 19/10:** [review full run 17:50 và kiểm chứng có chọn lọc](AGENT-RETEST-2026-10-19.md). Full run mới vẫn 20 Pass/25 Fail. V7 sửa chờ lịch sử và validation-file evidence; retest xác nhận CTA hết lượt còn bật, mapping/feedback/MCQ sai, và luồng nộp tiếp tục sau module HTTP 400. Không có bằng chứng TXT được lưu. 66 kiểm tra local đạt; chưa có full run v7.

**Lượt người dùng chạy 18/10, 20:40–20:53: 20 Pass / 25 Fail, đủ 45 case.** [Review chi tiết](RUN-REVIEW-2026-10-18-2053.md) phân biệt vấn đề web, các assertion chưa đi tới và lỗi chờ Overview. Không còn lỗi Chrome/ổ C như 17/10. Có bằng chứng mất dữ liệu nộp bài, render câu hỏi sai và bất nhất điểm/feedback; không coi 25 Fail là 25 bug. Chưa tạo issue, chưa đạt DoD. Các ghi nhận chuẩn bị và lịch sử bên dưới giữ nguyên theo thời điểm.

**Cập nhật 18/10: runner v6, 45 case, 65 kiểm tra local đạt.** [Bàn giao và trạng thái staging hôm nay](PREPARATION-2026-10-18.md): API hoạt động trở lại; đã đăng nhập và khảo sát đủ 11 màn, không lỗi điều hướng. Launcher đã kiểm tra bằng CheckOnly; sẵn sàng để người dùng chạy lấy report mới. Khảo sát không phải nghiệm thu; các ghi nhận v4/v5 bên dưới giữ làm lịch sử.

**Lịch sử bản v5.** Đã sửa lỗi Temp trên C đầy, thêm preflight trước API setup và dừng khi lỗi môi trường; [chi tiết và xác minh](RUNTIME-FIX-2026-10-17.md). 60 kiểm tra local đạt và Chrome trắng mở/đóng thành công với Temp trên D. Chưa tự chạy suite staging v5; người dùng dùng launcher để chạy lại.

Đã viết lại thành **45 case v4** sau khi đọc `origin/develop` mới (`67fd528`) và khảo sát staging: 11 view, DOM/ảnh, bundle frontend đang được phục vụ và các report editor cũ. Sửa locator Overview/timer/lịch sử, kiểm tra nội dung MCQ thật, tách nút Bảng điểm khỏi đường xem kết quả qua lịch sử, bổ sung lọc/điều hướng/validation/hết lượt. Watch v4 chuẩn bị dữ liệu mới chỉ cho case được chọn. **Chưa nghiệm thu, chưa tạo issue QA30.** Người dùng tự chạy rồi cùng review.

Hai lượt `qa30-2026-10-17T14-31-50-418Z` và `qa30-2026-10-17T14-32-24-209Z` dừng setup HTTP 400 trước khi chạy case: fixture sai cặp WRITING/REWRITE. Server vẫn phản hồi web 200/API 401 không xác thực. Đã sửa fixture thành WRITING/ESSAY, cập nhật case 011 thành kiểm tra khoảng lệch text UI/API file, thêm regression đọc whitelist backend thật. **53/53 kiểm tra local đạt; chưa chạy lại staging sau sửa setup.**

## Chạy lấy report

Mở `test/scripts/QA30-Run-Report.cmd`; tại workspace hiện tại có launcher `QA30-Run-Report.cmd` ngay thư mục gốc. Launcher chạy headless, lưu terminal log và tự mở `report.html` sau khi kết thúc.

[Hướng dẫn QA30](../../../test/selenium/QA30-README.md) · [45 test case](../../../test/selenium/QA30-TEST-CASES.md) · [Bản đồ nút/chức năng và khoảng chưa bao phủ](../../../test/selenium/QA30-UI-MAP.md) · [Review lịch sử lượt 24 case](TEST-QUALITY-REVIEW-2026-10-17.md).

Tài khoản Học viên QA30 riêng được giữ local. Khi người dùng chạy, schema v3 chuẩn bị lớp/bài mới đúng loại module; không dùng fixture schema cũ để đánh giá v4. Giữ `.cache/qa30-account.json` và `fixtures/qa30.json` local; không đính kèm password/token. Khảo sát web không thay thế một lượt test, không ghi Pass cho case chưa chạy.

Các lượt thử kỹ thuật trước khi người dùng yêu cầu tự chạy được giữ nguyên trong `test/selenium/reports/`; chúng không phải kết quả nghiệm thu bản test hiện tại. Harness đã được chỉnh sau các lượt thử đó. Không dùng kết quả cũ để tuyên bố QA30 Done hoặc tạo issue sản phẩm.

## Khi review lượt mới

Đọc `report.html`, `summary.json`, `TRIAGE.md`, screenshot/text/DOM (`QA30-xxx.html`) và `evidence/QA30-xxx.json`. Với lượt tiếp theo, xác minh `testRevision=v5-runtime-preflight`. Kiểm tra đủ số case đã chọn, không có case chưa chạy hoặc ABORTED bị tính Pass. Mỗi case nộp bài cần cả UI và API readback; thiếu audio/file thật hoặc trạng thái chưa lưu phải được thể hiện rõ. Case 007 có thể vẫn Fail nếu UI còn hiển thị 3 lượt trong khi API lưu 10; đó phải là assertion số liệu rõ ràng, không phải timeout locator cũ.

Nếu xác nhận lỗi sản phẩm sau review, ghi issue kèm ID test, bước tái hiện, expected/actual và bằng chứng của chính lượt mới; ghi ngược URL issue vào bàn giao/report. Không gộp lỗi fixture, locator hoặc chờ dữ liệu thành bug ứng dụng.
