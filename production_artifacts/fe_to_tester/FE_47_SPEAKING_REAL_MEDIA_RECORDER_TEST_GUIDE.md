# FE_47 Test Guide: Real MediaRecorder Audio Capture & S3 Direct Upload for Speaking

## 1. Overview & Scope
- **Task ID**: `[FE-47]` / `[TASK-FE-22]` (Resolved Blocker `BUG-05`)
- **Assignee**: `@fe-primary` (`Maloque18705`)
- **Recipient**: `@tester` (`Zawn-Tsu`)
- **Affected Components**:
  - `frontend/src/hooks/useAudioRecorder.ts` (New hook)
  - `frontend/src/pages/StudentAssignmentSpeaking.tsx`
  - `frontend/src/api/services/submission.service.ts`

---

## 2. Key Changes & Features
1. **Real MediaRecorder Integration (`useAudioRecorder.ts`)**:
   - Replaced fake timer / mock state with `navigator.mediaDevices.getUserMedia({ audio: true })` and `window.MediaRecorder`.
   - Audio tracks are automatically closed when recording stops to release microphone hardware.
   - Converts audio chunks into binary `Blob` and generates a temporary `audioUrl` (`URL.createObjectURL(blob)`).
   - Graceful permission handling: Displays clear notification when user denies microphone access or no microphone device is found.

2. **Audio Preview UI (Hear before submit)**:
   - Real HTML5 `<audio>` player allows students to listen to their own voice recording before submitting.
   - Play / Pause controls with duration and elapsed playback time counter.
   - Re-record button ("Thu âm lại") resets the recorder, revokes previous object URLs to prevent memory leaks, and allows capturing a fresh attempt.

3. **Presigned S3/MinIO Direct Upload Flow**:
   - `POST /api/v1/submission-modules/{id}/audio-upload-url` with `{ mimeType: 'audio/webm' }`.
   - Direct HTTP `PUT` to `uploadUrl` with binary `Blob` and header `Content-Type: audio/webm` (no Authorization header sent to S3).
   - `POST /api/v1/submission-modules/{id}/submit` with `{ audioStorageKey: storageKey }`.
   - Backend automatically detects the uploaded audio file and updates `audioUploadStatus = READY` and `audioStorageKey`.

---

## 3. Test Cases for QA

### TC-FE47-01: Microphone Permission Handling
- **Steps**:
  1. Login as Student, navigate to Speaking test (`/student/assignments/speaking/:id`).
  2. Click Microphone button.
  3. When browser prompts for Microphone permission, select **Block / Deny**.
- **Expected Result**:
  - Error banner displays: *"Bạn đã từ chối quyền truy cập microphone. Vui lòng cho phép quyền microphone trên trình duyệt để ghi âm."*
  - Record button does not get stuck in active state.

### TC-FE47-02: Real Voice Recording & Preview
- **Steps**:
  1. Grant microphone access.
  2. Click Microphone button to start recording. Speak for 5-10 seconds.
  3. Click Microphone button again (or stop) to stop recording.
- **Expected Result**:
  - Waveform bars animate while recording.
  - Timer shows elapsed seconds accurately.
  - Microphone indicator disappears from browser address bar once stopped.
  - Recording box displays file size (e.g., `X.X KB`) and duration.
  - Clicking "Play" plays the actual recorded voice clearly.

### TC-FE47-03: Re-record (Reset)
- **Steps**:
  1. After stopping a recording, click the "Thu âm lại từ đầu" (RotateCcw) icon.
- **Expected Result**:
  - Audio playback stops, previous audio URL is revoked.
  - Status resets to "Chưa có bản ghi âm", ready for a new attempt.

### TC-FE47-04: Submission with Direct S3 Upload & Non-empty audioStorageKey
- **Steps**:
  1. Record an audio clip.
  2. Click "Nộp bài".
  3. Inspect Browser Network tab:
     - `POST /api/v1/submission-modules/{id}/audio-upload-url`: Returns `200` with `uploadUrl` and `storageKey`.
     - `PUT <uploadUrl>`: Returns `200` / `204` with binary audio payload.
     - `POST /api/v1/submission-modules/{id}/submit`: Request payload is `{ audioStorageKey: "submissions/..." }` (no longer `{}`).
     - Response contains `answers[0].audioUploadStatus: "READY"`.
- **Expected Result**:
  - Success banner appears, redirects to submission result page.
  - In submission results, student can review the submitted audio file.

---

## 4. Automated Tests
Run:
```bash
cd frontend
npm test
npm run lint
npm run build
```
All 107 tests passing, ESLint clean, and Vite build passes without TypeScript errors.
