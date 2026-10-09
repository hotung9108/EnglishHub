---
id: TASK-FE-10-TEACHER-PAGES-REAL-API
title: "Real API Integration for Teacher Portal Subsystems (FE-05, FE-10)"
role: fe-primary
assignee: Maloque18705
status: "Done"
created_at: 2026-10-09T16:05:00+07:00
updated_at: 2026-10-09T16:36:00+07:00
priority: P0
tags: [frontend, teacher-portal, real-api, assignments, grading, gradebook, classes, exam-bank, fe-05, fe-10]
---

# TASK-FE-10-TEACHER-PAGES-REAL-API: Real API Integration for Teacher Portal

## 1. Context & Objective
Verify and complete real API integration for all Teacher pages across EnglishHub, eliminating all hardcoded mock arrays, fake test fixtures, and static counters:
- **Scope**: `[FE-05]`, `[FE-10]` — Teacher Dashboard (`TeacherDashboard.tsx`), Assignment Management (`TeacherAssignments.tsx`), Assignment Creation & Editing (`TeacherCreateAssignment.tsx`, `TeacherEditAssignment.tsx`), Assignment Details & Submissions Roster (`TeacherAssignmentDetails.tsx`), Grading & AI Grading Studio (`TeacherSubmissionDetails.tsx`), Class Management (`TeacherClasses.tsx`), Class Progress & Gradebook (`TeacherClassProgress.tsx`), Exam Bank & Quick Assign (`TeacherExamBank.tsx`, `QuickAssignModal.tsx`).
- **Inputs**: `[BE-13]` API Classes, `[BE-15]` API Assignments, `[BE-19]` API Grading, `[BE-24]` API AI suggestions & annotations.
- **Outputs**: All Teacher pages running on live backend endpoints with complete loading, error (retry), and empty states.

## 2. Definition of Done (DoD) Criteria
- [x] Audit every teacher page to verify 0 remaining mock fixtures or static fallback data.
- [x] Handle full loading (`isLoading`), error with retry (`isError`), and empty (`isEmpty`) states across all API calls.
- [x] Test end-to-end flows: create assignment -> submissions & AI grading -> view gradebook / progress.
- [x] Unit tests pass with >= 80% coverage on new/updated service integration logic (73/73 passing).
- [x] TypeScript compilation (`tsc -b && vite build`) and ESLint (`eslint .`) pass with 0 errors.
- [x] Test guide artifact placed in `production_artifacts/fe_to_tester/FE_TEACHER_PAGES_REAL_API_TEST_GUIDE.md`.
