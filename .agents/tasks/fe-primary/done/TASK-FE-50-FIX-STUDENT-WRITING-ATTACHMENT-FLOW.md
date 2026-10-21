---
id: TASK-FE-50-FIX-STUDENT-WRITING-ATTACHMENT-FLOW
title: "Fix Student Writing Assignment Attachment and Submission Flow"
role: fe-primary
assignee: Maloque18705
status: "Done"
created_at: 2026-10-21T17:15:00+07:00
updated_at: 2026-10-21T17:25:00+07:00
completed_at: 2026-10-21T17:25:00+07:00
priority: P0
tags: [frontend, writing, essay, file-upload, s3, minio, fe-50, bug-21, bug-qa30-175, bug-qa30-184]
---

# TASK-FE-50-FIX-STUDENT-WRITING-ATTACHMENT-FLOW: Fix Student Writing Assignment Attachment Flow

## 1. Context & Objective
- **Problem**: When students submitted a Writing assignment with an attached document (PDF or Word .docx), the attachment was ignored or failed silently during upload. The submission was marked as `SUBMITTED`, but the backend recorded `docStorageKey = null`, `docMimeType = null`, and `docUploadStatus = UPLOADING` (Issue `#175` / `BUG-QA30-writing-submit` / `QA30-012`). In addition, any errors during upload or `submit-module` were caught and swallowed, causing the UI to proceed with the parent submission regardless of failure (Issue `#184` / `BUG-QA30-submit-after-error` / `QA30-038`).
- **Goal**: Resolve `BUG-21` and associated QA30 bugs by properly integrating object storage upload for Writing essay documents, ensuring correct MIME type mapping for Word (.docx) and PDF, sending `storageKey` with `textContent`, and enforcing fail-fast error handling according to [.agents/rules/convention-fe.md](file:///d:/Coding/EnglishHub/.agents/rules/convention-fe.md).

## 2. Root Cause Analysis
1. **API Client Violation (Rule 6.1 `convention-fe.md`)**: `StudentAssignmentWriting.tsx` called raw `fetch` directly for upload, bypassing `submissionService.uploadDirectToStorage` which handles the dev Docker Vite proxy (`/s3-upload`) and S3 Content-Type header synchronization.
2. **Word (.docx) MIME Type Mismatch**: Backend `documentExtensionOf` strictly expects `application/vnd.openxmlformats-officedocument.wordprocessingml.document` for `.docx`. The browser often provides empty string `""` or `application/msword`, which previously caused HTTP 400 Bad Request.
3. **Swallowed Errors Anti-pattern**: Upload errors and `submitModule` errors were caught in empty `catch` blocks with only `console.warn`, allowing `submitSubmission(subId)` to execute even when upload failed.
4. **Missing Storage Key in Payload**: When invoking `submitModule`, `storageKey` returned by presigned upload URL was never passed to the payload.
5. **Permissive File Validation**: File extension validation permitted non-document files (e.g., `.txt`) to bypass filter.

## 3. Completed Work
1. **MIME Normalization & Extension Verification**:
   - Added `getDocumentMimeType(file: File)` to map `.docx` strictly to `application/vnd.openxmlformats-officedocument.wordprocessingml.document` and `.pdf` to `application/pdf`.
   - Updated `validateAndSetFile` to strictly allow `.pdf` and `.docx` extensions, blocking unsupported files (like `.txt`) with a clear error alert.
2. **Standard Service Layer Integration**:
   - Replaced direct `fetch` with `submissionService.uploadDirectToStorage(uploadUrl, uploadedFile, mimeType)`.
   - Integrated `parseApiError` from `src/api` for structured API error feedback.
   - Updated `SubmitModulePayload` usage to send both `storageKey` and `answers` (text content).
3. **Robust 3-Phase Submission Flow**:
   - **Phase 1 (Validation)**: Validates that either text or file (or both) are present, and validates session state.
   - **Phase 2 (Direct Storage Upload)**: If a file is attached, requests presigned PUT URL via `getDocumentUploadUrl` and performs binary PUT to storage. Any error immediately terminates the submission flow and alerts the user.
   - **Phase 3 (Module & Submission Completion)**: Calls `submitModule` with `{ storageKey, answers }`. If all modules are completed, finalizes with `submitSubmission`.
4. **Support for All Three Submission Modes**:
   - Text only: sends `answers: [{ questionId: 1, content: { text } }]`.
   - File only: uploads to storage, sends `{ storageKey }`.
   - Both text and file: uploads file to storage, sends `{ storageKey, answers: [...] }`.
5. **Unit Testing**:
   - Added unit test in `frontend/src/api/__tests__/submission.service.test.ts` verifying `submitModule` correctly transmits `storageKey` and `answers` when submitting Writing essay modules.

## 4. Verification & Quality Gates
- **Unit Tests**: 127/127 tests passed (`tsx --tsconfig tsconfig.app.json --test src/api/__tests__/*.test.ts`).
- **Linter**: `npm run lint` completed with 0 errors.
- **Build**: `npm run build` (`tsc -b && vite build`) passed without errors.
- **Handoff Artifact**: Created test guide in `production_artifacts/fe_to_tester/FE_50_STUDENT_WRITING_ATTACHMENT_FLOW_TEST_GUIDE.md`.
