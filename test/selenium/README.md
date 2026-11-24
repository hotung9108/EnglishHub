# Selenium EnglishHub — bộ chính 170 ca

Source chia theo nhóm chức năng → UC → case, khớp cách quản lý trên Qase. Vai trò là dữ liệu fixture và bộ lọc; mã test giữ nguyên. [Mục lục UC](cases/README.md).

```text
selenium/
├── cases/              Mã test thực tế theo nhóm chức năng và UC
│   ├── 01-auth-profile/uc001/ ... uc003/
│   ├── 02-users-permissions/uc004/ ... uc007/
│   ├── 03-classes-members/uc008/ ... uc010/
│   ├── 04-assignments/uc011/ ... uc014/
│   ├── 05-attempts-submissions/uc015/ ... uc023/
│   ├── 06-grading-scores/uc024/ ... uc030/
│   ├── 07-results-reports/uc031/ ... uc035/
│   └── 08-nfr/
├── common/             Helper dùng chung, không đặt ca kiểm thử ở đây
│   ├── runner/         CLI, registry, batch, báo cáo, mã băm
│   ├── ui/             Thao tác Selenium
│   ├── fixtures/       Tạo dữ liệu, journal, cleanup
│   └── flows/          Helper luồng lớp/chấm bài và support cho các UC
├── catalog/            Nội dung ca và bảng tra cứu
├── config/             Bộ nạp môi trường
├── fixtures/           Audio và tài liệu mẫu
├── integrations/qase/  Mapping 170 ID và cây UC đã sắp xếp trên Qase
├── tools/              Tra cứu, kiểm chứng và xem báo cáo
├── tests/              Kiểm thử offline của bộ chạy
├── reports/            Kết quả runtime, không commit
└── run.js              Launcher chính
```

Một thư mục UC chứa các file `.cases.js`; khi cùng UC có nhiều vai trò, tên file nêu vai trò. `.test.js` kiểm tra chính bộ chạy, dùng offline. Registry từ chối mã ca trùng. Case liên quan nhiều UC đặt tại UC đầu tiên trong catalog và giữ đủ tham chiếu; không sao chép sang nhiều thư mục. Hai ca ngoài phạm vi chỉ có metadata, không tạo procedure giả.

## Cách chạy

Node.js 22+, Chrome/Edge và WebDriver tương thích. Fixture giọng nói dùng Microsoft David Desktop trên Windows. Cài dependency bằng `npm ci` tại `test/selenium`.

```powershell
# Chỉ tra cứu/kiểm tra, không gọi staging
npm run list
npm run find -- ASG_009
npm run find -- --role=teacher --requirement=UC012
npm run check

# Thực thi trên staging: cần credential admin bootstrap qua .env hoặc biến môi trường
npm test -- ASG_009
npm run test:admin
npm run test:teacher
npm run test:student
npm test

# Chia toàn bộ thành 7 batch, tối đa 25 ca/batch
npm run test:all
node common/runner/run-batches.js --list
node common/runner/run-batches.js --resume=reports/batch-session-<timestamp>
```

`SELENIUM_ADMIN_EMAIL`, `SELENIUM_ADMIN_PASSWORD` lấy từ môi trường local, không ghi vào Git. Dùng `SELENIUM_HEADLESS=false` để quan sát trình duyệt, `SELENIUM_BROWSER=edge` để chọn Edge. Giữ nguyên credential riêng của từng vai trò; không tự hợp nhất các `.env` cũ.

`npm test` không có ID chạy đủ danh mục; không dùng nó để chỉ kiểm tra cài đặt. Lệnh chưa hỗ trợ bị từ chối trước khi tạo fixture. `test:admin/teacher/student` lọc theo vai trò fixture ban đầu; ca liên vai trò có thể đăng nhập vai trò khác trong các bước sau. Các ca chung không có fixture-role cụ thể tra trong catalog và chạy theo ID.

## Tìm lại một ca

- [case-index.csv](catalog/case-index.csv): mã, tên, yêu cầu, vai trò, file source, phạm vi, Qase ID.
- [cases.json](catalog/cases.json): nội dung gốc, expected đã rà, nguồn SRS và scope exclusion.
- `npm run find -- "tiêu đề"`: tìm theo nội dung, ID hoặc mã yêu cầu.
- Kết quả thực thi: `reports/<run-id>/<case-id>/execution.json`, ảnh PNG và evidence JSON.
- Index được sinh lại bằng `node tools/build-case-index.js`; không sửa CSV/JSON index bằng tay.
- Mục lục UC sinh bằng `node tools/build-uc-navigation.js`. `catalog/source-migration.json` ghi mã ca và đường dẫn cũ → mới.
- Các thư mục cũ `admin/teacher/student/` đã đưa khỏi khu source. Report Admin nằm trong `reports/legacy-roles/admin/`; cấu hình và fixture/trạng thái cũ nằm ở backup riêng ngoài repository. Xem [bản đồ đường dẫn](../docs/history/legacy-role-layout.md).

## Tìm và trình bày báo cáo

Mở [reports/index.html](reports/index.html) để chọn lượt chạy, tìm mã/tên case, lọc UC/chức năng, trạng thái và ngày theo giờ Việt Nam. Mỗi case có ảnh phóng to và đường dẫn tới dữ liệu thực thi gốc. Các số tổng luôn thuộc lượt đang chọn, không cộng dồn các lần chạy lại.

`npm run reports:build` cập nhật mục lục từ dữ liệu đã có, không chạy test. Runner tự cập nhật sau khi kết thúc lượt chạy và khi tạo báo cáo tổng hợp. Các summary cũ không đúng định dạng xuất hiện ở mục bỏ qua; không bị sửa hoặc đoán kết quả.

Nút **Chế độ trình bày** ẩn chi tiết kỹ thuật phụ; giữ kết quả, thời điểm và thông tin cleanup. **In / lưu PDF** in toàn bộ ca khớp bộ lọc, không chỉ 50 mục đầu. PDF là bảng kết quả, xem ảnh trực tiếp trong HTML.

Để gửi một file HTML tự chứa ảnh: `npm run reports:export -- --run=full-rerun-20261116-r6`. Có thể bỏ `--run` để chọn lượt đầy đủ mặc định. File nằm trong `reports/exports/`, giữ đủ kết quả và tối đa ảnh cuối mỗi case; không kèm file API/network thô hoặc liên kết phụ thuộc thư mục gốc. Bằng chứng đầy đủ vẫn ở từng lượt chạy gốc.

## Quy tắc diễn giải kết quả

Giữ đủ 170 ID: 168 ca có procedure, 2 ca được loại khỏi phạm vi. FAIL có thể là lỗi sản phẩm, locator, runtime hoặc dữ liệu test; đọc minh chứng trước khi tạo bug. BLOCKED không phải PASS. Không thay expected theo hành vi đang lỗi để tăng tỷ lệ PASS.

Migration chỉ đổi tổ chức source và đường dẫn, không sửa yêu cầu/test logic còn tồn đọng. Kết quả 170 ca trước migration là 116 PASS, 33 FAIL, 19 BLOCKED, 2 SKIPPED. Đây là kết quả lịch sử, không được gọi là lượt chạy mới theo mã băm sau migration.

Journal/fixture cũ được giữ nguyên trong backup riêng, không gửi kèm source. Báo cáo được di chuyển nguyên thư mục để giữ ảnh và evidence tương đối; chỉ mục báo cáo được sinh lại từ vị trí mới. Không xóa tài nguyên staging chỉ vì đã chuyển file local.

## Bộ cũ và Qase

- [Source trước migration](../archive/selenium-before-layout-20261116/README.md).
- [Biên bản và bản đồ đường dẫn](../../production_artifacts/test_reports/WORKSPACE_ORGANIZATION_2026-11-16/MIGRATION/README.md).
- [Hướng dẫn workspace](../docs/WORKSPACE.md).
- [Qase](integrations/qase/README.md): mới chuẩn bị mapping, chưa ghi ca/kết quả. ID trống chưa có nghĩa đã đồng bộ.

Không đưa `.env`, backup private, node_modules hay toàn bộ reports vào Git. Giữ bản báo cáo bàn giao chọn lọc trong `production_artifacts/test_reports/`.
