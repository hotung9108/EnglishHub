# EnglishHub Test Reborn Framework

Framework kiểm thử chuẩn hóa cho dự án **EnglishHub**, được thiết kế dựa trên:
- **Source of Truth**: [`docs/core/01.SRS.md`](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/docs/core/01.SRS.md) & [`docs/core/03.TP.md`](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/docs/core/03.TP.md).
- **Qase TMS**: Project `EAM` (845 cases, 78 suites).
- **Quy chuẩn tổ chức**: Cấp 1 phân theo phương pháp kiểm thử, bên trong phân theo 4 nhánh vai trò người dùng (**Admin**, **Teacher**, **Student**, và **Common** dùng chung). Tuyệt đối không dùng tiền tố `QA-...`.
- **Bảo toàn NFR Usability & Maintainability**: Giữ nguyên hiển thị hình ảnh (`imagesEnabled=true`), không tắt hiệu ứng chuyển cảnh (transitions/animations), tối ưu thực thi đa luồng song song.

---

## 1. Cấu trúc Thư mục

```text
test_reborn/
├── black-box/                # KIỂM THỬ HỘP ĐEN
│   ├── api/                  # 8 Suites API phân theo vai trò (Admin, Teacher, Student, Common)
│   └── e2e/                  # 146 ca kiểm thử Selenium UI phân theo vai trò (Admin, Teacher, Student)
│       ├── run-parallel.js   # Động cơ chạy song song 3 vai trò cùng lúc (rút ngắn 65% thời gian)
│       ├── admin/            # 50 cases ADM-001..ADM-050 + Page Objects & Support
│       ├── teacher/          # 51 cases TEA-001..TEA-051 + Page Objects & Support
│       ├── student/          # 45 cases STU-001..STU-045 + Page Objects & Support
│       └── common/           # LoginPage, BasePage, browser-factory, reporters
├── white-box/                # KIỂM THỬ HỘP TRẮNG
│   ├── whitebox-strategy.md  # Chiến lược kiểm thử hộp trắng chi tiết
│   ├── backend/              # Bộ ca kiểm thử hộp trắng chi tiết cho Backend Services
│   ├── frontend/             # Unit tests Vitest cho Auth Service và Form Validators
│   ├── ai-service/           # Pytest kịch bản kiểm thử cho AI Evaluation Service
│   └── traceability-matrix.md# Bảng đối soát độ bao phủ mã nguồn
├── performance/              # KIỂM THỬ HIỆU NĂNG / TẢI
│   └── scenarios/            # Kịch bản k6 cho Auth login load và Submission burst load
├── bugs/                     # TRUNG TÂM QUẢN LÝ BUG
│   ├── active/               # Bug đang mở kèm tài liệu mô tả và thư mục evidence (ảnh/log/script)
│   ├── resolved/             # Bug đã nghiệm thu thành công
│   ├── references/           # Bảng tổng hợp lịch sử lỗi Bug_List_DB_Review.xlsx
│   └── templates/            # Mẫu báo cáo bug chuẩn BUG_REPORT_TEMPLATE.md
├── common/                   # TIỆN ÍCH DÙNG CHUNG
│   ├── config/               # Biến môi trường .env và env.js
│   ├── constants/            # Định nghĩa hằng số roles.js và routes.js
│   ├── fixtures/             # File mẫu kiểm thử (PDF, TXT, testdata users)
│   └── support/              # QaseAdapter kết nối live với Qase TMS
├── scripts/                  # 11 FILE LAUNCHER (.CMD) ĐỘC LẬP TẬP TRUNG
│   ├── Run-Parallel.cmd      # [TỐI ƯU NHẤT] Chạy đa luồng song song Admin + Teacher + Student
│   ├── Run-Parallel-Qase.cmd # Chạy song song và tự động đồng bộ kết quả + ảnh lỗi lên Qase TMS
│   ├── Admin-Run.cmd / Admin-Watch.cmd
│   ├── Teacher-Run.cmd / Teacher-Watch.cmd
│   ├── Student-Run.cmd / Student-Watch.cmd
│   ├── Api-Run.cmd / Api-Parallel.cmd
│   └── All-Run.cmd
└── docs/                     # TÀI LIỆU QUY CHUẨN & MA TRẬN TRƯỜNG HỢP BIÊN
    ├── test-plan.md          # Kế hoạch kiểm thử tổng thể (Master Test Plan)
    ├── WORKSPACE.md          # Quy chuẩn tổ chức không gian làm việc
    └── edge-cases-matrix.md  # Ma trận 36 trường hợp biên & ngoại lệ chi tiết
```

---

## 2. Hướng dẫn Thực thi

### Kiểm tra nhanh (Check-only & Dry-run)
```powershell
# Chạy kiểm tra tĩnh toàn bộ 8 bộ API
scripts\Api-Parallel.cmd --dry-run

# Chạy kiểm tra tính sẵn sàng song song cả 146 ca kiểm thử E2E (0.28s)
scripts\Run-Parallel.cmd --check-only
```

### Chạy kiểm thử tự động
- **Chạy đa luồng tối ưu nhất**: `scripts\Run-Parallel.cmd` (Admin, Teacher, Student chạy song song trên 3 cửa sổ Chrome độc lập).
- **Chạy song song và đồng bộ Qase TMS**: `scripts\Run-Parallel-Qase.cmd`.
- **Chạy riêng từng vai trò**:
  - Admin: `scripts\Admin-Run.cmd` (Headless) hoặc `scripts\Admin-Watch.cmd` (Mở Chrome quan sát).
  - Giáo viên: `scripts\Teacher-Run.cmd` hoặc `scripts\Teacher-Watch.cmd`.
  - Học viên: `scripts\Student-Run.cmd` hoặc `scripts\Student-Watch.cmd`.
- **Chạy toàn diện cả API và UI**: `scripts\All-Run.cmd`.
