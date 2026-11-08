# Hướng Dẫn Thực Thi Kiểm Thử Chi Tiết (Execution Guide)

Tài liệu này cung cấp hướng dẫn đầy đủ từ A-Z để cài đặt, cấu hình và vận hành toàn bộ các bộ kiểm thử tự động trong framework [`test_reborn`](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/test_reborn).

---

## 1. Yêu Cầu Môi Trường (Prerequisites)

- **Hệ điều hành**: Windows 10/11, macOS, hoặc Linux Ubuntu 20.04+.
- **Node.js**: Phiên bản `>= 18.0.0` (Khuyến nghị Node.js v20 LTS hoặc v22).
- **Trình duyệt**: Google Chrome bản mới nhất (ChromeDriver được Selenium WebDriver tự động quản lý qua Selenium Manager).
- **Postman / Newman**: Đã tích hợp sẵn qua npm package trong repo.
- **Git**: Dùng để quản lý mã nguồn và vết commit kiểm thử.

---

## 2. Cấu Hình Môi Trường (Environment Configuration)

Tất cả các bộ kiểm thử trong `test_reborn` đều được chuẩn hóa chạy trên môi trường **Staging** chính thức của dự án:
- **Frontend Staging**: `https://staging.hotung9108.me`
- **Backend API Staging**: `https://api-staging.hotung9108.me/api/v1`

Tệp cấu hình biến môi trường nằm tại [`common/config/.env`](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/test_reborn/common/config/.env):

```env
# Môi trường thực thi
TEST_ENV=staging
BASE_URL=https://staging.hotung9108.me
API_BASE_URL=https://api-staging.hotung9108.me/api/v1

# Tài khoản mặc định cho từng vai trò
ADMIN_USERNAME=admin@eh.com
ADMIN_PASSWORD=Password@123
TEACHER_USERNAME=teacher@eh.com
TEACHER_PASSWORD=Password@123
STUDENT_USERNAME=student@eh.com
STUDENT_PASSWORD=Password@123

# Cấu hình Qase TMS
QASE_PROJECT_CODE=EAM
QASE_API_TOKEN=5357cc1d83bbcd98ad4a81683f0fec9c23a7102cf1f2986c7b5ea28734d3eaf8
QASE_DEMO_ROOT_SUITE=191

# Cấu hình Trình duyệt & Usability
HEADLESS=true
BROWSER_WIDTH=1440
BROWSER_HEIGHT=900
IMAGES_ENABLED=true       # BẮT BUỘC BẬT: Đảm bảo kiểm thử Usability USA-01..USA-06
DISABLE_ANIMATIONS=false   # BẮT BUỘC TẮT: Giữ nguyên hiệu ứng chuyển cảnh của giao diện
```

---

## 3. Các Chế Độ Chạy Kiểm Thử (Execution Modes)

Thư mục [`scripts/`](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/test_reborn/scripts) cung cấp sẵn 11 tệp lệnh `.cmd` độc lập phục vụ mọi nhu cầu kiểm thử:

### 3.1. Kiểm Tra Nhanh Tĩnh (Dry-run & Check-only)
Dùng trước khi commit hoặc trước khi chạy regression dài để đảm bảo toàn bộ tệp kiểm thử không có lỗi cú pháp hoặc thiếu dependencies:

```powershell
# Kiểm tra nhanh toàn bộ 8 bộ API (chạy tĩnh chỉ mất ~0.2s)
scripts\Api-Parallel.cmd --dry-run

# Kiểm tra tính sẵn sàng của toàn bộ 146 ca kiểm thử E2E (chỉ mất ~0.3s)
scripts\Run-Parallel.cmd --check-only
```

---

### 3.2. Chạy Kiểm Thử Đa Luồng Song Song Tối Ưu (Parallel E2E)
Động cơ [`run-parallel.js`](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/test_reborn/black-box/e2e/run-parallel.js) sẽ khởi tạo **3 tiến trình Chrome độc lập** cho 3 vai trò cùng một lúc:
- Tiến trình 1: Quản trị viên (**Admin** - 50 cases)
- Tiến trình 2: Giáo viên (**Teacher** - 51 cases)
- Tiến trình 3: Học viên (**Student** - 45 cases)

```powershell
# Chạy song song không đồng bộ Qase (xuất báo cáo HTML nội bộ)
scripts\Run-Parallel.cmd

# Chạy song song và TỰ ĐỘNG ĐỒNG BỘ KẾT QUẢ lên Qase TMS
scripts\Run-Parallel-Qase.cmd
```

> [!TIP]
> Chạy song song 3 vai trò giúp rút ngắn **65% thời gian thực thi** so với việc chạy tuần tự từng vai trò!

---

### 3.3. Chạy Riêng Lẻ Theo Từng Vai Trò (Role-based Runners)
Khi đang phát triển hoặc debug kịch bản cho một vai trò cụ thể:

| Vai Trò | Chế Độ Headless (Nhanh) | Chế Độ Mở Trình Duyệt (Quan Sát UI) |
| :--- | :--- | :--- |
| **Quản trị viên** | `scripts\Admin-Run.cmd` | `scripts\Admin-Watch.cmd` |
| **Giáo viên** | `scripts\Teacher-Run.cmd` | `scripts\Teacher-Watch.cmd` |
| **Học viên** | `scripts\Student-Run.cmd` | `scripts\Student-Watch.cmd` |

---

### 3.4. Chạy Kiểm Thử API (Newman / Postman)
Kiểm thử toàn diện 8 bộ API với 683 test cases (bao gồm cả 124 ca nộp bài BE18):

```powershell
# Chạy tuần tự 8 bộ API
scripts\Api-Run.cmd

# Chạy đa luồng song song 8 bộ API
scripts\Api-Parallel.cmd
```

---

### 3.5. Chạy Tổng Lực Toàn Bộ (Full Regression)
Chạy toàn bộ cả 8 bộ API và 146 ca E2E song song:

```powershell
scripts\All-Run.cmd
```

---

## 4. Các Cờ Lệnh CLI Hữu Ích (Command Line Options)

Bạn có thể truyền trực tiếp các tham số sau vào các runner:

| Cờ Lệnh | Tác Dụng | Ví Dụ Sử Dụng |
| :--- | :--- | :--- |
| `--check-only` | Kiểm tra cú pháp và danh sách ca test, không bật trình duyệt | `node black-box/e2e/run-parallel.js --check-only` |
| `--dry-run` | Kiểm tra định dạng dữ liệu cho runner API | `node black-box/api/run.cjs --dry-run` |
| `--headed` | Bật cửa sổ Chrome hiển thị trực quan (Watch mode) | `node black-box/e2e/admin/run.js --headed` |
| `--case <ID>` | Chỉ chạy duy nhất 1 test case cụ thể | `node black-box/e2e/admin/run.js --case ADM-003` |
| `--grep <keyword>`| Lọc các ca kiểm thử theo từ khóa trong tiêu đề | `node black-box/e2e/teacher/run.js --grep "chấm điểm"` |
| `--sync-qase` | Đẩy kết quả kiểm thử trực tiếp lên Qase TMS | `node black-box/e2e/run-parallel.js --sync-qase` |

---

## 5. Báo Cáo & Vết Bằng Chứng (Reports & Evidences)

Sau mỗi lượt chạy kiểm thử, hệ thống sẽ tự động tạo thư mục báo cáo tại `reports/<role>-e2e-<timestamp>/`:

- **`report.html`**: Báo cáo giao diện trực quan hiển thị tỷ lệ Pass/Fail, thời gian thực thi từng case.
- **`summary.json`**: Tóm tắt kết quả dưới dạng JSON cho CI/CD.
- **`junit.xml`**: Định dạng JUnit chuẩn dùng để tích hợp vào Jenkins, GitHub Actions hoặc GitLab CI.
- **`<TEST_ID>.png`**: Ảnh chụp màn hình tại thời điểm ca kiểm thử thất bại.
- **`<TEST_ID>.html`**: Bản dump DOM giao diện HTML để phục vụ debug chính xác nguyên nhân lỗi.
- **`TRIAGE.md`**: Bản phân tích phân loại lỗi tự động cho từng ca thất bại.

Nếu ca kiểm thử phát hiện lỗi nghiêm trọng, hệ thống tự động ghi nhật ký vào thư mục [`bugs/active/`](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/test_reborn/bugs/active/).
