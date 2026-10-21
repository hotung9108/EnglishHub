# FE_50 Test Guide: Fix Student Writing Assignment Attachment and Submission Flow

## 1. Overview & Scope
- **Task ID**: `[FE-50]` / `[TASK-FE-50]` (Resolves `BUG-21`, `BUG-QA30-writing-submit` / `#175`, `BUG-QA30-submit-after-error` / `#184`)
- **Assignee**: `@fe-primary` (`Maloque18705`)
- **Recipient**: `@tester` (`Zawn-Tsu`)
- **Affected Components**:
  - `frontend/src/pages/StudentAssignmentWriting.tsx`
  - `frontend/src/api/services/submission.service.ts`
  - `frontend/src/api/__tests__/submission.service.test.ts`

---

## 2. Key Changes & Features
1. **Presigned Document Upload URL & Storage Key Integration**:
   - Before completing module submission, the frontend requests a presigned PUT URL via `POST /api/v1/submission-modules/{id}/document-upload-url`.
   - Directly uploads binary file via `submissionService.uploadDirectToStorage` (with proxy support for `/s3-upload` in local/docker environments).
   - Sends `storageKey` in `POST /api/v1/submission-modules/{id}/submit`.
2. **Word (.docx) & PDF MIME Type Normalization**:
   - `.docx` files are mapped to `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
   - `.pdf` files are mapped to `application/pdf`.
   - Matches backend `documentExtensionOf` validation without triggering HTTP 400 Bad Request.
3. **Fail-Fast Error Handling (No Swallowing)**:
   - If document upload or `submit-module` fails, the submission halts immediately and displays an error message via `parseApiError`.
   - The UI never calls parent `POST /api/v1/submissions/{id}/submit` when a child module has failed.
4. **All Three Submission Modes Supported**:
   - Text only.
   - File attachment only (PDF / DOCX).
   - Both text and file attachment together.

---

## 3. Test Cases for QA

### TC-FE50-01: Submit with PDF File Attachment Only
- **Preconditions**: Student enrolled in a class with an active Writing assignment (ESSAY task type).
- **Steps**:
  1. Open the Writing assignment workspace (`/student/assignments/writing/:id`).
  2. Leave the essay text editor completely empty.
  3. Drag & drop or select a valid `.pdf` document (e.g. `qa29-writing-sample.pdf`).
  4. Verify the filename, file size, and "Tệp PDF" badge appear in the uploaded file panel.
  5. Click **"Nộp bài (Submit Assignment)"**.
- **Expected Result**:
  - Button switches to loading state (`Đang nộp bài...`).
  - Network inspector shows:
    1. `POST /api/v1/submission-modules/{id}/document-upload-url` (200 OK, returning `uploadUrl` and `storageKey`).
    2. `PUT` request uploading the binary PDF file to the presigned storage URL (200/204 OK).
    3. `POST /api/v1/submission-modules/{id}/submit` containing `storageKey`.
    4. `POST /api/v1/submissions/{id}/submit` (200 OK).
  - Navigates to submission result page.
  - Querying submission API confirms answer has:
    - `docStorageKey` matches uploaded storage path.
    - `docMimeType: "application/pdf"`.
    - `docUploadStatus: "READY"`.

### TC-FE50-02: Submit with Word (.docx) File Attachment Only
- **Steps**:
  1. Open the Writing assignment workspace.
  2. Attach a valid `.docx` file (e.g. `sample.docx`).
  3. Click **"Nộp bài"**.
- **Expected Result**:
  - Request to `document-upload-url` sends `mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"`.
  - Binary file uploads cleanly without signature errors.
  - Backend answer reflects `docUploadStatus: "READY"` and `docMimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"`.

### TC-FE50-03: Submit with Both Text and Document File
- **Steps**:
  1. Open the Writing assignment workspace.
  2. Type essay content in the editor (e.g. 180 words).
  3. Attach a valid `.docx` or `.pdf` file.
  4. Click **"Nộp bài"**.
- **Expected Result**:
  - File is uploaded to storage.
  - `POST /api/v1/submission-modules/{id}/submit` includes both `storageKey` and `answers: [{ questionId: 1, content: { text: "..." } }]`.
  - Backend / AI grading pipeline has access to both the textual content and the uploaded document.

### TC-FE50-04: Submit with Text Content Only (No File)
- **Steps**:
  1. Open the Writing assignment workspace.
  2. Type essay content in the editor. Do not attach any file.
  3. Click **"Nộp bài"**.
- **Expected Result**:
  - No `document-upload-url` or storage PUT request is made.
  - `POST /api/v1/submission-modules/{id}/submit` completes successfully with `answers`.

### TC-FE50-05: Reject Unsupported File Types (.txt, .rar, .jpg)
- **Steps**:
  1. Try dragging or selecting an unsupported file type, such as `test.txt` or `photo.jpg`.
- **Expected Result**:
  - File is not accepted into the file card.
  - Error alert is displayed: *"Định dạng tệp không được hỗ trợ. Vui lòng tải lên tệp PDF (.pdf) hoặc Word (.docx)."*
  - Submit button remains disabled if editor text is also empty.

### TC-FE50-06: Fail-Fast on Upload Network Error
- **Steps**:
  1. Attach a file, open browser DevTools Network tab, and simulate offline or block PUT request to storage URL.
  2. Click **"Nộp bài"**.
- **Expected Result**:
  - Submission stops immediately upon upload failure.
  - An error message appears on screen.
  - `POST /api/v1/submissions/{id}/submit` is **NOT** invoked.
  - Editor text and attached file remain intact so the student can retry.
