---
id: TASK-FE-47-REAL-AUDIO-RECORDER-SPEAKING
title: "Real Audio Recording (MediaRecorder) and S3 Direct Upload for Speaking"
role: fe-primary
assignee: Maloque18705
status: "Done"
created_at: 2026-10-19T09:30:00+07:00
updated_at: 2026-10-19T10:17:00+07:00
completed_at: 2026-10-19T10:17:00+07:00
priority: P0
tags: [frontend, speaking, media-recorder, audio-upload, s3, fe-47, bug-05]
---

# TASK-FE-47-REAL-AUDIO-RECORDER-SPEAKING: Real Audio Recording & S3 Upload for Speaking

## 1. Context & Objective
Resolve blocker `BUG-05` by replacing the simulated / mock timer in the Student Speaking workspace with real microphone audio capture using `MediaRecorder`, enabling audio preview before submission, and directly uploading the audio Blob to S3/MinIO via presigned URL so that backend and AI Service receive real audio for scoring.

## 2. Completed Work
1. **Hook `useAudioRecorder.ts`**:
   - Implemented in `frontend/src/hooks/useAudioRecorder.ts`.
   - Uses `navigator.mediaDevices.getUserMedia({ audio: true })` and `MediaRecorder`.
   - Captures chunks, generates binary `Blob`, provides temporary `audioUrl` via `URL.createObjectURL(blob)`.
   - Normalizes audio MIME type for backend compatibility (`audio/webm`, `audio/wav`, `audio/mpeg`).
   - Releases media tracks immediately on stop/unmount to release hardware microphone.
   - Comprehensive error handling for `NotAllowedError`, `NotFoundError`, and device busy errors.
2. **Service Layer**:
   - Updated `SubmitModulePayload` in `frontend/src/api/services/submission.service.ts` to support `audioStorageKey`.
   - Added unit test in `frontend/src/api/__tests__/submission.service.test.ts`.
   - Added unit test for MIME normalization in `frontend/src/api/__tests__/audio-recorder.test.ts`.
3. **Student Speaking Workspace (`StudentAssignmentSpeaking.tsx`)**:
   - Integrated `useAudioRecorder`.
   - Added real HTML5 audio playback with play/pause and time tracking for preview before submission.
   - Replaced simulated submit with 3-step direct S3 upload flow:
     1. `getAudioUploadUrl` (`POST /api/v1/submission-modules/{id}/audio-upload-url`).
     2. Direct HTTP `PUT` to object storage with `audioBlob`.
     3. `submitModule` sending `{ audioStorageKey: storageKey }` (no longer empty `{}`).
   - Enhanced resilience: surfaces backend API errors cleanly using `parseApiError`, checks assignment status (blocks recording/submission if assignment is in `DRAFT` or `CLOSED`), and prevents silent failures.
4. **Vite Local Storage Proxy (`frontend/vite.config.ts`)**:
   - Configured `/s3-upload` proxy in Vite dev server with `Host: minio:9000` to bridge browser on host with Docker MinIO container seamlessly while preserving AWS S3 V4 Host signature.
5. **Verification**:
   - `npm test`: 109/109 tests passing.
   - `npm run lint`: 0 ESLint errors.
   - `npm run build`: Vite build passes cleanly.
   - End-to-end verified with backend and MinIO: audio uploaded and module status updated to `SUBMITTED`.
   - Created QA test instructions in `production_artifacts/fe_to_tester/FE_47_SPEAKING_REAL_MEDIA_RECORDER_TEST_GUIDE.md`.
