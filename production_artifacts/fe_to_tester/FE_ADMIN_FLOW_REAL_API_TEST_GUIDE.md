# QA Test Guide: [FE-23] Connect Real APIs for Complete Admin Flow

**Source**: `@fe-primary`  
**Target**: `@tester`  
**Date**: `2026-10-10`  
**Task ID**: `[FE-23]`  
**Scope**: [FE-06], [FE-09], [FE-18] Complete Admin Flow (`/admin/*`) & Route Isolation

---

## 1. Overview & Verification Scope
This test guide covers the verification of real API integration for the Admin flow, resolving decoupling requirements, live audit log tracking, dynamic reporting filters, and status modifications.

### Key Deliverables:
1. **[FE-09] Route Decoupling & Standalone Analytics (`/admin/reports`)**:
   - Decoupled from generic dashboard routing; `/reports` route now redirects role-specifically (`admin` -> `/admin/reports`).
   - Integrates with `ReportService.getOverview` and `ReportService.listClasses`.
   - Supports date filters (`from`, `to`), teacher filter (`selectedTeacherId`), and class filter (`selectedClassId`).
   - Detailed modal for class progress via `ReportService.getClassProgress` showing class cohort size, completion percentage, average score percentage, and lagging students list.
   - Clean UI state handling: Loading skeleton/spinners, error state with retry button, empty state illustrations.

2. **[FE-18] Real Grading Audit Logs (`/admin/grading-audit`)**:
   - Switched from mock submissions to live backend calls:
     - `gradingService.listGradings({ page, limit, status })` for audit log list.
     - `gradingService.getById(id)` for detailed submission context.
     - `gradingChangeLogService.getChangeLogs(id)` for historical score edits (`changedBy`, `oldScore`, `newScore`, `reason`, `changedAt`).
   - Status filters (`ALL`, `COMPLETED`, `IN_PROGRESS`, `PENDING`).
   - Pagination controls, detail drawer inspection, and unmodified banner when change logs are empty.

3. **[FE-18] System Settings (`/admin/settings`)**:
   - Lazy state initialization and persistent configuration in `localStorage` (`englishhub_admin_system_settings`).
   - API key visibility toggle with live edit and reset defaults button (`handleReset`).
   - Clean notification toasts and no unused hooks/react-hooks lint violations.

4. **[FE-06] Student & Teacher Account Status Management (`/admin/students`, `/admin/students/:id`)**:
   - Direct status toggle (Lock/Unlock) in `Students.tsx` row actions using `userService.updateStatus(id, newStatus)`.
   - Quick lock/unlock toggle in `StudentDetails.tsx` with live feedback banners and instant state refresh.

---

## 2. API Endpoint Matrix

| Module | Route | Backend API Endpoint | HTTP Method | Service Method |
|---|---|---|---|---|
| **Reports** | `/admin/reports` | `/api/v1/reports/overview` | `GET` | `reportService.getOverview(params)` |
| **Reports** | `/admin/reports` | `/api/v1/reports/classes` | `GET` | `reportService.listClasses(params)` |
| **Reports** | `/admin/reports` | `/api/v1/reports/classes/:id` | `GET` | `reportService.getClassProgress(classId, threshold)` |
| **Audit Logs**| `/admin/grading-audit` | `/api/v1/gradings` | `GET` | `gradingService.listGradings(query)` |
| **Audit Logs**| `/admin/grading-audit` | `/api/v1/gradings/:id` | `GET` | `gradingService.getById(id)` |
| **Audit Logs**| `/admin/grading-audit` | `/api/v1/gradings/:id/change-logs` | `GET` | `gradingChangeLogService.getChangeLogs(id)` |
| **User Mgmt** | `/admin/students` | `/api/v1/users` | `GET` | `userService.listUsers({ role: 'STUDENT' })` |
| **User Mgmt** | `/admin/students` | `/api/v1/users/:id/status` | `PATCH` | `userService.updateStatus(id, status)` |
| **User Mgmt** | `/admin/students/:id` | `/api/v1/users/:id` | `GET` | `userService.getUserById(id)` |
| **User Mgmt** | `/admin/students/:id` | `/api/v1/users/:id/status` | `PATCH` | `userService.updateStatus(id, status)` |

---

## 3. Test Cases & Verification Procedures

### TC-01: Standalone Admin Reports Page (`/admin/reports`)
1. Log in as an **Admin** user.
2. Navigate to `/admin/reports` (or click "Báo cáo & Thống kê" in the sidebar).
3. **Verify**:
   - Page loads without redirecting to `/admin` dashboard.
   - Filter bar displays: "Từ ngày" (`from`), "Đến ngày" (`to`), "Giáo viên", and "Lớp học".
   - Overview metrics display real counts (Total Submissions, Average Score, Completion Rate).
   - Class performance table lists real classes from `reportService.listClasses()`.
4. Click "Xem chi tiết" on any class row.
5. **Verify**:
   - Modal opens and fetches `/api/v1/reports/classes/:id`.
   - Displays student cohort size, completed count, average score, and lagging students list.
6. Trigger error state (e.g., turn off backend or simulate 500 error):
   - Verify error banner appears with "Thử lại" button.
   - Click "Thử lại" after restoring connection; verify data reloads successfully.

### TC-02: Role-based Shortcut Redirect (`/reports`)
1. Log in as **Admin** and navigate to `/reports` -> Verify redirected to `/admin/reports`.
2. Log in as **Teacher** and navigate to `/reports` -> Verify redirected to `/teacher/classes`.
3. Log in as **Student** and navigate to `/reports` -> Verify redirected to `/student/analytics`.

### TC-03: Real Grading Audit Logs (`/admin/grading-audit`)
1. Log in as **Admin** and navigate to `/admin/grading-audit`.
2. **Verify**:
   - Audit table fetches live data from `/api/v1/gradings`.
   - Filter dropdowns (Status: ALL, COMPLETED, IN_PROGRESS, PENDING) reload data on change.
3. Click on a grading entry to open the detail drawer.
4. **Verify**:
   - Detail drawer calls `gradingService.getById(id)` and `gradingChangeLogService.getChangeLogs(id)`.
   - If change logs exist: Displays table with columns: "Thời gian", "Người sửa", "Điểm cũ", "Điểm mới", "Lý do thay đổi".
   - If no change logs exist: Displays notice "Bài làm này chưa có lịch sử điều chỉnh điểm số".

### TC-04: Student Status Toggle & Real-time Update (`/admin/students` & `/admin/students/:id`)
1. In `/admin/students`, locate an active student.
2. Click the quick toggle icon (Lock / Unlock).
3. **Verify**:
   - API `PATCH /api/v1/users/:id/status` is called.
   - Student status updates immediately to `INACTIVE` / `ACTIVE` in UI.
4. Click into student details (`/admin/students/:id`).
5. Click "Khóa tài khoản" / "Kích hoạt tài khoản" in the action header.
6. **Verify**:
   - API `PATCH /api/v1/users/:id/status` is executed.
   - Green success notification appears.
   - Status badge and header button reflect new state immediately.

### TC-05: System Settings Persistence & Reset (`/admin/settings`)
1. Navigate to `/admin/settings`.
2. Edit settings (e.g., adjust AI prompt, token limits, or toggle notification preferences).
3. Click "Lưu cài đặt".
4. Refresh browser page -> Verify changes are persisted from `localStorage`.
5. Click "Khôi phục mặc định" (`handleReset`).
6. **Verify**:
   - Values revert to system defaults.
   - Success toast confirmation is shown.

---

## 4. Automated Build & Test Status
- **Unit & Integration Tests**: 73/73 tests passing (`npm test -- --run`).
- **ESLint**: 0 errors, 0 warnings (`npx eslint src/pages/AdminReports.tsx src/pages/AdminGradingAuditLogs.tsx src/pages/AdminSettings.tsx src/pages/Students.tsx src/pages/StudentDetails.tsx src/App.tsx`).
- **Production Build**: Successful in 1.07s (`tsc -b && vite build`).
- **Git Status**: All changes uncommitted as requested by user.
