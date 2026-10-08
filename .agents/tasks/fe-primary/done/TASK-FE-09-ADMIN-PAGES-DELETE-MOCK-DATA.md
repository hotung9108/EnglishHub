# TASK-FE-09: Delete All Mock Data From Admin Pages & Connect Real APIs

**Role**: `@fe-primary`  
**Status**: `Done`  
**Date**: `2026-10-08`  

---

## 1. Objectives & Scope
Completely purge all hardcoded mock arrays, fake test fixtures, fake KPI numbers, static rosters, mock submissions, and test API credentials across all Admin pages in the EnglishHub frontend. Replace them with live service integrations, loading indicators, error handling, and clean empty states.

### Target Pages & Components
1. `Dashboard.tsx`: Connected to `userService`, `classService`, and `reportService.getOverview()`. Replaced hardcoded stats and mock activity lists.
2. `Accounts.tsx`: Replaced mock users (`HV-8801`, `GV-001`, `HV-8802`, `AD-001`) with `useUsers()` and `userService`. Connected status toggle and user drawer CRUD to real APIs.
3. `Classes.tsx`: Removed `classesData` mock array (`ENG-IELTS-6.5A`, `ENG-TOEIC-750`). Connected to `classService.list()` and `userService` with real occupancy metrics and empty states.
4. `AddClass.tsx`: Stripped pre-filled mock values (`IELTS Master Band 7.0+`, `ENG-IELTS-7.0B`) and hardcoded teacher options. Integrated with `userService.listUsers({ role: 'TEACHER' })` and `classService.create()`.
5. `AdminClassArchive.tsx`: Removed mock classes (`arch-1` through `arch-4`). Integrated with `classService.list()` and `classService.update()` for reactivation.
6. `ClassDetails.tsx`: Removed hardcoded `classInfo`, mock `studentsRoster` (Alice, David, Trâm, Quân), and mock `assignments` (`HW-01` through `HW-04`). Integrated with `classService.getDetail()`, `classService.listMembers()`, and `assignmentService.listAssignments()`.
7. `Teachers.tsx`: Removed mock `teachers` array (`GV-088`, `GV-042`, `GV-019`, `GV-033`) and fake KPI numbers. Connected with `userService.listUsers({ role: 'TEACHER' })` and `classService.list()`.
8. `AddTeacher.tsx`: Cleared mock form data (`Cô Hoàng Thu Thảo`, `GV-092`) and static class options. Connected with `classService.list()` and `userService.createUser()`.
9. `TeacherDetails.tsx`: Removed hardcoded `getTeacherData` switch, mock `activeClasses`, and mock `gradingHistory`. Connected to `userService.listUsers()`, `userService.updateStatus()`, and `classService.list()`.
10. `Students.tsx`: Removed mock `studentsData` array and hardcoded KPI counts. Connected with `userService.listUsers({ role: 'STUDENT' })` and `reportService`.
11. `AddStudent.tsx`: Removed mock form data (`Nguyễn Minh Quân`, `HV-8805`) and static class list. Connected with `classService.list()`, `userService.createUser()`, and `classService.addMember()`.
12. `StudentDetails.tsx`: Removed hardcoded student mock object, enrolled classes, submissions, evaluations, and fake score cards. Connected with `userService`, `reportService.getStudentProgress()`, and `studentEvaluationService`.
13. `AdminReports.tsx`: Removed mock arrays `classPerformances`, `topStudents`, `atRiskStudents`, `calibrationData`, `outlierCases`, and `teacherStats`. Connected to `reportService.getOverview()`, `reportService.listClasses()`, and `userService`.
14. `AdminGradingAuditLogs.tsx`: Removed mock `gradingHistory` array (`GR-8812` through `GR-8830`). Connected to `submissionService.listSubmissions()` and `userService`.
15. `AdminSettings.tsx`: Removed hardcoded mock AI API key (`AIzaSyD-mock991823-EnglishHubSecureKey`). Configured empty initial state with placeholder.
16. `Roles.tsx`: Verified dynamic RBAC matrix structure without mock identities.
17. Removed obsolete mock component prototype directories:
    - `src/components/classes/AddClass/`
    - `src/components/classes/ClassDetails/`
    - `src/components/students/AddStudent/`
    - `src/components/teachers/AddTeacher/`

---

## 2. Verification & DoD Compliance
- **Code compilation**: Passed (`tsc -b && vite build` built in 1.16s with 0 errors).
- **Unit tests**: 73/73 tests passing.
- **Linting**: 0 errors, 0 warnings (`eslint .` exit code 0).
- **Handoff Artifact**: Placed in `production_artifacts/fe_to_tester/FE_ADMIN_PAGES_DELETE_MOCK_DATA_TEST_GUIDE.md`.
