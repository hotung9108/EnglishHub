---
id: TASK-FE-ASSIGNMENT-EDIT
title: "Teacher Assignment Edit & Skill-Specific Pages (Writing, Speaking, Reading, Listening)"
role: fe-primary
assignee: Maloque18705
status: "Done"
created_at: 2026-09-26T20:17:00+07:00
updated_at: 2026-09-26T20:40:00+07:00
priority: P0
tags: [frontend, teacher, assignments, edit, skills, listening, reading, writing, speaking]
---

# TASK-FE-ASSIGNMENT-EDIT: Teacher Assignment Edit & Skill-Specific Editing Workspaces

## Objective
Implement a comprehensive, synchronized assignment editing suite for teachers in EnglishHub.
When teachers click on existing assignments (or the edit action), allow them to edit the assignment with tailored interfaces for each of the 4 English skills:
1. **Writing**: IELTS Task 1 & Task 2, prompt, word count, rubric weights, AI prompt instructions, sample essay, attachments.
2. **Speaking**: Part 1/2/3, Cue card topics, preparation timer, speaking limit, audio prompt/model examiner audio, pronunciation & fluency rubrics.
3. **Reading**: Passage management (rich paragraphs with A-E markers, word count), live split preview, interactive question builder (Multiple choice, True/False/Not Given, Matching Headings, Gap Fill), answer keys with explanations.
4. **Listening**: Audio track upload/preview, player controls, transcript with timestamp markers, section-based questions builder, answer keys with timestamps.

## Implementation Details
- Created `frontend/src/pages/TeacherEditAssignment.tsx` mapped to `/teacher/assignments/:id/edit` and `/teacher/assignments/edit/:id`.
- Created 4 dedicated skill editors in `frontend/src/components/assignments/editor/`:
  - `SkillWritingEditor.tsx`
  - `SkillSpeakingEditor.tsx`
  - `SkillReadingEditor.tsx`
  - `SkillListeningEditor.tsx`
- Created `AssignmentPreviewModal.tsx` for real-time student view preview.
- Created `teacher-assignment-edit.css` leveraging design tokens from `index.css`.
- Updated `TeacherAssignments.tsx` with dedicated "Chỉnh sửa" buttons on every assignment card.
- Updated `TeacherAssignmentDetails.tsx` top-right "Chỉnh sửa bài tập" button.
- Updated `TeacherCreateAssignment.tsx` to leverage the 4 skill editors when creating new assignments.
- Test instructions placed in `production_artifacts/fe_to_tester/FE_ASSIGNMENT_EDIT_TEST_GUIDE.md`.
- End-to-end browser subagent verification completed with recording and screenshots.
