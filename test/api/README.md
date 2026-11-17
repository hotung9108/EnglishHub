# Catalog API EnglishHub

Đã nhận 8 collection từ Test Reborn vào review/<suite-id>/collection.json, tổng 623 request (đếm đệ quy). Đây không phải 623 test case được duyệt.

Tất cả đang **NEEDS_REVIEW**. Chưa bật chạy collection hoặc ghi Qase. Environment cũ và runner có credential mặc định không được nhập vào bộ hiện hành; nguyên gốc vẫn trong archive riêng.

Ví dụ mật khẩu seed trong bản review dùng `{{qaFixturePassword}}`; script tạo fixture mới có mật khẩu giả riêng, không dùng mật khẩu tài khoản local. Cần review dữ liệu seed, biến môi trường và luồng đổi/khôi phục mật khẩu trước khi chạy collection, không coi `api:check` là xác nhận các tình huống đó đã được thực thi.

Từ test/: **npm run api:list**, **npm run api:check**, **npm run find -- --scope=api**. Lọc suite: **node api/catalog.js --check --suite=teacher-assignment**. Không nạp .env hay gửi request.

Trước khi duyệt: kiểm UC theo Group-04, request/expected/assertion, dữ liệu và cleanup riêng, so với API test có sẵn, cập nhật mapping Qase thật. Không tái dùng suite ID cũ mặc định.

Test mẫu `dev/auth-api.test.js`, `staging/auth-api.test.js` và `../black-box/api/` đã đưa ra backup: chúng chấp nhận cả lỗi kết nối (`status = 0`), không đủ làm bằng chứng API đạt. Collection và report thật trong `collections/`, `staging/`, `suites/` vẫn giữ nguyên.

[Report lịch sử theo suite](../../production_artifacts/test_reports/API_SUITE_HISTORY_2026-11-17/index.html) · [TSR API](../../production_artifacts/test_reports/TSR_API_2026-11-17/TSR_API.html).
