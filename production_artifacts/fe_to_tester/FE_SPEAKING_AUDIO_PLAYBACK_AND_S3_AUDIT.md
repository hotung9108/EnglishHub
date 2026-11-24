# FE Handoff to Tester: Speaking Audio Playback & S3 Bucket Audit
**Task**: Speaking Audio Playback URL Resolution & Error State Modernization  
**Role**: Frontend Developer Primary (`@fe-primary` / `Maloque18705`)  
**Date**: 2026-10-24  
**Detailed Audit Document**: [docs/features/S3_PRIVATE_BUCKET_SPEAKING_AUDIO_AUDIT.md](file:///d:/Coding/EnglishHub/docs/features/S3_PRIVATE_BUCKET_SPEAKING_AUDIO_AUDIT.md)

---

## 1. Scope of Frontend Changes
1. **Utility Single Source of Truth**:
   - Created [frontend/src/utils/audioUrl.utils.ts](file:///d:/Coding/EnglishHub/frontend/src/utils/audioUrl.utils.ts) with `resolveAudioUrl(storageKey?: string | null): string`.
   - Replaced fragmented ad-hoc implementations across Student and Teacher pages.
   - Automatically prefixes missing bucket name `englishhub-dev/` for relative storage keys, rewrites Docker host `//minio:9000/` to Vite proxy `/s3-upload/`, and preserves CDN absolute URLs.
2. **UI & State Handling**:
   - Updated [StudentSubmissionResult.tsx](file:///d:/Coding/EnglishHub/frontend/src/pages/StudentSubmissionResult.tsx) and [TeacherSubmissionDetails.tsx](file:///d:/Coding/EnglishHub/frontend/src/pages/TeacherSubmissionDetails.tsx).
   - Added responsive error state with retry action button (`variant="secondary"`, icon `RefreshCw`).
   - Styled via CSS tokens in [student-result.css](file:///d:/Coding/EnglishHub/frontend/src/styles/student-result.css) and [teacher.css](file:///d:/Coding/EnglishHub/frontend/src/styles/teacher.css) adhering strictly to Royal Academic theme and zero inline styles.
3. **Automated Unit Tests**:
   - Created [frontend/src/api/__tests__/audioUrl.test.ts](file:///d:/Coding/EnglishHub/frontend/src/api/__tests__/audioUrl.test.ts).

---

## 2. Verification Steps for QA (`@tester`)

### Automated Verification
```powershell
# 1. Run unit tests for audio URL resolution
npm --prefix frontend run test audioUrl

# 2. Run entire frontend test suite
npm --prefix frontend run test

# 3. Verify TypeScript build and Vite packaging
npm --prefix frontend run build
```

### Manual Verification
1. **Student Submission Result** (`/student/results/:submissionModuleId`):
   - Access a Speaking submission module that has been graded by AI.
   - If S3 bucket is private (returns 403), verify the audio error card is displayed with message:
     *"Không thể tải tệp âm thanh bài nói từ kho lưu trữ (S3/MinIO)"* (in Vietnamese) or *"Unable to load speaking audio from storage (S3/MinIO)"* (in English).
   - Click the "Thử lại" / "Retry" button and verify audio element attempts to reload.
2. **Teacher Submission Details** (`/teacher/submissions/:submissionId/module/:moduleId`):
   - Access the teacher grading screen for a Speaking submission.
   - Verify that the audio player displays the matching error card and retry button if playback fails.
   - Verify layout adheres to Royal Academic design tokens with no visual clashing.

---

## 3. Important Notice on S3 Private Bucket 403
As detailed in [docs/features/S3_PRIVATE_BUCKET_SPEAKING_AUDIO_AUDIT.md](file:///d:/Coding/EnglishHub/docs/features/S3_PRIVATE_BUCKET_SPEAKING_AUDIO_AUDIT.md):
- Frontend cannot generate HMAC-SHA256 presigned URLs without backend keys.
- To achieve successful audio playback without errors, Backend (`@be-primary`) must provide `audioDownloadUrl` in `AnswerDetailResponse` using the pre-existing `storageService.generatePresignedGetUrl(key)`.
