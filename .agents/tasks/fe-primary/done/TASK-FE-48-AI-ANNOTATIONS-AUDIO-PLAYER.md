---
id: TASK-FE-48-AI-ANNOTATIONS-AUDIO-PLAYER
title: "AI Annotations Review & Real Audio Player for Teacher Submission Details"
role: fe-primary
assignee: Maloque18705
status: "Done"
created_at: 2026-10-24T11:00:00+07:00
updated_at: 2026-10-24T18:40:00+07:00
completed_at: 2026-10-24T18:40:00+07:00
priority: P0
tags: [frontend, teacher, student, grading, ai-annotations, audio-player, fe-48, bug-09, issue-151]
---

# TASK-FE-48-AI-ANNOTATIONS-AUDIO-PLAYER: AI Annotations Review & Real Audio Player

## 1. Context & Objective
Resolve blocker `BUG-09` and implement GitHub Issue `#151` (`[FE-48]`):
Enable teachers to listen to students' speaking audio recordings directly on the grading page with a real audio player (no fake toast), view AI suggestions segmented by character offsets, accept (`ACCEPTED`) or reject (`REJECTED`) each AI annotation individually, create/delete annotations, and allow students to view approved annotations on their result page.

## 2. Completed Work
1. **Full `answerAnnotationService` Integration (Teacher & Student)**:
   - Integrated all 4 methods of `answerAnnotationService` (`listAnnotations`, `createAnnotation`, `reviewAnnotation`, `deleteAnnotation`) into `frontend/src/pages/TeacherSubmissionDetails.tsx`.
   - Integrated `answerAnnotationService.listAnnotations(targetAnswer.id)` into `frontend/src/pages/StudentSubmissionResult.tsx` so students can view teacher-approved (`ACCEPTED`) annotations for both Writing and Speaking without hitting `403 Forbidden` on `/grading/ai-suggestion`.
   - Fixed `null` answer content handling in `TeacherSubmissionDetails.tsx` and `StudentSubmissionResult.tsx` so Speaking and file-upload submissions never stringify `null` into `"null"` excerpts.

2. **Interactive Annotation Review, Creation & Deletion**:
   - `handleReviewAnnotation(annotationId, status)`: Sends `PATCH /api/v1/annotations/{id}/review` with `{ reviewStatus: 'ACCEPTED' | 'REJECTED' }` (rendered exclusively for `ann.source === 'AI'`).
   - `handleCreateAnnotation()`: Sends `POST /api/v1/answers/{id}/annotations` via an inline Royal Academic form, creating a `TEACHER` annotation with `ACCEPTED` status.
   - `handleDeleteAnnotation(annotationId)`: Sends `DELETE /api/v1/annotations/{id}` and removes the annotation from UI state.

3. **Royal Academic Design System UI**:
   - Built segment annotation cards and inline creation form adhering to `.agents/rules/convention-fe.md` and `.agents/private/frontend-ui-standards/SKILL.md`.
   - Zero-bloat, 8px grid alignment, reusable `Button`, `StatusBadge`, and `EmptyState` components, and strictly zero inline styles.

4. **Real Audio Player & URL Resolution**:
   - Real HTML5 `<audio controls src={audioUrl}>` player playing student recordings via `resolveAudioUrl(audioStorageKey)`.
   - Declarative audio error state (`audioErrorUrl`) with retry action and polite empty state banner.

5. **Automated Testing & Quality Verification**:
   - Added unit test suite in `frontend/src/api/__tests__/teacher-annotation-review.test.ts`.
   - All 153 tests passing (`npm test --prefix frontend`).
   - TypeScript compilation (`tsc -b`) and Vite build passing with 0 errors.
   - ESLint check (`npm run lint --prefix frontend`) passing with 0 errors.
   - Test guide updated in `production_artifacts/fe_to_tester/FE_48_AI_ANNOTATIONS_AUDIO_PLAYER_TEST_GUIDE.md`.
