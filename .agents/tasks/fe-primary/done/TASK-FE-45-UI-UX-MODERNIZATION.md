---
id: TASK-FE-45-UI-UX-MODERNIZATION
title: "UI/UX Modernization for Entire Frontend Application (Admin, Teacher, Student, Auth, Profile)"
role: fe-primary
assignee: Maloque18705
status: "Done"
created_at: 2026-10-13T10:00:00+07:00
updated_at: 2026-10-13T23:00:00+07:00
completed_at: 2026-10-13T23:00:00+07:00
priority: P0
tags: [frontend, ui-ux, modernization, minimal-saas, design-brief, fe-45, zero-inline-styles]
---

# TASK-FE-45-UI-UX-MODERNIZATION: UI/UX Modernization for Entire Frontend Application

## 1. Context & Objective
Nâng cấp giao diện tổng thể của Frontend EnglishHub theo hướng hiện đại (Minimal SaaS e-learning platform lấy cảm hứng từ Linear/Notion/Vercel) theo tài liệu `docs/minimal_saas_elearning_design_brief.md`, tạo tính nhất quán thị giác trên cả 3 vai trò Admin, Giáo viên và Học viên, không phá vỡ luồng nghiệp vụ API/DB.

## 2. Completed Scope & Definition of Done (DoD)
1. **Thiết kế & Design Tokens (Royal Academic Theme: Warm Ivory & Sovereign Green)**:
   - Canvas: Warm Ivory `#FAF8F5` (Main page background)
   - Surface: Alabaster White `#FFFFFF` (Cards, panels, forms)
   - Surface Dim: Pale Champagne `#F4EFE6` (Secondary panels, table headers)
   - Primary text: Imperial Charcoal `#262320` (Headings and main text - 16.2:1 contrast)
   - Secondary text: Warm Umber `#736B63` (Metadata and supporting text)
   - Border: Antique Gold Line `#E6DFD5` (Borders and dividers)
   - Border Hover: Champagne Gold `#C2A882` (Hover borders)
   - Accent / Primary: Royal Sovereign Green `#1B4D3E` (Primary CTA, active navigation, links)
   - Primary Hover: Deep Sovereign Emerald `#133D30` (Button hover, interactive hover)
   - Primary Light: Pale Sovereign Mist `#EAF0E8` (Active nav background)
   - Primary Gold: Champagne Gold `#C5A880` (Milestone scores, awards)
   - **Color Rules tuân thủ 100%**:
     - 70–80% diện tích là màu trung tính vàng ấm ngà (Canvas, Surface, Muted).
     - Hover và Accent mang sắc Sovereign Green quyền quý và sang trọng.
     - Triệt tiêu gradient sặc sỡ và bóng đổ nặng; chuyển sang border-first và shadow tinh tế.
     - Màu trạng thái luôn ghép cặp với icon và nhãn văn bản.
     - Đảm bảo độ tương phản cao (WCAG AAA).
2. **Kỹ thuật & Kiến trúc**:
   - 100% Vanilla CSS Tokens, KHÔNG cài thêm thư viện UI bên ngoài (Không Tailwind, không Radix/Shadcn).
   - Triệt tiêu hoàn toàn CSS inline tĩnh trên toàn bộ các trang (chỉ cho phép giá trị runtime dynamic).
   - BEM-like scoped CSS classes, không xung đột class.
3. **Phân hệ hoàn thành**:
   - **Admin Module (100%)**: `Dashboard`, `Accounts`, `AdminReports`, `Classes`, `Teachers`, `Students`.
   - **Teacher Module (100%)**: `TeacherDashboard`, `TeacherAssignments`, `TeacherAssignmentDetails`, `TeacherClasses`, `TeacherSubmissionDetails`.
   - **Student Module (100%)**: `StudentDashboard`, `StudentAssignmentOverview`, `StudentGrades`, `StudentFeedback`, `StudentAnalytics`, `StudentAssignments`, `StudentWorkspace`, `StudentClasses`, `StudentClassDetails`.
   - **Student 4-Skill Workspaces (100%)**: `StudentAssignmentSpeaking`, `StudentAssignmentWriting`, `StudentAssignmentReading`, `StudentAssignmentListening`.
   - **Student Result & Feedback (100%)**: `StudentSubmissionResult`.
   - **Auth & Profile (100%)**: `Login`, `ForgotPassword`, `ResetPassword`, `Profile`, `Settings`.
   - **Shared Components (100%)**: `Button`, `MetricCard`, `EmptyState`, `Skeleton`, `StatusBadge`.
4. **Kiểm thử & Biên dịch**:
   - `npx --no-install tsc -b`: 0 lỗi, clean build.
   - `npm test -- --run`: 85/85 tests passed (100%).
5. **Rà soát & Tinh gọn Giao diện (Minimalist De-cluttering)**:
   - Triệt tiêu antipattern đếm trùng: Xóa toàn bộ count badge trong `<h1>` tại các trang đã có segmented pills hoặc KPI cards bên dưới (`Accounts`, `Classes`, `Teachers`, `Students`, `TeacherClasses`, `StudentAssignments`, `StudentClasses`, `AdminGradingAuditLogs`).
   - Xóa các badge khẩu hiệu / trang trí thừa (`Executive Portal`, `Học kỳ Hiện Tại • Giảng Viên`, `Báo Cáo & Thống Kê Chuyên Sâu`).
   - Tinh gọn tiêu đề dài dòng và xóa subtitle lặp lại (`Dashboard`, `TeacherClasses`, `TeacherAssignments`, `StudentGrades`, `StudentFeedback`, `StudentAnalytics`).
   - Chuẩn hóa mã thẻ lớp học dạng monospace và badge trạng thái khóa `badge-blocked`.
6. **Hệ Thống Typography "The Oxford Scholar" (Lora + Plus Jakarta Sans)**:
   - Google Fonts preconnect & stylesheet: `Lora` cho Headings, Titles, Brand logo và Target score; `Plus Jakarta Sans` cho toàn bộ UI Controls, Tables, Forms và Badges.
   - Hỗ trợ 100% tiếng Việt chuẩn Unicode, đạt độ sắc nét và tương phản cao ở mọi kích thước màn hình.
7. **Nút Lọc Không Viền (Borderless Ghost Pills - Option A)**:
   - Triệt tiêu viền bao quanh từng nút lọc, chuyển sang nền trong suốt ở trạng thái nghỉ (`border: none; background: transparent`), hover êm dịu (`var(--surface-dim)`), và active khối Royal Sovereign Green (`var(--primary)`) kèm bóng đổ nhẹ.
   - Áp dụng đồng bộ trên toàn bộ phân hệ: `.adm-pill`, `.teacher-pill`, `.std-eco-pill`, `.student-classes-tab-btn`, `.tcd-pill-btn`, `.teacher-dash-skill-tab-btn`, `.tad-subtab-btn`.
