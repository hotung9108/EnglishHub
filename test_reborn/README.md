# Test Reborn — đã lưu trữ

Bộ kiểm thử chính hiện ở [test/README.md](../test/README.md). Selenium quản lý theo nhóm chức năng → UC → case; không chạy framework Reborn như một bộ chính thứ hai.

- [Mục lục UC Selenium](../test/selenium/cases/README.md).
- [Catalog API chờ rà](../test/api/README.md).
- [Tình huống và bằng chứng cũ cần rà](../test/docs/review/README.md).
- [Biên bản hợp nhất](../production_artifacts/test_reports/TEST_REBORN_CONSOLIDATION_2026-11-17/README.md).

Toàn bộ source và dữ liệu runtime cũ giữ tại `test/archive/test-reborn-20261117/`, không đưa archive chứa credential/bằng chứng thô lên Git. Backup riêng: `D:/ki7/prj1/backups/test-reborn-before-consolidation-20261117/test-reborn-full.zip` (519 file, không gồm junction node_modules).

Archive giữ nguyên nội dung lịch sử; đường dẫn hardcode trong script cũ có thể không còn phù hợp sau chuyển. Không chạy launcher cũ tại archive để ghi staging/Qase. Nếu cần khôi phục, dùng backup về vị trí cũ, kiểm cấu hình và dependency trước.
