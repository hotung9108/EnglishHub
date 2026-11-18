# Hướng dẫn workspace kiểm thử EnglishHub

- Thành viên mới: [cài dependency và cấu hình riêng](TEAM_SETUP.md).

- Bộ Selenium chính: [selenium/README.md](../selenium/README.md).
- Mục lục nhóm chức năng → UC → case: [cases/README.md](../selenium/cases/README.md).
- Tra 170 ca: [case-index.csv](../selenium/catalog/case-index.csv).
- Nội dung và yêu cầu: [cases.json](../selenium/catalog/cases.json).
- Source cũ: [archive](../archive/selenium-before-layout-20261116/README.md).
- Báo cáo gần nhất trước migration: [R6](../../production_artifacts/test_reports/FULL_RERUN_2026-11-16_R6/BAO_CAO.html).
- Biên bản chuyển thư mục: [migration](../../production_artifacts/test_reports/WORKSPACE_ORGANIZATION_2026-11-16/MIGRATION/README.md).

Mở terminal tại `test/selenium`. Dùng `npm run find -- ASG_009` để tìm file; `npm test -- ASG_009` để thực thi ca.
`npm run list`, `npm run find` và `npm run check` không chạy staging. `npm test` và `npm run test:all` tạo fixture trên staging.
API, performance, manual và các bộ kiểm thử khác giữ nguyên phạm vi của chúng; không coi dữ liệu lịch sử là kết quả chạy mới.

- Kiểm thử thủ công và khám phá UI/UX: [manual/README.md](../manual/README.md). Báo cáo cũ giữ làm lịch sử, cần xác minh lại trước khi kết luận.

- Kho báo cáo toàn dự án và kế hoạch khôi phục: [test/reports](../reports/README.md).

- Scaffold không kiểm thử thực tế và script dùng một lần đã được backup: [biên bản dọn](../../production_artifacts/test_reports/TEST_CLEANUP_2026-11-17/README.md). Xem [phạm vi bộ chính](testing-scope.md).
