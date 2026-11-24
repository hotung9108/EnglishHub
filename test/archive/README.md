# Source kiểm thử lịch sử

Không dùng archive làm bộ chạy chính. Điểm bắt đầu hiện hành: [test/README.md](../README.md).

- `selenium-before-layout-20261116/`: source Selenium trước khi tổ chức lại, lưu local; chỉ README chỉ dẫn được đưa vào Git vì một số script audit cũ chứa cấu hình tài khoản mặc định.
- `selenium-batch1-reports-20261117/`: báo cáo cũ còn sót từ thư mục `selenium/batch1`, đã chuyển nguyên trạng và kiểm tra hash; không có code test hiện hành.
- `test-reborn-20261117/`: toàn bộ Test Reborn cũ, gồm 110 thư mục bug, báo cáo và dữ liệu local. Có `.env`/fixture lịch sử; được bỏ qua bởi Git. Không chia sẻ nguyên thư mục.

Phần hữu ích đã được lập mục lục tại [review](../docs/review/README.md), API tại [api](../api/README.md). Script lịch sử có thể còn đường dẫn cũ; không chạy trực tiếp sau khi di chuyển. Việc giữ archive không đồng nghĩa mọi case/bug bên trong còn đúng.
