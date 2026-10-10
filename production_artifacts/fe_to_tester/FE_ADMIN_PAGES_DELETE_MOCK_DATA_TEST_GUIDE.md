# QA Test Guide: Frontend Admin Pages Mock Data Purge Verification

**Source**: `@fe-primary`  
**Target**: `@tester`  
**Date**: `2026-10-08`  
**Scope**: All Admin Modules (`/admin/*`)

---

## 1. Summary of Changes
All 16 admin pages have had mock data structures removed. They are now wired to real REST API services via `httpClient` / Axios with proper loading spinners, error alerts, and empty states.

| Page / Route | Service Integration | Empty State Handling |
|---|---|---|
| `/admin` (Dashboard) | `userService`, `classService`, `reportService` | Displays 0 counts and clean empty lists |
| `/admin/accounts` | `userService.listUsers()`, `updateStatus()`, `createUser()` | Displays empty table illustration |
| `/admin/classes` | `classService.list()`, `userService` | Displays empty class notice with create button |
| `/admin/classes/add` | `userService.listUsers({ role: 'TEACHER' })`, `classService.create()` | Empty teacher dropdown placeholder |
| `/admin/classes/archive` | `classService.list()`, `classService.update()` | Empty archive card banner |
| `/admin/classes/:id` | `classService.getDetail()`, `classService.listMembers()`, `assignmentService.listAssignments()` | Empty roster & empty assignments rows |
| `/admin/teachers` | `userService.listUsers({ role: 'TEACHER' })`, `classService.list()` | Empty teacher list alert |
| `/admin/teachers/add` | `classService.list()`, `userService.createUser()` | Empty classes selector |
| `/admin/teachers/:id` | `userService.listUsers()`, `userService.updateStatus()`, `classService.list()` | Empty workload / no assigned classes fallback |
| `/admin/students` | `userService.listUsers({ role: 'STUDENT' })`, `reportService` | Empty student grid |
| `/admin/students/add` | `classService.list()`, `userService.createUser()`, `classService.addMember()` | Clean input form |
| `/admin/students/:id` | `userService`, `reportService.getStudentProgress()`, `studentEvaluationService` | Empty timeline & evaluation notices |
| `/admin/reports` | `reportService.getOverview()`, `reportService.listClasses()`, `userService` | Zero metric badges & empty tabular views |
| `/admin/grading-audit` | `submissionService.listSubmissions()`, `userService` | Empty grading records table |
| `/admin/settings` | Controlled system configuration form | Secret API key defaults to empty with input placeholder |
| `/admin/roles` | RBAC matrix | Interactive module permission matrix |

---

## 2. Test Scenarios

### Scenario A: Empty Database Behavior (New Installation)
1. Run backend with clean DB or no records.
2. Navigate to each `/admin/*` route.
3. **Verify**:
   - No crash or white screen (`undefined` reading errors).
   - Clean empty states displayed (e.g., "Chưa có học viên nào", "Chưa có lớp học nào").
   - KPI metrics display numeric `0` instead of hardcoded numbers like `1,248` or `95%`.

### Scenario B: API Data Loading & Interactivity
1. Add a new teacher via `/admin/teachers/add`.
2. Verify teacher appears in `/admin/teachers` and `/admin/accounts`.
3. Create a class assigning that teacher in `/admin/classes/add`.
4. Verify class is listed in `/admin/classes` and shows real occupancy count.
5. In `/admin/settings`, ensure API key input starts empty and supports entering and toggling visibility.

---

## 3. Automated Validation Results
- `npm test -- --run`: 73/73 tests pass (100%).
- `npm run lint`: 0 errors, 0 warnings.
- `npm run build`: `tsc -b && vite build` completed successfully.
