# FE_48 Test Guide: AI Annotations Review & Real Audio Player for Teacher Grading Studio

## 1. Overview & Scope
- **Task ID**: `[FE-48]` (GitHub Issue `#151`, Resolves `BUG-09`, `[TASK-FE-24]`)
- **Assignee**: `@fe-primary` (`Maloque18705`)
- **Recipient**: `@tester` (`Zawn-Tsu`)
- **Target Component**:
  - `frontend/src/pages/TeacherSubmissionDetails.tsx`
  - `frontend/src/styles/teacher.css`
  - `frontend/src/api/services/answer-annotation.service.ts`
  - `frontend/src/api/__tests__/teacher-annotation-review.test.ts`
- **Dependencies**: Backend endpoints `[BE-42]` for S3 audio resolution and answer annotations (`GET /answers/{id}/annotations`, `PATCH /annotations/{id}/review`).

---

## 2. Key Changes & Features

### 2.1. Real Audio Player for Speaking Grading (`BUG-09` Resolution)
- **Real HTML5 Audio Playback**: Replaced mock toast (`showToast('Đang mở audio...')`) with a native `<audio controls src={audioUrl}>` player.
- **S3 & MinIO URL Resolution**: Storage keys like `submissions/{id}/module-{id}/audio.webm` are converted to `/s3-upload/englishhub-dev/...` via `resolveAudioUrl` for smooth streaming in Docker and dev environments.
- **Graceful Error Handling**: 
  - Declarative `audioError` state shows an error alert with a **Thử lại (Retry)** button.
  - Displays a clean empty state (`tsd-audio-empty`) if the student has not uploaded an audio file.

### 2.2. Full Integration with `answerAnnotationService`
- **API Fetching**: Calls `answerAnnotationService.listAnnotations(answerId)` when loading submission module data.
- **AI Annotations Display by Segment**:
  - Lists segment-level AI errors and suggestions with character range offsets (`[startOffset - endOffset]`).
  - Displays original snippet from student text or speech-to-text transcript.
  - Displays error category badge (e.g. `GRAMMAR`, `VOCABULARY`, `PRONUNCIATION`, `COHESION`), suggested correction (`suggestedFix`), and pedagogical explanation (`comment`).
- **Interactive Review Flow**:
  - **Duyệt (Accept)** button: Calls `PATCH /api/v1/annotations/{id}/review` with `{ reviewStatus: 'ACCEPTED' }`. Updates badge to green `StatusBadge` (`success`).
  - **Từ chối (Reject)** button: Calls `PATCH /api/v1/annotations/{id}/review` with `{ reviewStatus: 'REJECTED' }`. Updates badge to red `StatusBadge` (`error`).
  - Status indicator starts at yellow `StatusBadge` (`warning`) for `PENDING`.
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
  - If the audio fails to load (e.g. network disconnect), an error message appears with a "Thử lại" button.

### TC-FE48-02: Displaying AI Annotations by Segment
- **Preconditions**: A speaking or writing submission has been analyzed by AI (`ai-analyze`).
- **Steps**:
  1. Open the submission grading details page.
  2. Inspect the **"Nhận xét từ AI"** panel (in Speaking layout) or the sidebar (in Writing layout).
- **Expected Result**:
  - The section **"Gợi ý sửa lỗi theo đoạn"** appears with the total annotation count badge.
  - Each annotation card shows:
    - Error type tag (e.g., `GRAMMAR`, `PRONUNCIATION`, `VOCABULARY`).
    - Range offsets `[start - end]`.
    - Current review status (`Chờ duyệt`, `Đã duyệt`, or `Đã từ chối`).
    - Student text excerpt (in quotes).
    - AI suggested fix and explanation comment.

### TC-FE48-03: Teacher Accepts (Duyệt) an AI Annotation
- **Steps**:
  1. Locate an annotation with `Chờ duyệt` (Pending) status.
  2. Click the **"Duyệt" (Accept)** button.
- **Expected Result**:
  - Button enters loading state briefly.
  - Network request `PATCH /api/v1/annotations/:id/review` is sent with `{ reviewStatus: "ACCEPTED" }`.
  - Notification toast appears: *"Đã duyệt gợi ý của AI."*.
  - Status badge immediately switches to green **"Đã duyệt"**.
  - The "Chờ duyệt" counter decreases by 1, and "Đã duyệt" counter increases by 1.

### TC-FE48-04: Teacher Rejects (Từ chối) an AI Annotation
- **Steps**:
  1. Locate an annotation with `Chờ duyệt` (Pending) or `Đã duyệt` (Accepted) status.
  2. Click the **"Từ chối" (Reject)** button.
- **Expected Result**:
  - Button enters loading state briefly.
  - Network request `PATCH /api/v1/annotations/:id/review` is sent with `{ reviewStatus: "REJECTED" }`.
  - Notification toast appears: *"Đã từ chối gợi ý của AI."*.
  - Status badge immediately switches to red **"Đã từ chối"**.

### TC-FE48-05: Annotation Filtering Bar
- **Steps**:
  1. Click **"Chờ duyệt"**: Only pending annotations are displayed.
  2. Click **"Đã duyệt"**: Only accepted annotations are displayed.
  3. Click **"Đã từ chối"**: Only rejected annotations are displayed.
  4. Click **"Tất cả"**: All annotations are displayed.
- **Expected Result**:
  - Filter button active state highlights with Sovereign Green background (`--primary-light`).
  - EmptyState component appears gracefully if a filter contains zero items.

---

## 4. Automated Test Verification
Run the frontend unit test suite to verify test coverage:
```bash
npm test --prefix frontend
```
**Verification Evidence**:
- Test file: `frontend/src/api/__tests__/teacher-annotation-review.test.ts`
- 148/148 unit tests passing (100% pass rate).
- TypeScript check (`tsc -b`) and ESLint check passed with 0 errors.
