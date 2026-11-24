# QA30 v5 — sửa runtime sau lượt lỗi Preferences

Đối chiếu QA29: giữ mô hình browser/session riêng cho mỗi case, giữ fixture/report/source snapshot và phân biệt prerequisites với lỗi sản phẩm. QA29 cũng dùng browser factory mặc định; không coi QA29 là đã có giải pháp cho Temp đầy. QA30 v5 bổ sung xử lý riêng cho nguyên nhân thực tế đã xác minh ở lượt 21:35.

## Thay đổi

- `support/student/runtime.js`: thư mục tạm riêng trên ổ dự án; kiểm tra tối thiểu 512 MiB trống và ghi 4 KiB; chuyển TEMP/TMP/TMPDIR của riêng tiến trình và tiến trình con. Không thay cấu hình hệ thống.
- Preflight mở/đóng Chrome trắng trước API setup, trừ lệnh chỉ prepare không cần browser. Kiểm tra dung lượng/quyền ghi lại trước mỗi case.
- `support/student/failure-policy.js`: driver failure, ENOSPC/quyền ghi hoặc mất session → Blocked/ENVIRONMENT_REVIEW và dừng. Fail assertion vẫn là Fail. Các case chưa đi tới giữ Not run; không tạo lỗi dây chuyền.
- Chỉ dọn thư mục `run-*` chính invocation tạo, kiểm tra đường dẫn nằm ngay dưới runtime base. Không dọn ổ C, report hay dữ liệu QA cũ.
- Report ghi `testRevision=v5-runtime-preflight`, runtime/preflight và lý do dừng. Các report cũ giữ nguyên.
- Launcher gốc và lệnh full run giữ nguyên; Watch có banner v5.

## Xác minh

- 60/60 kiểm tra framework local đạt, gồm 7 regression runtime/policy/report.
- Chrome thực mở/đóng thành công bằng `node tools/check-student-runtime.mjs`: version `155.0.8059.85`, dung lượng ổ runtime lúc kiểm tra `47875 MiB`, `stagingRequests=0`.
- Kiểm tra child process thực đọc Temp mới, khôi phục environment và chỉ dọn đúng thư mục riêng; kiểm tra không ghi đè/xóa file bên cạnh.
- Syntax checks và `git diff --check` đạt.
- Không tự chạy suite staging, đăng nhập hoặc tạo fixture trong lượt sửa này. Chưa có kết quả nghiệm thu v5.

## Người dùng chạy lại

Từ `D:\ki7\prj1`, chạy `.\QA30-Run-Report.cmd`. Đóng lượt Watch/suite cũ trước khi chạy. Đầu log phải có preflight và đường dẫn Temp dưới workspace D.

Kết quả chức năng chưa được làm xanh bằng thay kỳ vọng: 007, 011, 012 vẫn cần review theo UI/API sau lượt mới. Runtime fix không chứng minh toàn bộ case đúng hay web hết bug. Ổ C vẫn cần dung lượng cho hoạt động khác của Windows; agent không tự xóa dữ liệu để giải phóng ổ.
