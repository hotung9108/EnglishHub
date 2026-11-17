# Lịch sử báo cáo và Qase

Snapshot kiểm tra ngày 17/11/2026, không phải kết quả chạy mới.

- [qase-runs.json](qase-runs.json): 8 Test Run hiện có trên Qase EAM; hai run 27 và 29 còn In Progress. Lượt R6 của bộ 170 ca chưa được gửi thành run mới trên Qase.
- Báo cáo API local: `test/api/staging/**/reports/` và `test/archive/test-reborn-20261117/reports/api/`. Đã sao lưu 275 file đầy đủ tại `D:/ki7/prj1/backups/tester-readiness-20261117/api-report-history.zip`, có SHA256 đối chiếu. Số file không phải số lần chạy API khác nhau.
- Metadata 8 run và 46 bản ghi result tìm được qua QQL được giữ trong backup riêng nói trên. **Chưa phải backup đầy đủ toàn bộ kết quả và attachment Qase**: số result xuất từ tìm kiếm thấp hơn thống kê run; không dùng để khẳng định có thể khôi phục mọi lịch sử.
- Báo cáo Selenium có mục lục riêng tại `test/selenium/reports/index.html`. Trang này không tự bao gồm toàn bộ báo cáo API hay Test Run Qase.

Báo cáo thô, archive và backup chứa dữ liệu thực thi local nên bị Git bỏ qua. Up source lên Git không đồng nghĩa đã sao lưu các file này lên Git hoặc đám mây.
