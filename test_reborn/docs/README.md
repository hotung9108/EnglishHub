# Trung Tâm Tài Liệu Kiểm Thử (Documentation Center) — `test_reborn/`

Chào mừng bạn đến với trung tâm tài liệu kỹ thuật của framework kiểm thử chuẩn hóa **EnglishHub `test_reborn`**. 

Mọi tài liệu tại đây đều được biên soạn chặt chẽ dựa trên Single Source of Truth (**SSoT**) của dự án:
- [`01.SRS.md`](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/docs/core/01.SRS.md) — Đặc tả Yêu cầu Phần mềm (SRS v1.0).
- [`03.TP.md`](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/docs/core/03.TP.md) — Kế hoạch Kiểm thử Phần mềm gốc (Test Plan).
- [`03.QA_TESTING_ADDENDUM.md`](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/docs/supplements/03.QA_TESTING_ADDENDUM.md) — Phụ lục Hiện đại hóa QA & Kiểm thử Tự động.

---

## Danh Mục Tài Liệu Kỹ Thuật

| Tài Liệu | Mục Đích Trọng Yếu | Đối Tượng Đọc |
| :--- | :--- | :--- |
| 📖 **[EXECUTION_GUIDE.md](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/test_reborn/docs/EXECUTION_GUIDE.md)** | Hướng dẫn cài đặt, cấu hình Staging, các chế độ chạy test (Parallel, Role-based, Watch mode, Dry-run, All-run) và ý nghĩa các cờ CLI. | Tester, Developer, DevOps |
| 🔗 **[QASE_INTEGRATION_GUIDE.md](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/test_reborn/docs/QASE_INTEGRATION_GUIDE.md)** | Chi tiết kiến trúc Qase TMS Project `EAM` (Root Suite 191 với 1.018 test cases), cơ chế hoạt động của `QaseAdapter` và tự động đẩy báo cáo. | QA Lead, CI/CD Engineer |
| 🏗️ **[ARCHITECTURE_AND_EXTENDING.md](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/test_reborn/docs/ARCHITECTURE_AND_EXTENDING.md)** | Giải thích kiến trúc Page Object Model (POM), Browser Factory, hướng dẫn viết thêm test case E2E mới, thêm API collection và quy trình ghi nhận Bug. | Automation Engineer, QA Dev |
| 🛠️ **[TROUBLESHOOTING.md](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/test_reborn/docs/TROUBLESHOOTING.md)** | Cẩm nang chẩn đoán và khắc phục nhanh các lỗi thường gặp: Chrome updater named pipe, mạng Staging chập chờn, stale element, rate limits. | Mọi thành viên |
| 📋 **[test-plan.md](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/test_reborn/docs/test-plan.md)** | Kế hoạch kiểm thử tổng thể (Master Test Plan), phạm vi phân tầng Black-box, White-box, tiêu chí đánh giá Usability & Maintainability. | Hội đồng bảo vệ, PM, QA Lead |
| 📐 **[edge-cases-matrix.md](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/test_reborn/docs/edge-cases-matrix.md)** | Ma trận chi tiết 36 trường hợp biên & ngoại lệ kèm vết kiểm thử của các Bug thực tế (#205, #210, #216, #262...). | Tester, Security Tester |
| 🏛️ **[WORKSPACE.md](file:///D:/ki7/prj1/BTL_PRJ1/EnglishHub/test_reborn/docs/WORKSPACE.md)** | Quy chuẩn không gian làm việc, phân chia trách nhiệm giữa các thư mục và nguyên tắc không dùng tiền tố `QA-...`. | Toàn bộ dự án |

---

## Hướng Dẫn Nhanh Cho Người Mới Bắt Đầu

1. **Khởi động nhanh**:
   ```powershell
   # Kiểm tra tính sẵn sàng của toàn bộ 146 ca test E2E (0.3s)
   scripts\Run-Parallel.cmd --check-only
   ```
2. **Chạy song song toàn bộ E2E**:
   ```powershell
   scripts\Run-Parallel.cmd
   ```
3. **Chạy song song và đồng bộ Qase TMS**:
   ```powershell
   scripts\Run-Parallel-Qase.cmd
   ```
4. **Xem báo cáo**: Mở tệp `reports/<role>-e2e-<timestamp>/report.html` trong trình duyệt.
