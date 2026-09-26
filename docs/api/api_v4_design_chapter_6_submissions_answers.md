# 6. CỤM 5 - SUBMISSION / ANSWER (7 API)

> **Thay đổi so với V3:**
> - Bỏ #41 (danh sách modules) — đã nhúng vào #37, #38, #39
> - Bỏ #44 (danh sách answers) — đã nhúng vào #42
> - Bỏ #45 (xem chi tiết 1 answer) — không cần thiết
> - #43: Đổi từ "nộp 1 câu trả lời" → "submit toàn bộ answers của 1 submission_module"
> - #46, #47: Đổi từ upload trực tiếp qua server → server trả về presigned URL, client upload thẳng lên R2

---

## 6.1 #37. Bắt đầu 1 lần làm bài

**Mô tả:** Học viên tạo 1 attempt mới cho bài tập. Server kiểm tra bài tập đang `PUBLISHED`, trong khoảng `open_at - close_at`, chưa vượt `max_submissions`. Server tự tạo các `submission_modules` tương ứng và 1 `gradings` trạng thái `PENDING` cho mỗi module.

**Method - Path:** `POST /assignments/{id}/submissions`

**Headers:** `Authorization: Bearer <accessToken>` (role=STUDENT)

**Body:** *(none)*

**Response:**

| Mô tả | Code | Return |
|:---|:---:|:---|
| Tạo lượt làm bài thành công. | `201` | `{ "id": 88, "assignmentId": 5, "attemptNumber": 1, "status": "IN_PROGRESS", "createdAt": "...", "modules": [ { "id": 150, "moduleId": 9, "skill": "LISTENING", "status": "IN_PROGRESS" }, { "id": 151, "moduleId": 10, "skill": "WRITING", "status": "IN_PROGRESS" } ] }` |
| Bài tập chưa `PUBLISHED`, đã đóng, hoặc đã hết lượt nộp. | `400` | `{ "error": "Không thể bắt đầu làm bài tập này lúc này." }` |
| Không tìm thấy bài tập. | `404` | `{ "error": "Không tìm thấy bài tập." }` |
| Chưa đăng nhập hoặc token không hợp lệ / hết hạn. | `401` | `{ "error": "Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn." }` |
| Không phải học viên trong lớp. | `403` | `{ "error": "Bạn không có quyền thực hiện thao tác này." }` |
| Lỗi hệ thống. | `500` | `{ "error": "Lỗi máy chủ." }` |

---

## 6.2 #38. Xem chi tiết 1 lần làm bài

**Mô tả:** Xem thông tin 1 submission kèm danh sách `submission_modules` và `gradings` tương ứng (nếu có). Học viên chỉ xem được bài của mình; giáo viên xem được bài của học viên trong lớp mình.

**Method - Path:** `GET /submissions/{id}`

**Headers:** `Authorization: Bearer <accessToken>`

**Body:** *(none)*

**Response:**

| Mô tả | Code | Return |
|:---|:---:|:---|
| Tìm thấy. | `200` | `{ "id": 88, "assignmentId": 5, "studentId": 41, "attemptNumber": 1, "status": "GRADED", "submittedAt": "...", "createdAt": "...", "modules": [ { "id": 150, "moduleId": 9, "skill": "LISTENING", "taskType": "QUIZ", "status": "GRADED", "grading": { "id": 77, "method": "AUTO", "status": "COMPLETED", "finalScore": 8.0, "maxScoreSnapshot": 10.0, "finalFeedback": null } }, { "id": 151, "moduleId": 10, "skill": "WRITING", "taskType": "ESSAY", "status": "GRADED", "grading": { "id": 78, "method": "TEACHER_MANUAL", "status": "COMPLETED", "finalScore": 7.5, "maxScoreSnapshot": 10.0, "aiFeedback": "...", "finalFeedback": "..." } } ] }` |
| Không tìm thấy. | `404` | `{ "error": "Không tìm thấy lượt làm bài." }` |
| Chưa đăng nhập hoặc token không hợp lệ / hết hạn. | `401` | `{ "error": "Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn." }` |
| Không có quyền xem. | `403` | `{ "error": "Bạn không có quyền thực hiện thao tác này." }` |
| Lỗi hệ thống. | `500` | `{ "error": "Lỗi máy chủ." }` |

---

## 6.3 #39. Danh sách lượt làm bài

**Mô tả:** Học viên xem bài làm của mình; giáo viên xem theo bài tập / học viên. Mỗi item trong danh sách kèm `modules` và `gradings` để hiển thị tổng quan kết quả mà không cần gọi thêm request.

**Method - Path:** `GET /submissions?assignmentId={}&studentId={}&status={}&page={}&limit={}`

**Headers:** `Authorization: Bearer <accessToken>`

**Body:** *(none)*

**Response:**

| Mô tả | Code | Return |
|:---|:---:|:---|
| Lấy danh sách thành công. | `200` | `{ "data": [ { "id": 88, "studentId": 41, "attemptNumber": 1, "status": "GRADED", "submittedAt": "...", "modules": [ { "id": 150, "moduleId": 9, "skill": "LISTENING", "taskType": "QUIZ", "status": "GRADED", "grading": { "finalScore": 8.0, "maxScoreSnapshot": 10.0, "status": "COMPLETED" } } ] } ], "pagination": { "page": 1, "limit": 20, "total": 12 } }` |
| Chưa đăng nhập hoặc token không hợp lệ / hết hạn. | `401` | `{ "error": "Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn." }` |
| Lỗi hệ thống. | `500` | `{ "error": "Lỗi máy chủ." }` |

---

## 6.4 #40. Nộp bài chính thức

**Mô tả:** Chốt lại toàn bộ bài làm. Đổi `submissions.status` và tất cả `submission_modules.status` chưa `SUBMITTED` → `SUBMITTED`, set `submitted_at = now()`. Kích hoạt chấm tự động với các module có `method = AUTO` (Quiz): server so khớp `answers.content` với `questions.correct_answer`, tính điểm, cập nhật `gradings.final_score` và `status = COMPLETED`.

**Method - Path:** `POST /submissions/{id}/submit`

**Headers:** `Authorization: Bearer <accessToken>` (role=STUDENT)

**Body:** *(none)*

**Response:**

| Mô tả | Code | Return |
|:---|:---:|:---|
| Nộp bài thành công. | `200` | `{ "message": "Nộp bài thành công.", "status": "SUBMITTED", "submittedAt": "..." }` |
| Bài đã được nộp trước đó (status khác `IN_PROGRESS`). | `400` | `{ "error": "Bài làm này đã được nộp." }` |
| Không tìm thấy lượt làm bài. | `404` | `{ "error": "Không tìm thấy lượt làm bài." }` |
| Chưa đăng nhập hoặc token không hợp lệ / hết hạn. | `401` | `{ "error": "Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn." }` |
| Không phải bài làm của bạn. | `403` | `{ "error": "Bạn không có quyền thực hiện thao tác này." }` |
| Lỗi hệ thống. | `500` | `{ "error": "Lỗi máy chủ." }` |

---

## 6.5 #42. Xem chi tiết 1 phần làm bài (submission_module)

**Mô tả:** Xem chi tiết 1 `submission_module` kèm danh sách `questions`, `answers` và `gradings`. Nếu `status = GRADED`, trường `correctAnswer` trong mỗi question sẽ được trả về; ngược lại để `null`. Với module Essay/Speaking (không có câu hỏi), `questions` là mảng rỗng, `answers` chứa thông tin file.

**Method - Path:** `GET /submission-modules/{id}`

**Headers:** `Authorization: Bearer <accessToken>`

**Body:** *(none)*

**Response:**

| Mô tả | Code | Return |
|:---|:---:|:---|
| Tìm thấy — module Quiz, đã chấm. | `200` | `{ "id": 150, "moduleId": 9, "skill": "LISTENING", "taskType": "QUIZ", "status": "GRADED", "grading": { "id": 77, "method": "AUTO", "status": "COMPLETED", "finalScore": 8.0, "maxScoreSnapshot": 10.0, "finalFeedback": null }, "questions": [ { "id": 21, "content": "Which word best describes...?", "questionType": "MULTIPLE_CHOICE", "score": 1.0, "orderIndex": 1, "correctAnswer": { "options": [ { "id": 1, "content": "Option A", "isCorrect": true }, { "id": 2, "content": "Option B", "isCorrect": false } ] } } ], "answers": [ { "id": 340, "questionId": 21, "content": { "selectedOptionIds": [1], "isCorrect": true, "score": 1.0 } } ] }` |
| Tìm thấy — module Essay, đã chấm. | `200` | `{ "id": 151, "moduleId": 10, "skill": "WRITING", "taskType": "ESSAY", "status": "GRADED", "grading": { "id": 78, "method": "TEACHER_MANUAL", "status": "COMPLETED", "finalScore": 7.5, "maxScoreSnapshot": 10.0, "aiFeedback": "Bài viết có cấu trúc tốt...", "finalFeedback": "Cần cải thiện phần kết." }, "questions": [], "answers": [ { "id": 341, "questionId": null, "content": null, "docStorageKey": "submissions/88/module-10/essay.pdf", "docMimeType": "application/pdf", "docUploadStatus": "READY" } ] }` |
| Tìm thấy — module đang làm (chưa graded, không lộ đáp án). | `200` | `{ "id": 150, "moduleId": 9, "skill": "LISTENING", "taskType": "QUIZ", "status": "IN_PROGRESS", "grading": null, "questions": [ { "id": 21, "content": "Which word best describes...?", "questionType": "MULTIPLE_CHOICE", "score": 1.0, "orderIndex": 1, "correctAnswer": null } ], "answers": [ { "id": 340, "questionId": 21, "content": { "selectedOptionIds": [1] } } ] }` |
| Không tìm thấy. | `404` | `{ "error": "Không tìm thấy phần làm bài." }` |
| Chưa đăng nhập hoặc token không hợp lệ / hết hạn. | `401` | `{ "error": "Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn." }` |
| Không có quyền xem. | `403` | `{ "error": "Bạn không có quyền thực hiện thao tác này." }` |
| Lỗi hệ thống. | `500` | `{ "error": "Lỗi máy chủ." }` |

---

## 6.6 #43. Submit toàn bộ answers của 1 submission_module

**Mô tả:** Học viên nộp tất cả câu trả lời cho 1 module trong một request. Chỉ được gọi khi `submission_module.status = IN_PROGRESS` — mỗi module chỉ submit được 1 lần duy nhất. Sau khi submit, server đổi `submission_module.status → SUBMITTED`.

Với **Quiz / Short Answer**: truyền mảng `answers` kèm `questionId` và `content`.

Với **Essay / Writing**: không truyền `answers` trong body — server tạo 1 `answer` record trống và kiểm tra R2 xem file đã upload chưa (dựa trên key quy ước). Nếu file chưa có trên R2, vẫn tạo answer với `doc_upload_status = UPLOADING`.

Với **Speaking / Recording**: tương tự Essay nhưng kiểm tra `audio_storage_key`.

**Method - Path:** `POST /submission-modules/{id}/submit`

**Headers:** `Content-Type: application/json`, `Authorization: Bearer <accessToken>` (role=STUDENT)

**Body:**

```json
// Quiz / Short Answer
{
  "answers": [
    { "questionId": 21, "content": { "selectedOptionIds": [1] } },
    { "questionId": 22, "content": { "selectedOptionIds": [3] } },
    { "questionId": 23, "content": { "text": "The answer is..." } }
  ]
}

// Essay / Writing — không cần answers, server tự tạo answer record
{}

// Speaking / Recording — không cần answers
{}
```

**Response:**

| Mô tả | Code | Return |
|:---|:---:|:---|
| Submit thành công. | `200` | `{ "message": "Đã nộp phần làm bài.", "submissionModuleId": 150, "status": "SUBMITTED", "answers": [ { "id": 340, "questionId": 21, "content": { "selectedOptionIds": [1] } } ] }` |
| Module đã được submit trước đó. | `400` | `{ "error": "Phần làm bài này đã được nộp." }` |
| Thiếu answers hoặc sai định dạng content. | `400` | `{ "error": "Nội dung câu trả lời không hợp lệ." }` |
| Không tìm thấy phần làm bài hoặc câu hỏi. | `404` | `{ "error": "Không tìm thấy phần làm bài hoặc câu hỏi." }` |
| Chưa đăng nhập hoặc token không hợp lệ / hết hạn. | `401` | `{ "error": "Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn." }` |
| Không có quyền. | `403` | `{ "error": "Bạn không có quyền thực hiện thao tác này." }` |
| Lỗi hệ thống. | `500` | `{ "error": "Lỗi máy chủ." }` |

---

## 6.7 #46. Lấy presigned URL upload ghi âm (Speaking)

**Mô tả:** Client gọi trước khi submit submission_module. Server tạo 1 presigned URL trỏ thẳng lên Cloudflare R2 với key quy ước theo `submissionModuleId`. Client dùng URL này để PUT file âm thanh trực tiếp lên R2. Sau khi upload xong, client gọi `#43` để submit module — server sẽ tự kiểm tra key trên R2.

Ràng buộc: `submission_module` phải thuộc skill `SPEAKING` / task type `RECORDING` và đang `IN_PROGRESS`.

**Method - Path:** `POST /submission-modules/{id}/audio-upload-url`

**Headers:** `Authorization: Bearer <accessToken>` (role=STUDENT)

**Body:** 
```json
{ "mimeType": "audio/webm" }
```

**Response:**

| Mô tả | Code | Return |
|:---|:---:|:---|
| Tạo presigned URL thành công. | `200` | `{ "uploadUrl": "https://r2.example.com/submissions/88/module-150/audio.webm?X-Amz-Signature=...", "storageKey": "submissions/88/module-150/audio.webm", "expiresAt": "..." }` |
| Module không thuộc skill Speaking/Recording hoặc đã SUBMITTED. | `400` | `{ "error": "Không thể upload ghi âm cho phần làm bài này." }` |
| Không tìm thấy phần làm bài. | `404` | `{ "error": "Không tìm thấy phần làm bài." }` |
| Chưa đăng nhập hoặc token không hợp lệ / hết hạn. | `401` | `{ "error": "Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn." }` |
| Không có quyền. | `403` | `{ "error": "Bạn không có quyền thực hiện thao tác này." }` |
| Lỗi hệ thống hoặc lỗi kết nối R2. | `500` | `{ "error": "Lỗi máy chủ." }` |

---

## 6.8 #47. Lấy presigned URL upload bài viết (Writing)

**Mô tả:** Tương tự #46 nhưng dành cho module Writing / Essay. Server tạo presigned URL để client PUT file `.docx` hoặc `.pdf` thẳng lên R2. Sau khi upload, client gọi `#43` để submit module.

Ràng buộc: `submission_module` phải thuộc skill `WRITING` / task type `ESSAY` hoặc `REWRITE` và đang `IN_PROGRESS`.

**Method - Path:** `POST /submission-modules/{id}/document-upload-url`

**Headers:** `Authorization: Bearer <accessToken>` (role=STUDENT)

**Body:**
```json
{ "mimeType": "application/pdf" }
```

**Response:**

| Mô tả | Code | Return |
|:---|:---:|:---|
| Tạo presigned URL thành công. | `200` | `{ "uploadUrl": "https://r2.example.com/submissions/88/module-151/essay.pdf?X-Amz-Signature=...", "storageKey": "submissions/88/module-151/essay.pdf", "expiresAt": "..." }` |
| Module không thuộc skill Writing hoặc đã SUBMITTED. | `400` | `{ "error": "Không thể upload tài liệu cho phần làm bài này." }` |
| Định dạng file không được hỗ trợ (không phải `.docx`/`.pdf`). | `400` | `{ "error": "Định dạng file không được hỗ trợ." }` |
| Không tìm thấy phần làm bài. | `404` | `{ "error": "Không tìm thấy phần làm bài." }` |
| Chưa đăng nhập hoặc token không hợp lệ / hết hạn. | `401` | `{ "error": "Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn." }` |
| Không có quyền. | `403` | `{ "error": "Bạn không có quyền thực hiện thao tác này." }` |
| Lỗi hệ thống hoặc lỗi kết nối R2. | `500` | `{ "error": "Lỗi máy chủ." }` |

---

## Tóm tắt endpoint

| # | Method + Path | Mô tả |
|---|---|---|
| 37 | `POST /assignments/{id}/submissions` | Bắt đầu 1 lần làm bài |
| 38 | `GET /submissions/{id}` | Xem chi tiết 1 lần làm bài (kèm modules + gradings) |
| 39 | `GET /submissions` | Danh sách lượt làm bài (kèm modules + gradings) |
| 40 | `POST /submissions/{id}/submit` | Nộp bài chính thức |
| 42 | `GET /submission-modules/{id}` | Xem chi tiết 1 module (kèm questions + answers + grading) |
| 43 | `POST /submission-modules/{id}/submit` | Submit toàn bộ answers của 1 module |
| 46 | `POST /submission-modules/{id}/audio-upload-url` | Lấy presigned URL upload ghi âm |
| 47 | `POST /submission-modules/{id}/document-upload-url` | Lấy presigned URL upload bài viết |
