# TÀI LIỆU BÀN GIAO KIỂM THỬ (FRONTEND TO TESTER HANDOFF)
## FE-106: Tối Ưu Hóa, Sửa Lỗi và Đồng Bộ UI/UX Toàn Bộ Module Quản Trị Viên (Admin)

> **Mã Thẻ Trello:** `[FE-106] Tối ưu hóa, sửa lỗi và đồng bộ UI/UX toàn bộ module Quản trị viên Admin (Dashboard, Reports, Accounts, Classes, Settings)`  
> **Người thực hiện (Assignee):** Trần Tiến Sơn (`Maloque18705` / `@tinsntrn` - `@fe-primary`)  
> **Người nghiệm thu (QA/Tester):** Nguyễn Văn Tú (`Zawn-Tsu` / `@zawntsu` - `@tester`)  
> **Technical Lead:** Hồ Việt Tùng (`hotung9108` / `@hvittung`)  
> **Nhánh phát triển:** `feat/FE-106-admin-frontend-pages-comprehensive-polish`  
> **Target Branch:** `develop`  
> **Ngày hoàn thành:** 22/11/2026  

---

## 1. TỔNG QUAN CÁC THAY ĐỔI TRIỂN KHAI

### 1.1. Phân hệ Báo cáo Thống kê Quản trị (`/admin/reports` - `AdminReports.tsx`)
1. **Bổ sung đầy đủ 7 thẻ chỉ số KPI tổng quan (Issue #374):**
   - Tổng lớp đang theo dõi (`classCount`).
   - Tỷ lệ hoàn thành bài tập trung bình (`completionRatePercent`).
   - Điểm trung bình toàn khóa (`averageScorePercent`).
   - Bài tập chờ chấm (`pendingGradingCount`).
   - Tổng người dùng hệ thống (`totals.users`).
   - Tổng bài nộp của học viên (`totalSubmissions`).
   - Tổng số bài tập đã giao trên toàn hệ thống (`overview.assignedAssignmentCount`).
2. **Khối trực quan Phổ Điểm Hệ Thống (Score Distribution - Issue #374):**
   - Phân khúc điểm rõ ràng: Xuất sắc ($\ge 85\%$), Khá - Giỏi ($70\% - 84\%$), Trung bình ($50\% - 69\%$), Cần cải thiện ($< 50\%$).
   - Thanh phân bổ màu sắc tỷ lệ phần trăm trực quan giúp Admin nắm bắt ngay chất lượng đào tạo.
3. **Empty State thông minh cho bộ lọc thời gian (Issue #375):**
   - Khi bộ lọc khoảng ngày không có lượt nộp bài, hiển thị thông điệp hướng dẫn rõ ràng kèm các nút thao tác nhanh: *\"Xem 30 ngày qua\"*, *\"Xem toàn thời gian\"*, *\"Xóa bộ lọc\"*.
4. **Xuất báo cáo CSV chuẩn tiếng Việt (UTF-8 with BOM):**
   - Tệp CSV tải về mở trực tiếp bằng Microsoft Excel không bị lỗi font tiếng Việt (`\uFEFF`).

### 1.2. Phân hệ Quản lý Tài khoản (`/admin/accounts` - `Accounts.tsx`)
1. **Nối API thật Đổi Mật Khẩu Admin (đồng bộ FE-92 / BE-78):**
   - Nối endpoint `POST /api/v1/admin/users/{id}/reset-password`.
   - Nút thao tác chìa khóa (Key icon) cho từng tài khoản.
   - Hộp thoại xác nhận 2 bước an toàn, hiển thị mật khẩu tạm thời kèm nút bấm sao chép vào clipboard 1 chạm (*\"Sao chép\"* / *\"Đã sao chép!\"*).
2. **Khóa / Mở khóa tài khoản an toàn:**
   - Modal cảnh báo hiển thị rõ ràng tác động của việc khóa tài khoản (ngăn chặn học viên đăng nhập làm bài).
   - Badge trạng thái `Bị khóa (LOCKED)` hiển thị rõ ràng kèm tooltip giải thích lý do, cập nhật giao diện bảng tức thời sau khi xác nhận.

### 1.3. Phân hệ Nhật ký Kiểm toán Chấm điểm (`/admin/audit/gradings` - `AdminGradingAuditLogs.tsx`)
1. **Làm giàu thông tin bảng dữ liệu (đồng bộ BE-89):**
   - Hiển thị đầy đủ thông tin ngữ cảnh: Tên bài tập, Tên lớp học, Giáo viên phụ trách, Học viên làm bài, Mã chấm (`GR-...`), Trạng thái (`badge`), Điểm chốt.
2. **Bộ lọc đa chiều và Tìm kiếm nhanh:**
   - Lọc theo phân đoạn trạng thái: Tất cả, Đã hoàn tất, AI Đã chấm, Chờ duyệt, Thất bại.
   - Lọc theo mức điểm: Tất cả, Đã có điểm chốt, Chưa có điểm chốt.
   - Tìm kiếm linh hoạt theo từ khóa: mã chấm, tên bài tập, tên giáo viên, tên học sinh.
3. **Drawer chi tiết và Lịch sử sửa điểm:**
   - Click vào từng dòng hiển thị Drawer thông tin bài chấm, lời phê giáo viên, nhận xét AI.
   - Bảng **Nhật Ký Các Lần Sửa Điểm (Change Logs Audit)** hiển thị đầy đủ: Người điều chỉnh, Điểm cũ, Điểm mới, Lý do / Ghi chú, Thời gian sửa.

### 1.4. Phân hệ Bảng Điều Khiển Quản Trị (`/admin/dashboard` - `Dashboard.tsx` & `admin-modern.css`)
1. **Phổ điểm chi tiết theo lớp học (Histogram Bento)**:
   - Sắp xếp nhãn phân tầng và dải điểm thành 2 dòng dọc gọn gàng (`Xuất sắc` + `≥80%`, `Khá giỏi` + `65–79%`, `Tiêu chuẩn` + `50–64%`, `Cần chú ý` + `<50%`). Loại bỏ hoàn toàn lỗi tràn chữ ra khỏi cột.
   - Thẻ hiển thị cao 195px chuẩn xác, cân bằng tuyệt đối với thẻ So sánh hiệu suất bên trái.
2. **Format Vòm đo tốc độ 180° (Executive Cockpit Speedometer Gauge)**:
   - Thay thế graph tròn bằng Vòm đo bán nguyệt kép: Vòm ngoài màu Hổ phách (Tỷ lệ hoàn thành $R=108$), vòm trong màu Ngọc lục bảo (Điểm trung bình $R=90$).
   - Ray trượt nền bán trong suốt trang nhã ở cả Dark và Light mode, không bị vệt đen.
   - Bỏ dòng tiêu đề phụ lặp lại giúp khung nhìn rộng rãi, tinh giản và thanh lịch.
3. **Bảng Tiến độ lớp học trọng điểm**:
   - Căn giữa các cột số liệu `BÀI TẬP`, `ĐIỂM TB`. Thanh tiến độ `HOÀN THÀNH` hiển thị rõ ray nền và phần trăm.
   - Nút `Xem tất cả lớp >` cố định góc trên cùng bên phải không bị gãy dòng.

### 1.5. Gỡ bỏ trang Cài đặt toàn cục theo yêu cầu sản phẩm
- Gỡ bỏ hoàn toàn route `/admin/settings`, chuyển hướng tự động về `/admin`.
- Gỡ bỏ mục "Cài đặt hệ thống" trên Sidebar.

---

## 2. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG & QUALITY GATES

1. **Bộ Test Suite Vitest Phân hệ Admin:**
   - `Accounts.test.tsx`: **4/4 passed (100%)**
   - `AdminReports.test.tsx`: **34/34 passed (100%)**
   - `AdminReportsCsvExport.test.tsx`: **1/1 passed (100%)**
   - `AdminSettings.test.tsx`: **35/35 passed (100%)**
   - `AdminGradingAuditLogs.test.tsx`: **8/8 passed (100%)**
   - **Tổng cộng: 82/82 tests pass 100%**.
2. **ESLint & TypeScript Build:**
   - `npx eslint`: **0 errors, 0 warnings**.
   - `npm run build` (`tsc -b && vite build`): **Biên dịch thành công (exit code 0)**.

---

## 3. HƯỚNG DẪN KIỂM THỬ TRÊN MÔI TRƯỜNG STAGING CHO QA

### Kịch bản 1: Kiểm tra Báo cáo Thống kê (`/admin/reports`)
1. Đăng nhập với tài khoản Admin (`admin@englishhub.com` / `Admin123!`).
2. Điều hướng đến menu **Báo cáo Thống kê**.
3. Xác nhận hiển thị đầy đủ các thẻ KPI: Tổng người dùng, Tổng bài nộp, Tổng bài tập đã giao.
4. Xác nhận khối **Phổ Điểm Thống Kê Theo Lớp Học** hiển thị đầy đủ 4 dải điểm và thanh progress bar phân bổ.
5. Chọn khoảng ngày tương lai (không có bài nộp), xác nhận Empty State hiển thị và bấm *\"Xem 30 ngày qua\"* hoặc *\"Xem toàn thời gian\"* tự động khôi phục dữ liệu.
6. Bấm nút *\"Xuất báo cáo (CSV)\"*, mở file tải về bằng Excel và kiểm tra ký tự tiếng Việt hiển thị chính xác.

### Kịch bản 2: Kiểm tra Đổi Mật Khẩu & Khóa Tài Khoản (`/admin/accounts`)
1. Truy cập trang **Quản lý Tài khoản**.
2. Bấm vào icon chìa khóa (Đổi mật khẩu) của một tài khoản bất kỳ.
3. Bấm xác nhận, kiểm tra popup hiển thị mật khẩu tạm thời mới và bấm nút *\"Sao chép\"*.
4. Bấm icon Khóa tài khoản, xác nhận hộp thoại cảnh báo và kiểm tra tài khoản đổi sang trạng thái `Bị khóa (LOCKED)`.

### Kịch bản 3: Kiểm tra Nhật ký Kiểm toán Chấm điểm (`/admin/audit/gradings`)
1. Truy cập trang **Lịch Sử Chấm Điểm**.
2. Kiểm tra bảng hiển thị đầy đủ các cột: Mã chấm, Bài tập & Lớp học, Giáo viên, Học viên, Trạng thái, Điểm chốt.
3. Lọc theo trạng thái (*\"AI Đã chấm\"*, *\"Đã hoàn tất\"*) và lọc theo mức điểm (*\"Đã có điểm chốt\"*).
4. Click vào một dòng bài chấm, kiểm tra Drawer mở mượt mà hiển thị lời phê và lịch sử các lần sửa điểm.
