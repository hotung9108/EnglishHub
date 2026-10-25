# FE_48 Test Guide: AI Annotations Review & Real Audio Player for Teacher Grading Studio

## 1. Overview & Scope
- **Task ID**: `[FE-48]` (GitHub Issue `#151`, Resolves `BUG-09`, `[TASK-FE-24]`)
- **Assignee**: `@fe-primary` (`Maloque18705`)
- **Recipient**: `@tester` (`Zawn-Tsu`)
- **Target Components**:
  - `frontend/src/pages/TeacherSubmissionDetails.tsx`
  - `frontend/src/pages/StudentSubmissionResult.tsx`
  - `frontend/src/styles/teacher.css`
  - `frontend/src/api/services/answer-annotation.service.ts`
  - `frontend/src/api/__tests__/teacher-annotation-review.test.ts`
- **Dependencies**: Backend endpoints `[BE-42]` for S3 audio resolution and answer annotations (`GET /answers/{id}/annotations`, `POST /answers/{id}/annotations`, `PATCH /annotations/{id}/review`, `DELETE /annotations/{id}`).

---

## 2. Key Changes & Features

### 2.1. Real Audio Player for Speaking Grading (`BUG-09` Resolution)
- **Real HTML5 Audio Playback**: Replaced mock toast (`showToast('Đang mở audio...')`) with a native `<audio controls src={audioUrl}>` player.
- **S3 & MinIO URL Resolution**: Storage keys like `submissions/{id}/module-{id}/audio.webm` are converted to `/s3-upload/englishhub-dev/...` via `resolveAudioUrl` for smooth streaming in Docker and dev environments.
- **Graceful Error Handling**: 
  - Declarative `audioError` state shows an error alert with a **Thử lại (Retry)** button.
  - Displays a clean empty state (`tsd-audio-empty`) if the student has not uploaded an audio file.

### 2.2. Full Integration with `answerAnnotationService` (Teacher & Student Flows)
- **API Fetching (`listAnnotations`)**:
  - `TeacherSubmissionDetails.tsx` calls `answerAnnotationService.listAnnotations(answerId)` to load all AI and teacher annotations.
  - `StudentSubmissionResult.tsx` calls `answerAnnotationService.listAnnotations(answerId)` (accessible to both `TEACHER` and `STUDENT` roles) and filters to display only `ACCEPTED` annotations.
- **Safe Text & Transcript Excerpt Slicing**:
  - Prevents `null` answer content (in Speaking or document upload modules) from being stringified into `"null"`.
  - Extracts snippets from either student text or speech-to-text transcript (`aiSuggestion.transcript` / `gradingDetail.aiTranscript`).
- **Interactive Review, Creation & Deletion Flows**:
  - **Duyệt (Accept)** button (`ann.source === 'AI'`): Calls `PATCH /api/v1/annotations/{id}/review` with `{ reviewStatus: 'ACCEPTED' }`. Updates badge to green `StatusBadge` (`success`).
  - **Từ chối (Reject)** button (`ann.source === 'AI'`): Calls `PATCH /api/v1/annotations/{id}/review` with `{ reviewStatus: 'REJECTED' }`. Updates badge to red `StatusBadge` (`error`).
  - **Thêm chú thích (Add Annotation)**: Inline form calling `POST /api/v1/answers/{id}/annotations` (`createAnnotation`), immediately adding the teacher annotation with `ACCEPTED` status (without showing redundant Accept/Reject buttons).
  - **Xóa (Delete)**: Button calling `DELETE /api/v1/annotations/{id}` (`deleteAnnotation`).
- **Filtering & Navigation**:
  - Minimalistic filter buttons: `Tất cả (All)`, `Chờ duyệt (Pending)`, `Đã duyệt (Accepted)`, `Đã từ chối (Rejected)` with dynamic counter badges.
  - Displays `EmptyState` component when no annotations match the selected filter.
- **Design System Adherence**: 100% compliant with **Royal Academic Theme** (Warm Ivory `#faf8f5`, Sovereign Green `#1b4d3e`, Lora serif headings, Plus Jakarta Sans body, Zero-Bloat, 8px grid spacing, no inline styles).

---

## 3. Test Cases for QA

### TC-FE48-01: Real Audio Playback on Speaking Submission
- **Preconditions**: A student has submitted a speaking exercise with a valid recorded audio file.
- **Steps**:
  1. Log in as Teacher (`teacher@englishhub.edu.vn`).
  2. Navigate to `/teacher/assignments/:assignmentId/submissions/:studentId`.
  3. Ensure the active module is **SPEAKING**.
- **Expected Result**:
  - Top hero section displays the audio bar with the `<audio controls>` player.
  - Clicking Play successfully streams and plays the student's voice recording.
  - No fake toast messages appear when playing audio.
  - If the audio fails to load, an error message appears with a "Thử lại" button.

### TC-FE48-02: Displaying AI Annotations by Segment (Without `"null"` Snippets)
- **Preconditions**: A speaking or writing submission has been analyzed by AI (`ai-analyze`).
- **Steps**:
  1. Open the submission grading details page.
  2. Inspect the **"Nhận xét từ AI"** panel (in Speaking layout) or the sidebar (in Writing layout).
- **Expected Result**:
  - The section **"Gợi ý sửa lỗi theo đoạn"** appears with the total annotation count badge.
  - Each annotation card shows error type tag, range offsets `[start - end]`, review status, student excerpt (when available, never `"null"`), AI suggested fix, and explanation comment.

### TC-FE48-03: Teacher Accepts (Duyệt) & Rejects (Từ chối) AI Annotations
- **Steps**:
  1. Locate an AI annotation (`source === 'AI'`) with `Chờ duyệt` status.
  2. Click **"Duyệt" (Accept)** -> verifies `PATCH /api/v1/annotations/:id/review` with `{ reviewStatus: "ACCEPTED" }` and green badge.
  3. Click **"Từ chối" (Reject)** -> verifies `PATCH /api/v1/annotations/:id/review` with `{ reviewStatus: "REJECTED" }` and red badge.

### TC-FE48-04: Teacher Creates & Deletes Manual Annotation
- **Steps**:
  1. Click **"Thêm chú thích"** in the annotations header.
  2. Select error type, enter suggested fix and comment, then click **"Lưu chú thích"**.
  3. Click **"Xóa"** on an annotation card.
- **Expected Result**:
  - `POST /api/v1/answers/:id/annotations` creates the teacher annotation with `Đã duyệt` status and `Giáo viên` badge (Accept/Reject buttons are hidden for teacher-authored annotations).
  - Clicking **"Xóa"** sends `DELETE /api/v1/annotations/:id` and removes the item from the list.

### TC-FE48-05: Student Views Approved Annotations on Result Page
- **Steps**:
  1. Log in as the Student who submitted the assignment.
  2. Open `/student/submissions/:id` or `/student/assignments/:id/result`.
- **Expected Result**:
  - Page calls `GET /api/v1/answers/:id/annotations` (`200 OK`) and displays all annotations with `reviewStatus === 'ACCEPTED'` for both Writing and Speaking skills.

---

## 4. Automated Test Verification
Run the frontend unit test suite to verify test coverage:
```bash
npm test --prefix frontend
```
**Verification Evidence**:
- Test file: `frontend/src/api/__tests__/teacher-annotation-review.test.ts`
- 153/153 unit tests passing (100% pass rate).
- TypeScript check (`tsc -b`) and ESLint check passed with 0 errors.
