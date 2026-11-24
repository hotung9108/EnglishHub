# Kiểm thử EnglishHub — bắt đầu ở đây

Bộ chính ở **test/**. Selenium chia nhóm chức năng → UC → case, giữ 170 mã và mapping Qase. Test Reborn đã chuyển thành archive, không chạy như bộ chính thứ hai.

## Bạn muốn làm gì?

Thành viên mới bắt đầu ở [hướng dẫn cài và chạy](docs/TEAM_SETUP.md).

| Việc cần làm | Mở ở đâu |
|---|---|
| Tìm case theo UC/chức năng | [Mục lục Selenium](selenium/cases/README.md) |
| Tìm mã case và Qase ID | [Chỉ mục 170 ca](selenium/catalog/case-index.csv) |
| Chạy Selenium và cấu hình staging | [Hướng dẫn chạy](selenium/README.md) |
| Tận dụng tình huống từ bộ cũ | [Danh sách chờ rà](docs/review/README.md) |
| Tìm collection API | [Catalog API](api/README.md) |
| Kiểm thử thủ công và khám phá UI/UX | [Manual](manual/README.md) |
| Viết báo cáo lỗi | [Mẫu bug](docs/templates/BUG_REPORT_TEMPLATE.md) |
| Kết quả từng lượt chạy | selenium/reports/<run-id>/ |
| Tìm, lọc và trình bày báo cáo | [Trang báo cáo](selenium/reports/index.html) |
| Tra mọi báo cáo API/manual/Qase/lịch sử | [Kho báo cáo chung](reports/index.html) |
| Báo cáo bàn giao | [production_artifacts/test_reports](../production_artifacts/test_reports/) |
| Source và minh chứng lịch sử | [Archive](archive/README.md) |

## Lệnh tìm kiếm và kiểm tra offline

Mở terminal tại test/:

~~~powershell
npm run find -- ASG_009
npm run find -- UC012
npm run find -- --role=teacher
npm run find -- --scope=api
npm run find -- --scope=legacy "mật khẩu"
npm run find -- --scope=bugs ADM-048
npm run find -- --scope=edges UC12
npm run selenium:check
npm run api:check
npm run reports:build
~~~

Các lệnh trên chỉ đọc/kiểm tra local. API nhập từ bộ cũ là NEEDS_REVIEW; api:check không gửi request và không chứng nhận nghiệp vụ.

## Chạy trên staging

Tại test/selenium, **npm test -- ASG_009** chạy một case; **npm test** chạy toàn bộ. Chạy thật tạo fixture trên staging và cần tài khoản riêng; xem README Selenium trước khi chạy. Đợt hợp nhất này không chạy staging hoặc ghi Qase.

## Bản đồ thư mục

~~~text
test/
├── selenium/       cases theo UC, catalog, common, config, fixtures, integrations
├── api/            catalog và collection chờ rà
├── manual/         kịch bản thủ công và khám phá UI
├── reports/        mục lục report, lịch sử và TSR
├── performance/    hướng dẫn công cụ tải, chưa có suite tự động
├── tools/          công cụ NFR cài local
├── config/         cấu hình và kiểm tra môi trường cũ còn dùng
├── docs/           hướng dẫn, review, mẫu bug
├── fixtures/       dữ liệu mẫu dùng chung
├── scripts/        launcher và tìm kiếm
└── archive/        source lịch sử, không phải bộ chạy chính
~~~

Các scaffold `black-box/`, `white-box/`, `e2e/` và helper chỉ phục vụ chúng đã chuyển ra backup ngoài repository. Bộ chính là `selenium/`, API ở `api/`, manual ở `manual/`; dữ liệu bug lịch sử ở `bugs/imports/`. Xem [phạm vi kiểm thử](docs/testing-scope.md).

[Biên bản dọn và cách khôi phục](../production_artifacts/test_reports/TEST_CLEANUP_2026-11-17/README.md). Report lịch sử, fixture và mapping Qase được giữ nguyên.

[Biên bản hợp nhất](../production_artifacts/test_reports/TEST_REBORN_CONSOLIDATION_2026-11-17/README.md).
