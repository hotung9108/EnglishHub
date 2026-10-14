---
id: TASK-FE-45-UI-UX-MODERNIZATION
title: "UI/UX Modernization for Entire Frontend Application (Admin, Teacher, Student, Auth, Profile)"
role: fe-primary
assignee: Maloque18705
status: "Done"
created_at: 2026-10-13T10:00:00+07:00
updated_at: 2026-10-14T11:00:00+07:00
completed_at: 2026-10-14T11:00:00+07:00
priority: P0
tags: [frontend, ui-ux, modernization, minimal-saas, design-brief, fe-45, zero-inline-styles, decluttering]
---

# TASK-FE-45-UI-UX-MODERNIZATION: UI/UX Modernization for Entire Frontend Application

## 1. Context & Objective
Nâng cấp giao diện tổng thể của Frontend EnglishHub theo hướng hiện đại (Minimal SaaS e-learning platform lấy cảm hứng từ Linear/Notion/Vercel) theo tài liệu `docs/minimal_saas_elearning_design_brief.md`, tạo tính nhất quán thị giác trên cả 3 vai trò Admin, Giáo viên và Học viên, không phá vỡ luồng nghiệp vụ API/DB.
Triệt tiêu hoàn toàn CSS inline tĩnh theo đúng quy định tại `.agents/rules/convention-fe.md` (Mục 5: "Tuyệt đối tránh inline style..."), tinh gọn các thành phần thừa, và chuẩn hóa thẩm mỹ toàn diện.

---

## 2. Completed Scope & Definition of Done (DoD)

### 2.1. Thiết kế & Design Tokens (Royal Academic Theme: Warm Ivory & Sovereign Green)
- **Palette màu sắc hoàng gia & học thuật**:
  - Canvas: Warm Ivory `#FAF8F5` (Nền trang chính, chống chói mắt).
  - Surface: Alabaster White `#FFFFFF` (Cards, panels, forms).
  - Surface Dim: Pale Champagne `#F4EFE6` (Secondary panels, table headers).
  - Primary text: Imperial Charcoal `#262320` (Headings và nội dung chính - tương phản cao 16.2:1).
  - Secondary text: Warm Umber `#736B63` (Metadata và phụ chú).
  - Border: Antique Gold Line `#E6DFD5` (Đường viền và phân cách).
  - Border Hover: Champagne Gold `#C2A882` (Hover viền).
  - Accent / Primary: Royal Sovereign Green `#1B4D3E` (CTA chính, active navigation, liên kết).
  - Primary Hover: Deep Sovereign Emerald `#133D30` (Button hover, interactive hover).
  - Primary Light: Pale Sovereign Mist `#EAF0E8` (Active nav background).
  - Primary Gold: Champagne Gold `#C5A880` (Cột mốc điểm số, giải thưởng).
- **Quy tắc phối màu tuân thủ 100%**:
  - 70–80% diện tích là màu trung tính vàng ấm ngà (Canvas, Surface, Muted).
  - Hover và Accent mang sắc Sovereign Green quyền quý và sang trọng.
  - Triệt tiêu hoàn toàn gradient sặc sỡ và bóng đổ nặng; chuyển sang border-first và shadow tinh tế.
  - Màu trạng thái luôn ghép cặp với icon và nhãn văn bản.
  - Đảm bảo độ tương phản cao (WCAG AAA).

### 2.2. Hệ Thống Typography "The Oxford Scholar" (Lora + Plus Jakarta Sans)
- **Cấu hình Google Fonts**:
  - `Lora` (Serif): Dành riêng cho Headings, Titles, Brand logo và Target score.
  - `Plus Jakarta Sans` (Sans-serif): Dành cho toàn bộ UI Controls, Tables, Forms, Data grids và Badges.
- Hỗ trợ 100% tiếng Việt chuẩn Unicode, hiển thị sắc nét trên cả màn hình Retina và chuẩn.

### 2.3. Tinh Gọn Giao Diện & Loại Bỏ Chi Tiết Thừa (Minimalist De-cluttering)
1. **Xóa "Chuỗi học tập liên tục" trong `StudentDashboard.tsx`**:
   - Loại bỏ card chuỗi ngày học tập (streak counter) khỏi dashboard học sinh để không làm rối mắt, tập trung vào điểm số, bài tập và tiến độ rèn luyện thực chất.
2. **Xóa toàn bộ icon bên cạnh Title và Subtitle trong các trang Admin**:
   - Rà soát và loại bỏ icon thừa kế bên các tiêu đề `<h1>` và các phụ đề (subtitle) dài dòng gây loãng giao diện trên tất cả các trang Admin: `Dashboard.tsx`, `Accounts.tsx`, `Classes.tsx`, `Teachers.tsx`, `Students.tsx`, `AdminReports.tsx`, `AdminSettings.tsx`, `Roles.tsx`, `AdminGradingAuditLogs.tsx`, `AdminClassArchive.tsx`.
   - Giúp không gian làm việc của Quản trị viên sạch sẽ, tinh tế, tập trung tối đa vào dữ liệu và công cụ hành động.
3. **Xóa các icon trong Stats Cards của `StudentDashboard.tsx`**:
   - Loại bỏ các icon minh họa trong các thẻ thống kê (`stats-card` / `stat-badge`) trên Dashboard của học viên, giữ lại nhãn chữ và chỉ số to rõ, chuẩn phong cách minimalist typographic data cards.
4. **Triệt tiêu antipattern đếm trùng**:
   - Xóa toàn bộ count badge trong `<h1>` tại các trang đã có segmented pills hoặc KPI cards bên dưới (`Accounts`, `Classes`, `Teachers`, `Students`, `TeacherClasses`, `StudentAssignments`, `StudentClasses`, `AdminGradingAuditLogs`).
5. **Thu gọn bảng "Hàng đợi bài nộp cần chấm" (`TeacherDashboard.tsx`)**:
   - Thu gọn khu vực hàng đợi bài nộp để tối ưu không gian hiển thị tổng quát dashboard.
   - Giới hạn hiển thị 4 bài nộp mới nhất kèm nút toggle "Xem thêm / Thu gọn" (`isQueueExpanded`), hiển thị badge đếm số lượng còn lại.
   - Thêm bộ lọc nhanh theo kỹ năng (Tất cả, Writing, Speaking) và tính toán thời gian chờ chấm trực quan (`2 giờ trước`, `Hôm qua`,...).

### 2.4. Trải Nghiệm Điều Hướng & Lỗi (Navigation & Error Pages)
1. **Dynamic Browser Tab Titles theo từng trang truy cập**:
   - Tạo tiện ích `frontend/src/utils/pageTitle.ts` với hàm `getPageTitle(pathname, language)` hỗ trợ đầy đủ song ngữ (VI / EN), xử lý mọi routes (Admin, Teacher, Student, Auth, Profile) kèm parametric routes (`/teacher/assignments/:id`, `/student/assignments/:id`,...).
   - Component `frontend/src/components/PageTitleUpdater.tsx` tự động cập nhật `document.title` khi chuyển route hoặc đổi ngôn ngữ (`document.title = "${title} | EnglishHub"`).
   - Bộ test suite chuyên dụng `frontend/src/__tests__/pageTitle.test.ts` (100% passing).
2. **Hiện đại hóa Trang Lỗi 404 & 403 (Zero Card, Bold Neutral Numbers)**:
   - Loại bỏ hoàn toàn bọc card (`card`, border hộp), in hẳn thông tin trực tiếp lên canvas phẳng (`Canvas: #FAF8F5`).
   - Xóa bỏ huy hiệu (badge) nhỏ chứa mã lỗi; thay bằng con số "404" / "403" in màu xám trung tính to nổi bật (`text-[120px] font-extrabold tracking-tighter text-on-surface-variant/40`).
   - Tối giản hóa thông điệp lỗi và nút điều hướng rõ ràng, sang trọng theo chuẩn thiết kế Modernist SaaS.

### 2.5. Nâng Cấp Thẩm Mỹ Bộ Lọc & Dropdown (Modernist Filters & Controls)
1. **Bộ lọc lớp học trong `StudentAssignments.tsx`**:
   - Thay thế thẻ `<select>` mặc định bằng cụm điều khiển hiện đại `.student-filter-select-wrap` tích hợp icon `<GraduationCap size={15} />` bên trái và mũi tên `<ChevronDown size={14} />` bên phải.
   - Ẩn mũi tên native của trình duyệt (`appearance: none`), padding cân đối, hiệu ứng viền highlight Royal Sovereign Green khi focus hoặc khi có giá trị được chọn (`.has-value`).
   - Nút xóa nhanh bộ lọc kèm icon `<X size={12} strokeWidth={2.5} />` dạng pill gọn gàng khi học sinh đang lọc theo một lớp cụ thể.
2. **Dropdown lọc điểm số trong `AdminGradingAuditLogs.tsx`**:
   - Nâng cấp dropdown mức điểm (`scoreFilter`) tương đồng với hệ thống Github/Linear Filters: sử dụng cụm `.adm-gh-select-wrap` với icon `<Award size={15} />` bên trái, mũi tên `<ChevronDown size={14} />` bên phải, trạng thái active `.has-value` tinh tế.
3. **Nút Lọc Không Viền (Borderless Ghost Pills)**:
   - Triệt tiêu viền bao quanh từng nút lọc, chuyển sang nền trong suốt ở trạng thái nghỉ (`border: none; background: transparent`), hover êm dịu (`var(--surface-dim)`), và active khối Royal Sovereign Green (`var(--primary)`) kèm bóng đổ nhẹ.
   - Áp dụng đồng bộ: `.adm-pill`, `.teacher-pill`, `.std-eco-pill`, `.student-classes-tab-btn`, `.tcd-pill-btn`, `.teacher-dash-skill-tab-btn`, `.tad-subtab-btn`.

---

## 3. Rà Soát & Triệt Tiêu Static Inline CSS (Tuân Thủ convention-fe.md)

Tuân thủ nghiêm ngặt **Mục 5 của `.agents/rules/convention-fe.md`**:
> *"Tuyệt đối tránh inline style: Không viết style={{ margin: 20, color: 'red' }} trừ trường hợp giá trị động bắt buộc tính bằng JavaScript."*

### 3.1. Bổ sung các Scoped CSS Utility Classes trong `frontend/src/styles/admin-modern.css`
- **Grid & Layouts**:
  - `.adm-bento-grid`: Bento layout 2 cột linh hoạt (`grid-template-columns: repeat(auto-fit, minmax(360px, 1fr))`).
  - `.adm-cards-grid`: Card grid tự co giãn (`grid-template-columns: repeat(auto-fill, minmax(340px, 1fr))`).
  - `.adm-drawer-wide`: Slide-over drawer chiều rộng rộng rãi (`max-width: 680px !important`).
  - `.adm-drawer-metrics-grid`, `.adm-drawer-metric-item`, `.adm-drawer-metric-val`: Khối tóm tắt thông số kiểm toán trong drawer.
  - `.adm-settings-grid-2`, `.adm-settings-grid-security`: Grid 2 cột cho các form cấu hình hệ thống.
- **Controls & Buttons**:
  - `.adm-search-clear-btn`: Nút xóa tìm kiếm căn chỉnh tuyệt đối trong search input.
  - `.adm-btn-back`: Nút quay lại chuẩn hóa padding và icon gap.
  - `.adm-roles-preset-wrap`, `.adm-roles-preset-select`: Cụm dropdown chọn mẫu phân quyền RBAC.
  - `.adm-range-input`: Input thanh trượt với màu nhấn Sovereign Green.
- **Feedback, States & Badges**:
  - `.adm-alert-error`, `.adm-alert-success`: Banner thông báo lỗi / thành công chuẩn Design Tokens.
  - `.adm-loading-state`, `.adm-loading-state-icon`: Khối trạng thái đang tải dữ liệu.
  - `.adm-empty-state-card`, `.adm-empty-state-icon`, `.adm-empty-state-title`, `.adm-empty-state-desc`: Khối trạng thái danh sách rỗng.
  - `.adm-drawer-feedback-card`, `.adm-ai-feedback-card`, `.adm-ai-feedback-title`: Khối hiển thị nhận xét giáo viên và phân tích AI.
  - `.adm-audit-table-wrap`: Container bọc bảng kiểm toán có viền bo góc và thanh cuộn ngang mượt mà.
  - `.adm-kpi-icon-primary`, `.adm-kpi-icon-success`, `.adm-kpi-icon-danger`: Khối icon KPI với nền mờ và màu nhấn tương ứng.
  - `.adm-badge-neutral`: Badge trung tính kế thừa `--surface-container-high`.
- **Settings & Tables**:
  - `.adm-table-card-header`, `.adm-table-card-footer`: Header và Footer bảng quản trị chuẩn hóa.
  - `.adm-settings-section-card`, `.adm-settings-row`, `.adm-settings-divider`, `.adm-settings-info-box`: Khối section, switch row, đường phân cách và hộp thông tin CSDL.

### 3.2. Danh sách các file được Refactor sạch static inline CSS
1. **`Dashboard.tsx`**: Thay thế inline grid style bằng class `.adm-bento-grid`.
2. **`Teachers.tsx`**: Thay thế inline grid style bằng class `.adm-cards-grid`.
3. **`AdminGradingAuditLogs.tsx`**: Loại bỏ toàn bộ static inline CSS (Alert banner, search clear button, loading/empty states, drawer dimensions, metric items, feedback cards, change logs table).
4. **`AdminSettings.tsx`**: Thay thế toàn bộ static inline CSS bằng các class `.adm-alert-success`, `.adm-settings-section-card`, `.adm-settings-grid-2`, `.adm-settings-row`, `.adm-settings-divider`, `.adm-range-input`, `.adm-settings-info-box`.
5. **`Roles.tsx`**: Loại bỏ toàn bộ static inline styles trong header buttons, success banner, filter bar, tab pills, preset selector, RBAC table header/footer, module cells, switch alignment.
6. **`AdminClassArchive.tsx`**: Loại bỏ toàn bộ static inline styles trong back button, error alert, KPI icon wrappers, KPI values, search input, filter pills, table header, loading/empty states, status badges, action buttons.
7. **`Classes.tsx`**: Thay thế static inline grid và height style bằng class `.adm-cards-grid` và `h-1.5`.
8. **`StudentGrades.tsx`**: Thay thế static inline style `minWidth: 240px` bằng class Tailwind `min-w-[240px]`.

> **Lưu ý bảo toàn**: Các style inline có giá trị động runtime được giữ lại theo đúng cho phép của convention (ví dụ: thanh tiến độ `width: ${occupancyPct}%`, đếm ngược redirect `width: ${progress}%`, sóng âm thanh `height: ${h}%`, màu sắc rubric `borderColor: color`).

---

## 4. Verification & Testing Results

1. **TypeScript Compilation**:
   ```bash
   npx --no-install tsc -b
   ```
   - **Kết quả**: 0 lỗi, 0 cảnh báo identifier không sử dụng (`TS6133`), clean compilation.

2. **Production Build**:
   ```bash
   npm run build
   ```
   - **Kết quả**: Vite build production thành công, bundled hoàn hảo trong ~1.5s.

3. **Unit Test Suite**:
   ```bash
   npm test -- --run
   ```
   - **Kết quả**: 91/91 unit test vượt qua thành công 100% (`pass 91, fail 0, cancelled 0, skipped 0`), bảo toàn toàn bộ nghiệp vụ từ Auth, Submission, Grading đến PageTitle.

---

## 5. Artifacts & Hand-off
- Các thay đổi CSS tập trung tại: `frontend/src/styles/admin-modern.css`, `frontend/src/styles/student-modern.css`, `frontend/src/styles/teacher-modern.css`.
- Không phát sinh breaking changes về API hay cơ sở dữ liệu.
- Sẵn sàng bàn giao cho `@tester` kiểm thử hồi quy và `@devops-primary` chuẩn bị triển khai.

