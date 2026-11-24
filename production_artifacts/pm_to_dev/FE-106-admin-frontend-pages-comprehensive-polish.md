# TÀI LIỆU ĐẶC TẢ NHIỆM VỤ (TASK SPECIFICATION)
## FE-106: Tối Ưu Hóa, Sửa Lỗi và Đồng Bộ UI/UX Toàn Bộ Module Quản Trị Viên (Admin)

> **Mục tiêu:** Rà soát, chuẩn hóa giao diện, sửa lỗi tương tác và hoàn thiện trải nghiệm người dùng (UI/UX) trên toàn bộ các trang thuộc phân hệ Quản trị viên (Admin Frontend: Dashboard, Reports, Accounts, Classes, Settings, Grading Audit Logs).  
> **Người thực hiện:** Trần Tiến Sơn (`Maloque18705` / `@tinsntrn`)  
> **QA / Tester:** Nguyễn Văn Tú (`Zawn-Tsu` / `@zawntsu`)  
> **Phạm vi tác động:** `frontend/src/pages/` (Dashboard, Accounts, AdminReports, AdminSettings, AdminGradingAuditLogs, Classes, Teachers, Students), `frontend/src/styles/admin-modern.css`, `frontend/src/locales/admin.ts`.  
> **Target Branch:** `develop`  
> **Deadline:** 22/11/2026 23:59:00 (UTC+7)  

---

## 1. TỔNG QUAN VÀ PHẠM VI NHIỆM VỤ (PROBLEM & SCOPE)

### 1.1. Hiện trạng các trang Admin
1. **Admin Reports (`/admin/reports`):**
   - Thiếu hiển thị trực quan các chỉ số KPI tổng thể (Tổng người dùng, tổng bài tập, tổng bài nộp, phổ điểm - Issue #374).
   - Khi bộ lọc thời gian không có dữ liệu bài nộp, thiếu empty state giải thích và gợi ý mở rộng khoảng ngày (Issue #375).
   - Xuất file CSV báo cáo cần đảm bảo hỗ trợ đầy đủ ký tự tiếng Việt UTF-8 BOM.
2. **Admin Accounts & Đổi Mật Khẩu (`/admin/accounts`, `/admin/profile`):**
   - Modal đổi mật khẩu Admin cần nối API thật (`/api/v1/admin/users/{id}/password`), gỡ bỏ toast ảo hoặc mock state.
   - Thao tác khóa/mở khóa tài khoản (LOCK/ACTIVE) cần hiển thị lý do khóa rõ ràng và cập nhật trạng thái bảng tức thời.
3. **Admin Settings (`/admin/settings`):**
   - Giao diện cài đặt hệ thống cần đồng bộ dữ liệu thật, loại bỏ lưu trữ tạm `localStorage`.
   - Các nút Lưu / Đặt lại (Reset) cần có trạng thái loading, disabled và phản hồi toast chuẩn.
4. **Admin Grading Audit Logs (`/admin/audit/gradings`):**
   - Cập nhật hiển thị đầy đủ các cột ngữ cảnh mới: Tên bài tập, Lớp học, Giáo viên phụ trách, Học sinh làm bài (đồng bộ với BE-89).
   - Drawer chi tiết tải mượt mà dữ liệu chấm điểm và lịch sử sửa điểm mà không phát sinh lỗi 404.
5. **Admin Classes, Teachers, Students (`/admin/classes`, `/admin/teachers`, `/admin/students`):**
   - Đồng bộ thiết kế bảng biểu (Table layout), phân trang (Pagination), thanh tìm kiếm nhanh và responsive trên các độ phân giải màn hình.
   - Thao tác đổi giáo viên phụ trách lớp và lưu trữ lớp học hoạt động mượt mà.

---

## 2. YÊU CẦU TRIỂN KHAI KỸ THUẬT CHI TIẾT

### 2.1. Chuẩn Hóa Design System & Styles
- Đồng bộ bảng màu, typography, khoảng cách (padding/margin), badge trạng thái và bo góc (rounded) theo `admin-modern.css` và design system chung của dự án.
- Tối ưu hiệu ứng hover, loading skeleton/spinner và empty state đồng nhất trên mọi trang.

### 2.2. Kiểm Tra & Xử Lý Lỗi Form / Modal
- Tất cả các form nhập liệu (Tạo lớp, Sửa hồ sơ, Đổi mật khẩu, Cài đặt) phải có validation hiển thị lỗi inline rõ ràng bằng tiếng Việt.
- Bắt lỗi API và hiển thị toast thông báo chuẩn, không để xảy ra unhandled promise rejection hoặc vỡ layout component.

### 2.3. Bổ Sung Test Coverage
- Cập nhật và bổ sung unit test Vitest cho các component Admin:
  * `AdminReports.test.tsx`
  * `AdminSettings.test.tsx`
  * `AdminGradingAuditLogs.test.tsx`
- Đảm bảo độ bao phủ test (branch coverage) đạt tiêu chuẩn >= 80%.

---

## 3. TIÊU CHUẨN HOÀN THÀNH (DEFINITION OF DONE - DoD)

1. [ ] Toàn bộ các trang Admin (Dashboard, Reports, Accounts, Classes, Settings, Audit) hoạt động ổn định 100%, không phát sinh lỗi console.
2. [ ] Nối API backend thật cho tính năng đổi mật khẩu và cài đặt hệ thống, loại bỏ triệt để mock data / local storage tạm bợ.
3. [ ] Bảng kiểm toán chấm điểm và báo cáo tổng hợp hiển thị đầy đủ thông tin ngữ cảnh, bộ lọc và xuất file chuẩn UTF-8.
4. [ ] Chạy Project Doctor (`/doctor`) và kiểm tra TypeScript (`npm run type-check`) pass 100% Quality Gates (0 Errors, 0 Warnings).
5. [ ] Bộ test suite Vitest cho phân hệ Admin đạt pass 100% và coverage >= 80%.
6. [ ] Mở Pull Request vào nhánh `develop` và Tester nghiệm thu trên Staging.
