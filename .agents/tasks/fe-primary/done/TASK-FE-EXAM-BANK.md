---
id: TASK-FE-EXAM-BANK
title: "Teacher Exam Bank & Template Library with 4-Skill Categorization"
role: fe-primary
assignee: Maloque18705
status: "Done"
created_at: 2026-09-26T21:51:00+07:00
updated_at: 2026-09-26T22:08:00+07:00
completed_at: 2026-09-26T22:08:00+07:00
priority: P0
tags: [frontend, teacher, exam-bank, templates, 4-skills, writing, speaking, reading, listening, sidebar]
---

# TASK-FE-EXAM-BANK: Teacher Exam Bank & Template Library with 4-Skill Categorization

## Objective
Implement an Exam Bank / Template Library page for teachers in EnglishHub, accessible via a dedicated button in the Teacher Sidebar and from the assignments dashboard. The exam bank categorizes exams by all 4 skills (Writing, Speaking, Reading, Listening) and allows teachers to:
1. Filter by 4 skills (All, Writing, Speaking, Reading, Listening) + Target Band / Difficulty / Format.
2. Search exams by code, title, topic tags (Environment, Education, AI, Technology, Society...).
3. Preview full exam details (prompt, reading passage, audio preview, cue card, question sets).
4. Quick Assign directly to any class with custom due dates and status.
5. Clone & Customize exam into the assignment editor.

## Implementation Details
1. **Sidebar Navigation (`src/components/layout/Sidebar.tsx`)**:
   - Added `Library` icon from `lucide-react`.
   - Added `{ path: '/teacher/exam-bank', label: t('menuExamBank'), icon: Library }` in teacher teaching section.
   - Added `menuExamBank` to `locales/common.ts` in both Vietnamese ("Kho đề thi & Mẫu") and English ("Exam Bank & Templates").
2. **Types (`src/types/exam-bank.types.ts`)**:
   - Strict TypeScript models for `ExamTemplateItem`, `ExamSkill`, `ExamFormat`, `ExamDifficulty`, and `QuickAssignForm`.
3. **Design & Styles (`src/styles/teacher-exam-bank.css`)**:
   - Hero banner with badge & action buttons.
   - KPI metrics cards strip.
   - 4-Skill pills with active indicator and item counts.
   - 3-column responsive card grid with hover lifts, skill-specific badges, tag lists, and action buttons.
   - Modals for Exam Detail Preview and Quick Assign with smooth scroll and clean layouts.
4. **Modals**:
   - `ExamDetailModal.tsx`: Displays skill-specific content: prompt, audio player simulator (Listening), IELTS criteria breakdowns, band 8.0+ sample response, and quick action buttons.
   - `QuickAssignModal.tsx`: Prepopulated form to assign any template to a selected class with dates, code, title, and late-submission settings.
5. **Main Page (`src/pages/TeacherExamBank.tsx`)**:
   - 12 curated exam templates covering IELTS Academic Writing (Task 1 & 2), Speaking (Part 1, 2, 3), Reading (Passages 1-3), and Listening (Sections 1-4).
   - Real-time search by keywords, filters for format and target band, clear filter button when empty.
6. **Routes & Cross-links (`src/App.tsx` & `src/pages/TeacherAssignments.tsx`)**:
   - `/teacher/exam-bank` route and alias `/teacher/assignments/templates`.
   - Header button "Ngân hàng đề thi" on teacher assignments page directly links to `/teacher/exam-bank`.

## Verification & Definition of Done (DoD)
- [x] TypeScript build passes with 0 errors (`tsc -b && vite build`).
- [x] Full browser automated testing:
  - Sidebar button navigation verified.
  - 4 skill tabs filter correctly (Writing: 3, Speaking: 3, Reading: 3, Listening: 3, Total: 12).
  - Preview modal opens with accurate skill content and IELTS rubrics.
  - Quick assign modal successfully deploys homework to classes.
- [x] Conforms to `convention-fe.md` (no inline styles, CSS classes used, strict types, i18n support).
- [x] Test guide placed in `production_artifacts/fe_to_tester/FE_EXAM_BANK_TEST_GUIDE.md`.
