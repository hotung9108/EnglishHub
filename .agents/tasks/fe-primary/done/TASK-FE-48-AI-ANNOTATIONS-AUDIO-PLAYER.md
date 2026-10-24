---
id: TASK-FE-48-AI-ANNOTATIONS-AUDIO-PLAYER
title: "AI Annotations Review & Real Audio Player for Teacher Submission Details"
role: fe-primary
assignee: Maloque18705
status: "Done"
created_at: 2026-10-24T11:00:00+07:00
updated_at: 2026-10-24T11:40:00+07:00
completed_at: 2026-10-24T11:40:00+07:00
priority: P0
tags: [frontend, teacher, grading, ai-annotations, audio-player, fe-48, bug-09, issue-151]
---

# TASK-FE-48-AI-ANNOTATIONS-AUDIO-PLAYER: AI Annotations Review & Real Audio Player

## 1. Context & Objective
Resolve blocker `BUG-09` and implement GitHub Issue `#151` (`[FE-48]`):
Enable teachers to listen to students' speaking audio recordings directly on the grading page with a real audio player (no fake toast), view AI suggestions segmented by character offsets, and accept (`ACCEPTED`) or reject (`REJECTED`) each AI annotation individually.

## 2. Completed Work
1. **Answer Annotation Service Integration (`answerAnnotationService`)**:
   - Integrated `answerAnnotationService` into `frontend/src/pages/TeacherSubmissionDetails.tsx`.
   - On submission module load, calls `answerAnnotationService.listAnnotations(targetAnswer.id)` to fetch annotations from `GET /api/v1/answers/{id}/annotations`.
   - Supports fallback/sync with `aiRes.annotations` returned by `gradingService.getAiSuggestion`.
   - Automatically re-fetches annotations after the teacher triggers AI grading (`handleTriggerAiAnalyze`).

2. **Interactive Annotation Review Actions**:
   - Implemented `handleReviewAnnotation(annotationId, status)`:
     - Sends `PATCH /api/v1/annotations/{id}/review` with `{ reviewStatus: 'ACCEPTED' }` or `{ reviewStatus: 'REJECTED' }`.
     - Optimistic UI state updates immediately with per-item loading states.
     - Displays brief, polite feedback toast notification.
     - Error handling via `parseApiError`.

3. **Royal Academic Design System UI for AI Annotations**:
   - Built segment annotation cards adhering to `.agents/rules/convention-fe.md` and `.agents/private/frontend-ui-standards`:
     - Header: Error category tag (e.g. `GRAMMAR`, `VOCABULARY`, `PRONUNCIATION`, `COHESION`), range offset `[startOffset - endOffset]`, and reusable `StatusBadge` (Green/Success for `ACCEPTED`, Red/Error for `REJECTED`, Yellow/Warning for `PENDING`).
     - Body: Text excerpt from student answer/transcript, suggested fix (`suggestedFix`), and pedagogical explanation (`comment`).
     - Actions: Reusable `Button` components for "Duyệt" (Accept) with `CheckCircle2` and "Từ chối" (Reject) with `XCircle`.
   - Minimalistic filter bar: `Tất cả (All)`, `Chờ duyệt (Pending)`, `Đã duyệt (Accepted)`, `Đã từ chối (Rejected)` with dynamic count pills.
   - Reusable `EmptyState` when no annotations exist.
   - Rendered in both Speaking Layout (left AI panel) and Standard Writing Layout (right sidebar).
   - Zero-bloat: no decorative fluff, no slogans, 8px grid alignment, and strictly zero inline styles.

4. **Real Audio Player & URL Resolution**:
   - Real HTML5 `<audio controls src={audioUrl}>` player playing student recordings via `resolveAudioUrl(audioStorageKey)`.
   - Rewrites MinIO internal URLs to Vite dev proxy `/s3-upload/englishhub-dev/...`.
   - Declarative audio error state (`audioErrorUrl`) with retry action.
   - Clean empty state banner when no recording is available.
   - Zero mock/fake toasts for audio playback.

5. **Automated Testing & Quality Verification**:
   - Added unit test suite in `frontend/src/api/__tests__/teacher-annotation-review.test.ts`.
   - All 148 tests passing (`npm test --prefix frontend`).
   - TypeScript compilation (`tsc -b`) passing with 0 errors.
   - ESLint check (`npm run lint --prefix frontend`) passing with 0 errors.
   - Test guide created in `production_artifacts/fe_to_tester/FE_48_AI_ANNOTATIONS_AUDIO_PLAYER_TEST_GUIDE.md`.
