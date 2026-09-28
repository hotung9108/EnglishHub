---
id: TASK-FE-TEACHER-CLASS-DETAILS
title: "Review and Redesign Teacher Class Details Page with 4-Skill Gradebook & AI Analytics"
role: fe-primary
assignee: Maloque18705
status: "Done"
created_at: 2026-09-26T23:05:00+07:00
updated_at: 2026-09-27T00:19:00+07:00
completed_at: 2026-09-27T00:19:00+07:00
priority: P0
tags: [frontend, teacher, class-details, progress, gradebook, 4-skills, ai-insights, redesign]
---

# TASK-FE-TEACHER-CLASS-DETAILS: Review and Redesign Teacher Class Details Page

## Objective
Review, refactor, and comprehensively redesign the Teacher Class Details & Progress page (`/teacher/classes/:id` and `/teacher/classes/:id/progress`) in EnglishHub. Remove all inline styles and embedded style tags in accordance with `convention-fe.md`, and elevate the interface to modern, high-aesthetic standards with rich interactive features for teachers.

## Implementation Details
1. **Refactored Stylesheet (`src/styles/teacher-class-details.css`)**:
   - 100% eliminated all inline styles and embedded `<style>` tags from `TeacherClassProgress.tsx`.
   - Uses CSS variables and tokens from design system.
   - Responsive layout for desktop, laptop, and tablet.
2. **Dynamic Class Parameters & Switcher**:
   - Parameterized `:id` handling in `TeacherClassProgress.tsx` with fallback and class switcher dropdown.
   - Synchronized routes: `/teacher/classes/:id`, `/teacher/classes/:id/progress`, and global `/progress` redirect in `App.tsx`.
3. **4 KPI Metric Cards**:
   - Assignment Completion Rate (88.3%)
   - On-time Submission Rate (91.5%)
   - Overall Class Band Average (Band 7.1)
   - Target Attainment Rate (87.5%)
4. **4-Tab Comprehensive Architecture**:
   - **Tab 1: Bảng điểm & Học viên (Gradebook & Roster)**: Filter pills, live search, student avatar cells, 4-skill score chips, status indicators, and view drawer button.
   - **Tab 2: Danh sách Bài tập (Class Assignments)**: Homework cards with progress tracks and direct grading CTAs.
   - **Tab 3: Phân tích 4KN & AI Insights**: Competence scores vs target band, AI-identified strengths/weaknesses tags, and intervention alerts.
   - **Tab 4: Lộ trình & Buổi học (Syllabus & Sessions)**: 24-lesson timeline with status and materials.
5. **Interactive Student Detail Drawer**:
   - Slide-out drawer with radar skill breakdown, submission history, and direct teacher messaging.

## Verification & Definition of Done (DoD)
- [x] ESLint validation: `npm run lint` passes with 0 errors and 0 warnings.
- [x] TypeScript & Vite build: `npm run build` passes with 0 errors.
- [x] Browser testing: verified navigation, class switcher, tabs, filters, and drawer modal.
- [x] Test guide placed in `production_artifacts/fe_to_tester/FE_TEACHER_CLASS_DETAILS_TEST_GUIDE.md`.
