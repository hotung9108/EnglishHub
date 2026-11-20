# Kiểm thử thủ công và khám phá UI/UX

Giữ các tình huống cần người quan sát, kiểm tra giao diện và phát hiện vấn đề ngoài kịch bản tự động tại đây. Bộ Selenium 170 ca vẫn ở [selenium](../selenium/README.md).

| Thư mục | Nội dung |
|---|---|
| `qase/manual_test_cases.json` | Danh sách case cũ, cần rà lại theo đặc tả đã chốt trước khi sử dụng |
| `scenarios/` | Script hỗ trợ khám phá theo vai trò: khách, học viên, giáo viên, quản trị |
| `config/`, `lib/` | Cấu hình và thư viện của công cụ audit |
| `reports/` | Báo cáo lịch sử, giữ nguyên nội dung gốc |
| `screenshots/` | Ảnh minh chứng lịch sử |
| `qase/` | Dữ liệu và cấu hình Qase cũ để tham khảo |

Các script audit dùng Selenium hỗ trợ quan sát; chúng không thay thế toàn bộ kiểm thử thủ công. Những nhận định PASS, lỗi và liên kết Qase trong báo cáo cũ chưa được xác minh lại trong lần chuyển thư mục này. Liên kết đường dẫn cũ trong báo cáo lịch sử có thể cần mở theo vị trí mới ở bảng trên.

## Sử dụng

Tại `test/manual/`, chạy `npm install` khi thiết lập máy mới. Máy hiện tại dùng junction `node_modules` tới `../selenium/node_modules` (cùng phiên bản Selenium đã khai báo). Không đưa junction lên Git.

`npm run audit` mở trình duyệt và chạy tương tác thật; các lệnh `audit:auth`, `audit:student`, `audit:teacher`, `audit:admin` giới hạn vai trò. Đọc kịch bản trước khi chạy, cấu hình tài khoản thử riêng qua biến môi trường trong `config/manual_config.js` và ghi nhận dữ liệu cần dọn sau chạy. Không dùng kết quả lịch sử để khẳng định staging hiện tại còn lỗi.

Không còn tài khoản/mật khẩu mặc định. Thiết lập `SELENIUM_<ROLE>_EMAIL` và `SELENIUM_<ROLE>_PASSWORD` qua biến môi trường trước khi chạy; `audit:auth` cần tài khoản Student riêng. Thiếu cấu hình sẽ dừng trước khi khởi tạo browser. Không ghi credential vào file source hoặc nội dung case trên Qase. Script Qase governance một lần của bộ cũ đã đưa ra backup, không nằm trong bộ chia sẻ.

## Lịch sử chuyển thư mục

Ngày 2026-11-17: chuyển toàn bộ `test_manual/` về `test/manual/`; giữ 51 tệp nguồn, dữ liệu và minh chứng. Bản sao trước thay đổi cùng SHA-256 từng tệp nằm tại `D:/ki7/prj1-archive/manual-before-move-20261117/`. Đã sửa launcher và đường dẫn cho báo cáo sinh trong tương lai; báo cáo lịch sử giữ nguyên. Không chạy staging hoặc đồng bộ Qase trong đợt chuyển này.
