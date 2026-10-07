---
id: TASK-FE-08-STUDENT-PORTAL-REAL-API
title: "Real API Integration for Student Portal Subsystems (FE-07, FE-08, FE-12, FE-13)"
role: fe-primary
assignee: Maloque18705
status: "Done"
created_at: 2026-10-07T10:00:00+07:00
updated_at: 2026-10-07T11:40:00+07:00
completed_at: 2026-10-07T11:40:00+07:00
priority: P0
tags: [frontend, student-portal, real-api, assignments, grading, submissions, analytics, grades, fe-08]
---

# TASK-FE-08-STUDENT-PORTAL-REAL-API: Real API Integration for Student Portal

## 1. Context & Objective
Verify and complete real API integration for the entire Student Portal (Học viên) following the Frontend Gap Analysis Report (`docs/FRONTEND_MISSING_PAGES_REPORT.md`) before ticking `[FE-08]` Done.

- **Scope**: `[FE-07]`, `[FE-08]`, `[FE-12]`, `[FE-13]` — Dashboard, assignment taking (Writing, Reading, Listening, Speaking), assignment submission, submission results & grading, grade book (bảng điểm), 4-skill analytics (phân tích năng lực), classes, feedback inbox, and workspace.
- **Inputs**: `[BE-15]` API Assignments, `[BE-18]` API Assignments submission & modules, `[BE-19]` API Grading & AI suggestions, `[BE-20]` API Student Evaluation.
- **Outputs**: All Student pages running on real backend endpoints and live data.

## 2. Completed Scope & Definition of Done (DoD) Fulfillment

### 2.1. Elimination of "Coming Soon" & Route Alignment
- Audited all Student Portal views against `FRONTEND_MISSING_PAGES_REPORT.md`.
- Confirmed **0 remaining instances** of "Coming Soon" or unhandled placeholder cards across the codebase.
- Full route registrations verified in `App.tsx` and `Sidebar.tsx`:
  - `/student/dashboard` -> `StudentDashboard.tsx`
  - `/student/assignments` -> `StudentAssignments.tsx`
  - `/student/assignments/:id/overview` -> `StudentAssignmentOverview.tsx`
  - `/student/assignments/:id` -> `StudentAssignmentWriting.tsx`
  - `/student/assignments/reading/:id` -> `StudentAssignmentReading.tsx`
  - `/student/assignments/listening/:id` -> `StudentAssignmentListening.tsx`
  - `/student/assignments/speaking/:id` -> `StudentAssignmentSpeaking.tsx`
  - `/student/assignments/:id/result` & `/student/submissions/:id` -> `StudentSubmissionResult.tsx`
  - `/student/grades` -> `StudentGrades.tsx`
  - `/student/analytics` -> `StudentAnalytics.tsx`
  - `/student/classes` -> `StudentClasses.tsx`
  - `/student/classes/:id` -> `StudentClassDetails.tsx`
  - `/student/feedback` -> `StudentFeedback.tsx`
  - `/student/workspace` -> `StudentWorkspace.tsx`

### 2.2. Service Layer Enhancements
- `moduleService` (`src/api/services/module.service.ts`): Module listing and CRUD.
- `questionService` (`src/api/services/question.service.ts`): Question listing and CRUD.
- `submissionService` (`src/api/services/submission.service.ts`):
  - `submitModule(submissionModuleId, payload)`: Posts answers to `/api/v1/submission-modules/{id}/submit`.
  - `getSubmissionModuleDetail(id)`: Detailed questions and student answers.
  - `getAudioUploadUrl()` and `getDocumentUploadUrl()`: Pre-signed/multipart upload key handling.
  - Unit tests added in `submission.service.test.ts`.

### 2.3. End-to-End Workflow Integration
1. **Assignment Taking Flow**:
   - `StudentAssignmentOverview`: Fetches live assignment metadata and historical attempts via `submissionService.listSubmissions`. Displays remaining attempts, best/latest score, and initiates attempt via `submissionService.startAttempt`.
   - `StudentAssignmentWriting`: Loads module prompt, word counter, draft autosave to `localStorage`, file upload, module submit, and attempt finalization.
   - `StudentAssignmentReading`: Loads reading passages and questions via `questionService`, navigates questions, selects radio options, submits answers.
   - `StudentAssignmentListening`: Loads audio player, question list, submits answers.
   - `StudentAssignmentSpeaking`: Microphone recorder with timer, audio waveform state, notes, audio submit.
2. **Submission & Results Flow**:
   - `StudentSubmissionResult`: Fetches submission by ID, checks grading status (`PENDING`, `AI_GRADED`, `COMPLETED`), fetches AI suggestion (`gradingService.getAiSuggestion`) and grading details (`gradingService.getById`). Renders criteria breakdown, annotations, and teacher comments.
3. **Assessment & Academic Monitoring**:
   - `StudentGrades`: Aggregates submissions with assignments and enrolled classes. Dynamic IELTS Band conversion, cumulative overall band, filtered by skill and class, export transcript to PDF.
   - `StudentAnalytics`: Integrates `reportService.getStudentProgress` for 4-skill competency radar, percentile ranking, dynamic strengths/weaknesses from AI, and targeted remedial drill recommendations.
   - `StudentClasses` & `StudentClassDetails`: Real class summaries, enrolled assignments, deadlines, and grade statuses.
   - `StudentFeedback`: Combines `studentEvaluationService.list` (`[BE-20]`) with submission grading suggestions.
   - `StudentWorkspace`: Manages ongoing `IN_PROGRESS` drafts from backend and `localStorage`, persistent study notebook.

### 2.4. Loading, Error, and Empty States
- Every page contains responsive skeleton loaders during initial query.
- Error alerts with retry buttons (`RotateCcw`) handling backend or network failures gracefully.
- Explicit empty states for submissions, classes, drafts, and feedback.

### 2.5. Verification
- `npm test`: **71 passed, 0 failed**.
- `npm run build`: `tsc -b && vite build` passed with **0 errors**.
- Test artifact: `production_artifacts/fe_to_tester/FE_STUDENT_PORTAL_REAL_API_TEST_GUIDE.md`.
