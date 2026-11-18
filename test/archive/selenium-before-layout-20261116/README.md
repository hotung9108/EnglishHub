# Source Selenium trước khi đổi cấu trúc — 16/11/2026

Đây là bản lưu trữ để đối chiếu, không phải bộ chạy hiện hành.
Bộ chính ở [test/selenium](../../selenium/README.md).

Source cũ giữ tương quan đường dẫn để đọc lại. Phụ thuộc, credential, runtime cache và reports không được gom vào Git cùng archive này.
Không chạy trực tiếp launcher trong archive: khôi phục ZIP private về một thư mục Selenium độc lập, cài dependency theo package-lock và cung cấp môi trường staging phù hợp khi cần tái hiện phiên bản cũ.

Bản sao lưu đầy đủ source/cấu hình/trạng thái nằm ngoài repository:
`D:/ki7/prj1/backups/selenium-before-layout-20261116-232744/selenium-old-source-private.zip`.
ZIP có credential local; không commit hoặc đăng công khai. Xem BACKUP.json và source-manifest.json tại cùng thư mục để kiểm tra tính toàn vẹn.

Báo cáo lịch sử tại `test/selenium/admin/reports/` đã chuyển nguyên trạng vào `test/selenium/reports/legacy-roles/admin/`; phần còn lại nằm tại `test/selenium/reports/`. Xem [bản đồ đường dẫn](../../docs/history/legacy-role-layout.md). Chỉ README này được chia sẻ qua Git; source archive chi tiết giữ local trong backup.
[Danh sách đường dẫn trước/sau](../../../production_artifacts/test_reports/WORKSPACE_ORGANIZATION_2026-11-16/MIGRATION/archived-paths.json).
