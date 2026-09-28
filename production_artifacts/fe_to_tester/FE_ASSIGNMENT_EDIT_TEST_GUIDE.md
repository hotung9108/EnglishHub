# Frontend Deliverable & Test Instructions: Teacher Assignment Editing & 4-Skill Workspaces

> **Task ID**: `TASK-FE-ASSIGNMENT-EDIT`  
> **Agent**: `@fe-primary` (Git User: `Maloque18705`)  
> **Feature**: Teacher Assignment Edit with Dedicated Workspaces for 4 Skills (Writing, Speaking, Reading, Listening)  
> **Target Branch**: `feature/teacher-assignment-edit`  
> **Date**: 2026-09-26  

---

## 1. Summary of Changes

We have implemented a comprehensive, responsive, and synchronized exercise assignment & editing suite for teachers in EnglishHub:

1. **New Pages & Routes**:
   - `/teacher/assignments/:id/edit` (and fallback `/teacher/assignments/edit/:id`): Master assignment editing page (`TeacherEditAssignment.tsx`).
   - Integrated into `App.tsx` under protected teacher routes (`ProtectedRoute allowedRoles={['teacher']}`).

2. **Skill-Specific Editor Components (`src/components/assignments/editor/`)**:
   - `SkillWritingEditor.tsx`:
     - IELTS Task 1 (Report/Chart) vs Task 2 (Discursive Essay) vs Custom formats.
     - Rich prompt topic textarea with formatting toolbar (Bold, Italic, Underline, List).
     - Task 1 graphic/chart uploader & preview.
     - 4 IELTS Writing Rubrics: Task Response (TR), Coherence & Cohesion (CC), Lexical Resource (LR), Grammatical Range & Accuracy (GRA) with real-time percentage sum validation.
     - Custom AI prompt instruction textarea for grading guidance.
     - Plagiarism and AI generation detection toggle.
     - Band 8.0+ model answer benchmark and file attachments manager.
   - `SkillSpeakingEditor.tsx`:
     - IELTS Speaking Part 1, Part 2 (Cue card), Part 3 (Discussion), and Full Mock test.
     - IELTS Candidate Cue Card container with topic headline and dynamic bullet points list ("You should say:").
     - Preparation timer (e.g. 60s) and speaking duration limit (e.g. 120s), plus retry limits.
     - Examiner sample audio player mock with waveform bar, playback controls, and spoken transcript.
     - Follow-up discussion questions builder.
     - 4 IELTS Speaking Rubrics: Fluency & Coherence (FC), Lexical Resource (LR), Grammatical Range (GRA), Pronunciation (PR) + AI speech phonetic diagnostics.
   - `SkillReadingEditor.tsx`:
     - Academic reading passage manager with dynamic word counter.
     - Labeled paragraph cards ([Paragraph A], [Paragraph B], [Paragraph C], [Paragraph D]...) with subheadings and content editors.
     - Interactive Student Reading View simulation with font resizer (A-/A+) and highlighting tools.
     - Interactive Question Builder supporting 4 types: Multiple Choice (A-D with correct radio), True/False/Not Given, Matching Headings, and Gap Fill with word limits (NO MORE THAN X WORDS).
     - Clue explanations for automated AI scoring and student review.
   - `SkillListeningEditor.tsx`:
     - Audio track management with audio title, storage key/URL, and play frequency rules (Single play for exam vs 2 plays for practice vs unlimited).
     - Interactive dark-themed audio player with play/pause, time tracker (e.g. 04:12 / 30:00), and animated waveform.
     - Audio transcript editor with clickable timestamp tags (e.g. `[01:25]`) and toggle to hide transcript during test.
     - Section-based question sets (Sections 1-4) with Form Completion, Multiple Choice, and timestamp clue markers.
     - AI Distractor and trap detector configuration.
   - `AssignmentPreviewModal.tsx`:
     - Instant interactive student view preview modal allowing teachers to test the student exam experience across all 4 skills before publishing.

3. **Enhanced Assignment Navigation**:
   - `TeacherAssignments.tsx`: Added dedicated **"Chỉnh sửa"** (Edit) button on every assignment card (HW-01 to HW-05) alongside the evaluation button, navigating directly to `/teacher/assignments/:id/edit`.
   - `TeacherAssignmentDetails.tsx`: Wired the top-right **"Chỉnh sửa bài tập"** (`btnEdit`) button to navigate to `/teacher/assignments/:id/edit`.
   - `TeacherCreateAssignment.tsx`: Upgraded to leverage the 4 skill editors when creating new assignments with `?type=writing | speaking | reading | listening`.

4. **Design System & Styling**:
   - Created `src/styles/teacher-assignment-edit.css` with CSS variables from `index.css`.
   - Imported in `src/main.tsx` and used throughout the assignment suite.

---

## 2. Test Verification Instructions for `@tester`

### Test Case 1: Navigation from Assignment List
1. Open browser at `http://localhost:5173/login`.
2. Select role **Giáo viên (Teacher)** and log in.
3. Navigate to `http://localhost:5173/teacher/assignments`.
4. Verify that each assignment card displays both an **"Chỉnh sửa"** button (gray secondary) and an action button (**"Chấm bài ngay"** or **"Xem kết quả"**).
5. Click **"Chỉnh sửa"** on **HW-02: Speaking Part 2**.
6. **Expected Result**: URL changes to `/teacher/assignments/2/edit`. The page loads with Speaking tab selected by default, displaying the Cue Card and examiner audio player.

### Test Case 2: Navigation from Assignment Details Page
1. On `http://localhost:5173/teacher/assignments`, click the title of **HW-01** to open `/teacher/assignments/1`.
2. Locate the **"Chỉnh sửa bài tập"** button with the pencil icon at the top right of the page.
3. Click the button.
4. **Expected Result**: URL navigates to `/teacher/assignments/1/edit`, loading HW-01 Writing Task 2 pre-filled data.

### Test Case 3: Switching Skill Tabs & Editor Workspaces
1. On `/teacher/assignments/2/edit`:
   - Click **"Writing (Kỹ năng Viết)"** tab: Verify prompt text, word count counter, 4 criteria weights (TR, CC, LR, GRA), and sample model essay box.
   - Click **"Speaking (Kỹ năng Nói)"** tab: Verify candidate cue card topic, bullet points ("You should say"), prep timer, audio player, and AI speech rubrics.
   - Click **"Reading (Kỹ năng Đọc)"** tab: Verify passage title, paragraphs A-D with word counts, and question builder. Click **"Xem thử bài đọc"** and test A-/A+ font resizer.
   - Click **"Listening (Kỹ năng Nghe)"** tab: Verify audio track player, playback limit dropdown, transcript with timestamps, and Section 1-4 pills.
2. **Expected Result**: Seamless tab transitions without page reload or state corruption.

### Test Case 4: Student View Interactive Preview Modal
1. On `/teacher/assignments/2/edit`, click **"Xem thử giao diện học viên"** on the sticky bottom bar.
2. **Expected Result**: An elegant preview modal opens over the page, displaying the student exam runner interface corresponding to the active skill.
3. Click the close button (X) or "Đóng xem thử".
4. **Expected Result**: Modal closes smoothly, returning to the editor.

### Test Case 5: Save Draft & Publish
1. On `/teacher/assignments/2/edit`, click **"Lưu bản nháp"**.
2. **Expected Result**: Auto-save indicator updates timestamp and a green toast notification *"Đã lưu bản nháp bài tập thành công!"* pops up at the bottom right.
3. Click **"Cập nhật & Xuất bản"**.
4. **Expected Result**: Toast notification *"Cập nhật và xuất bản bài tập thành công!"* appears, followed by automated redirection to `/teacher/assignments`.
