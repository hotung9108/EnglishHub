# QA30 — Chuẩn bị lại ngày 18/10/2026

## Trạng thái bàn giao

Bộ 45 case và launcher `D:\ki7\prj1\QA30-Run-Report.cmd` đã được kiểm tra lại. **API hoạt động trở lại; đã khảo sát đủ 11 màn sau đăng nhập lúc 20:34 ngày 18/10 (UTC+7), không lỗi điều hướng.** Người dùng tự bấm chạy; cùng review kết quả trước khi tạo issue. Chưa có run nghiệm thu mới; không dùng số Pass/Fail của lượt 17/10 để kết luận v6.

## Kiểm tra mã nguồn

- Fetch origin và đọc bản develop `321ce42` trong worktree nguồn riêng `EnglishHub-qa30-source`; PR #167 của QA29 đã merge. Giữ nguyên thay đổi QA30 chưa commit trong worktree test.
- Phần frontend Student và whitelist ModuleSkill/ModuleTaskType không đổi so với commit tham chiếu 67fd528. Đối chiếu lại router, Overview, lịch sử, chấm điểm/feedback, Speaking và hướng dẫn bàn giao Student Portal.
- Cấu trúc tiếp tục dùng POM `pages/student/StudentPage.js`, registry `tests/student/cases.js` + `navigation-cases.js`, dữ liệu QA riêng trong `support/student/fixtures.js`, kế hoạch setup theo case và readback API khóa theo submissionId.
- Sửa false-fail của case 045: hết lượt vẫn được có nút **Xem lại kết quả** bật; test chỉ cấm hành động bắt đầu/tiếp tục lượt mới. Có kiểm tra hồi quy cho cả nút kết quả hợp lệ và nút bắt đầu sai.
- Siết tìm lớp để chờ đúng một thẻ thay vì đọc ngay sau gõ; xác nhận chọn đúng class filter; lọc bảng điểm tìm dropdown theo giá trị lớp thay vì class CSS chỉ phục vụ kích thước; Speaking chưa ghi kiểm tra cả trạng thái UI và nút bị khóa.
- Case 007 kiểm tra riêng API vẫn có 0 lượt sau khi chỉ mở Overview, ngoài đối chiếu số lượt UI/API. Report HTML thêm link DOM của từng case để review locator/nút cùng ảnh và readback, không sửa report lịch sử.

## Khảo sát staging hôm nay

- Frontend root: HTTP 200; Chrome mở `/login`, form email/password/nút đăng nhập đọc được. Không nhập tài khoản hoặc gửi form trong lần khảo sát công khai.
- Đã tải lại bundle đang được phục vụ: `index-BBK5DcPN.js`, SHA-256 `360e7a7e5c37c9bb3cc1e610ebebe007ff6187b27bde4aef2e39ded98fc8356c`, trùng hoàn toàn bundle đã khảo sát ngày 17/10.
- Lần đầu API `/api/v1/classes` trả **HTTP 530**, body `error code: 1033`; login cũng trả 530. Sau khi server được bật lại, kiểm tra GET frontend HTTP 200/API HTTP 401 khi chưa đăng nhập, rồi login QA30 thành công. Đây là hai thời điểm khác nhau, không phải kết luận server vẫn tắt.
- Ảnh login, bundle và inventory lưu local trong `test/selenium/.cache/qa30-ui-map-2026-10-18T12-15-49-069Z/`; lần khảo sát không login được lưu riêng. Không ghi đè evidence cũ.
- Ổ C lúc kiểm tra đã có 27360 MiB trống; D có 49338 MiB. Vẫn giữ Temp riêng trên D để hạn chế phụ thuộc ổ hệ thống.

### Khảo sát sau khi server hoạt động lại

- Inventory mới: `test/selenium/.cache/qa30-ui-map-2026-10-18T13-34-34-673Z/inventory.json`. Đủ dashboard, lớp, chi tiết lớp, danh sách bài, Overview, lịch sử, bảng điểm, feedback, kết quả, profile và settings; đúng 11 route, không navigation error. Đọc lại 14 assignment qua API. Bundle vẫn cùng SHA-256 phía trên.
- Chỉ dùng dữ liệu QA30 đã có, mở trang và đọc API; không tạo fixture, không bắt đầu editor, không nộp/chấm bài hoặc sửa hồ sơ. Kết quả qua lịch sử mở đúng submission #1462; điểm 7.5/10 và tab “Nhận xét & Trao đổi” đọc được.
- Overview #1498: giới hạn UI 3/API 10. Bài graded #1505: UI `1 / 3 lần (Còn 2 lượt)`/API giới hạn 1 và vẫn có nút bắt đầu lần 2. Lịch sử hiển thị 7.5/10 nhưng “Chờ chấm điểm”, khác kết quả đã chấm. Bảng điểm có mẫu số 100, tên thay thế cho một số bài và trạng thái đang chấm. Feedback hiển thị evaluation định kỳ và nút “Xem bài làm & Lời giải chi tiết”. Đây là quan sát cần đối chiếu report sạch, chưa tạo issue.
- Giữ assertions so API/fixture để bắt chênh lệch trên; không sửa test để chấp nhận UI sai. Các editor chưa khảo sát lại hôm nay vì mở editor có thể tự tạo attempt: tiếp tục đối chiếu source, bundle và evidence run 17/10, rồi xác minh qua lượt chạy của người dùng. Không tuyên bố 45 case đã Pass hoặc bao phủ toàn bộ tính năng web.

## Launcher v6

1. Kiểm tra Temp/quyền ghi/dung lượng trên ổ dự án.
2. GET frontend và API không gửi thông tin đăng nhập. Frontend 200 và API có phản hồi 200/401/403 cho phép đi tiếp; bước này chỉ kiểm tra khả dụng, không chứng minh quyền/tài khoản đúng.
3. Nếu API 530/5xx hoặc lỗi kết nối: dừng **Blocked / ENVIRONMENT_REVIEW**, chưa tạo fixture và chưa chạy case. Report giữ rõ số chưa chạy.
4. Khi staging sẵn sàng: mở/đóng Chrome trắng, tạo dữ liệu mới hợp lệ, chạy case thực bằng Selenium và đọc lại kết quả API.
5. Lưu HTML/JSON/JUnit, screenshot/text/DOM, network metadata và source snapshot; mở report cho người dùng. Fail chưa phải bug đã xác nhận.

Case 011 vẫn ghi khoảng lệch UI text với API ESSAY lưu file; không ép xanh. Các giới hạn bao phủ (audio Listening, nhiều module, deadline, DOCX/quá dung lượng, pagination, quyền chéo...) giữ trong QA30-UI-MAP.md.

## Xác minh và lệnh chạy

- **65/65 kiểm tra local đạt**; syntax checks và `git diff --check` đạt.
- Đã chạy toàn bộ chuỗi launcher bằng `QA30-Run-Report.cmd -CheckOnly`: đọc đúng 45 case, exit 0, không network/browser/setup/test.
- Probe kết nối thật phân biệt được hai trạng thái: API 530 trả Blocked; sau phục hồi frontend 200/API 401 trả READY. Đăng nhập và survey 11 màn thành công. Không tự chạy suite staging hoặc tạo fixture hôm nay.

Double-click `D:\ki7\prj1\QA30-Run-Report.cmd` hoặc chạy `.\QA30-Run-Report.cmd` tại workspace. Bản mới ghi `testRevision=v6-staging-readiness`; staging đã sẵn sàng tại thời điểm khảo sát. Nếu API mất kết nối lại, report Blocked là kết quả kiểm tra môi trường, không phải kết quả 45 case. Launcher mở HTML mới sau khi kết thúc; review từng Fail theo ảnh/DOM, readback và network trước khi xác nhận bug.
