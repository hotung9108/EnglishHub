# Hướng dẫn kiểm thử — Upload file bằng Presigned URL (Audio bài nghe của Module & File bài nộp)

> **Người bàn giao:** `@be-secondary` (task `BE-41`)
> **Người nhận:** `@tester`
> **Phạm vi:** Backend. Chỉ thay đổi luồng upload audio bài nghe của module và bổ sung endpoint
> streaming. Luồng upload file bài nộp (submission) không thay đổi code, nhưng được ghi lại trong
> artifact này để kiểm thử tập trung.

---

## 1. Tóm tắt thay đổi

### 1.1. Audio bài nghe của module (thay đổi lớn — breaking change)

- **BỎ** endpoint cũ `POST /api/v1/modules/{moduleId}/audio` dạng `multipart/form-data` (field `file`).
- **MỚI** `POST /api/v1/modules/{moduleId}/audio` — JSON `{ "mimeType": "..." }` → trả presigned PUT URL.
- **MỚI** `POST /api/v1/modules/{moduleId}/audio/confirm` — JSON `{ "storageKey": "..." }` → `READY` / `FAILED`.
- **MỚI** `GET /api/v1/modules/{moduleId}/audio` — stream bytes audio cho giáo viên sở hữu và học sinh trong lớp.
- **XÓA** lưu trữ disk local: `LocalAudioStorageAdapter`, `AudioStoragePort`, `AudioStorageException`, property `app.storage.local-root`.
- **XÓA** kiểm tra 25 MB và magic-byte phía server (backend không còn nhận bytes). Chỉ còn allowlist mime type.
- Thêm `deleteObject(String storageKey)` vào `StorageService` (dùng cho dọn file khi upload lại và khi xóa module).
- Dọn file cũ chạy **sau khi transaction commit** (best-effort) để tránh mất file khi DB rollback.

### 1.2. File bài nộp (submission) — không đổi code

Đã có sẵn từ trước, giữ nguyên hành vi:

- `POST /api/v1/submission-modules/{id}/audio-upload-url` — ghi âm bài nói.
- `POST /api/v1/submission-modules/{id}/document-upload-url` — tài liệu bài viết.
- `POST /api/v1/submissions/{id}/submit` — tự dò object trong kho lưu trữ.

> Tài liệu API đầy đủ (song ngữ EN/VI): `docs/api/file-upload-guide-module-audio-and-submission-files.md`.

---

## 2. Điều kiện tiên quyết khi test thủ công

- S3-compatible storage đang chạy (MinIO/localstack) và `app.storage.s3.enabled=true`,
  endpoint/credentials/bucket cấu hình đúng.
- Nếu `app.storage.s3.enabled=false`, mọi lệnh upload/confirm/stream trả `500` với message
  `"Lưu trữ chưa được cấu hình."` — đây là hành vi mong đợi, không phải bug.
- Có sẵn: 1 giáo viên sở hữu lớp, 1 học sinh trong lớp, 1 giáo viên khác lớp, 1 admin.

### Mime type hợp lệ cho audio bài nghe

| `mimeType`                                 | Phần mở rộng |
| :----------------------------------------- | :----------- |
| `audio/mpeg`, `audio/mp3`                  | `.mp3`       |
| `audio/wav`, `audio/x-wav`, `audio/wave`   | `.wav`       |
| `audio/mp4`, `audio/m4a`, `audio/x-m4a`    | `.m4a`       |

---

## 3. Kịch bản kiểm thử API — Audio bài nghe của module

### TC-MOD-AUD-01 — Luồng 3 bước thành công (happy path)

1. `POST /api/v1/modules/{moduleId}/audio` (giáo viên sở hữu, module `LISTENING`) với
   `{ "mimeType": "audio/mpeg" }`.
2. `PUT` chính `uploadUrl` trả về, header `Content-Type: audio/mpeg`, body là bytes file.
3. `POST /api/v1/modules/{moduleId}/audio/confirm` với `{ "storageKey": <key ở bước 1> }`.
4. `GET /api/v1/modules/{moduleId}/audio` bằng token giáo viên và bằng token học sinh trong lớp.

**Kỳ vọng:**

- Bước 1: `200`, body có `message = "Lấy link upload audio thành công."`, `uploadUrl`,
  `storageKey` dạng `modules/{moduleId}/audio/{uuid}.mp3`, `expiresAt`, `sourceAudioUploadStatus = "UPLOADING"`.
- Bước 2: `200` hoặc `204`.
- Bước 3: `200`, `sourceAudioUploadStatus = "READY"`, `sourceAudioStorageKey` đúng key.
- Bước 4: `200`, `Content-Type: audio/mpeg`, header `Cache-Control` chứa `private` và `max-age=3600`,
  body bytes trùng file đã upload.

### TC-MOD-AUD-02 — Confirm khi chưa upload

1. `POST .../audio` lấy `storageKey` nhưng **không** PUT.
2. `POST .../audio/confirm`.

**Kỳ vọng:** `200` (không phải lỗi), body `sourceAudioUploadStatus = "FAILED"`,
`message = "File audio chưa được tải lên kho lưu trữ."`. Kiểm tra DB: module lưu trạng thái `FAILED`.

### TC-MOD-AUD-03 — Confirm sai storageKey

- `POST .../audio/confirm` với `storageKey` của module khác / không tồn tại.

**Kỳ vọng:** `400`, `{"error":"storageKey không khớp với module."}`.

### TC-MOD-AUD-04 — Module không phải LISTENING

- Gọi `POST .../audio` (và confirm) trên module `READING`/`WRITING`/`SPEAKING`.

**Kỳ vọng:** `400`, `{"error":"Module này không hỗ trợ upload audio."}`.

### TC-MOD-AUD-05 — Mime type không hợp lệ

- `POST .../audio` với `{ "mimeType": "audio/ogg" }` và với body rỗng/`mimeType` null.

**Kỳ vọng:** `400`, `{"error":"Định dạng file audio không được hỗ trợ."}`.

### TC-MOD-AUD-06 — Phân quyền

| Hành động | Giáo viên sở hữu | Giáo viên khác | Admin | Học sinh trong lớp | Học sinh ngoài lớp |
| :-------- | :---: | :---: | :---: | :---: | :---: |
| `POST .../audio` | 200 | 403 | 403 | 403 | 403 |
| `POST .../audio/confirm` | 200 | 403 | 403 | 403 | 403 |
| `GET .../audio` | 200 | 403 | 403 | 200 | 403 |

> Lưu ý: `GET .../audio` cho phép cả `TEACHER` và `STUDENT` ở tầng route, nhưng service vẫn kiểm tra
> quan hệ lớp → học sinh ngoài lớp và admin bị `403`.

### TC-MOD-AUD-07 — Streaming khi chưa có audio

- `GET .../audio` trên module chưa upload, và trên module có `storageKey` nhưng object đã bị xóa khỏi storage.

**Kỳ vọng:** `404`, `{"error":"Module chưa có file audio."}`.

### TC-MOD-AUD-08 — Upload lại dọn file cũ

1. Upload hoàn tất lần 1 → `READY`, object tồn tại.
2. Gọi lại `POST .../audio` (lần 2) → lấy key mới.
3. Kiểm tra kho lưu trữ: object của lần 1 **phải bị xóa**, key của module trỏ sang key lần 2, trạng thái `UPLOADING`.

**Kỳ vọng:** object cũ bị xóa sau khi request lần 2 commit.

### TC-MOD-AUD-09 — Xóa module dọn file audio

1. Module có audio `READY`.
2. `DELETE /api/v1/modules/{moduleId}` bằng giáo viên sở hữu.

**Kỳ vọng:** `200`; object audio của module bị xóa khỏi kho lưu trữ.

### TC-MOD-AUD-10 — Storage chưa cấu hình

- Chạy với `app.storage.s3.enabled=false`, gọi `POST .../audio`.

**Kỳ vọng:** `500`, `{"error":"Lưu trữ chưa được cấu hình."}`.

---

## 4. Kịch bản kiểm thử API — File bài nộp (submission)

### TC-SUB-FILE-01 — Ghi âm bài nói

1. `POST /api/v1/submission-modules/{id}/audio-upload-url` với `{ "mimeType": "audio/webm" }`
   (module `RECORDING` hoặc skill `SPEAKING`, bài nộp `IN_PROGRESS`).
2. `PUT uploadUrl` với `Content-Type: audio/webm`.
3. `POST /api/v1/submissions/{submissionId}/submit`.

**Kỳ vọng:** bước 1 `200` với `storageKey = submissions/{submissionId}/module-{id}/audio.webm`;
`expiresAt`; bước 3 trả về `audioUploadStatus = "READY"` và `audioStorageKey` đúng key.

### TC-SUB-FILE-02 — Tài liệu bài viết

1. `POST /api/v1/submission-modules/{id}/document-upload-url` với `{ "mimeType": "application/pdf" }`
   (module `ESSAY`, bài nộp `IN_PROGRESS`).
2. `PUT uploadUrl` với `Content-Type: application/pdf`.
3. `POST /api/v1/submissions/{submissionId}/submit`.

**Kỳ vọng:** `storageKey = submissions/{submissionId}/module-{id}/essay.pdf`; sau submit
`docUploadStatus = "READY"`, `docStorageKey` đúng key.

### TC-SUB-FILE-03 — Submit khi chưa upload

- Nộp module ghi âm/bài viết mà **không** PUT file.

**Kỳ vọng:** module vẫn được nộp; `audioUploadStatus`/`docUploadStatus` giữ `UPLOADING`;
không trả lỗi. (Đây là hành vi có chủ đích — backend tự dò object.)

### TC-SUB-FILE-04 — Sai loại module / mime type

- Gọi `audio-upload-url` trên module `ESSAY`, `document-upload-url` trên module `RECORDING`,
  hoặc với mime type ngoài allowlist (`audio/ogg`, `image/png`).

**Kỳ vọng:** `400` với `"Không thể upload ghi âm cho phần làm bài này."`,
`"Không thể upload tài liệu cho phần làm bài này."`, hoặc `"Định dạng file không được hỗ trợ."`.

### TC-SUB-FILE-05 — Phân quyền & trạng thái bài nộp

- Gọi bằng giáo viên/admin/`student` không sở hữu → `403`.
- Gọi khi bài nộp đã `SUBMITTED` → `400` (message như TC-SUB-FILE-04).

---

## 5. Chạy test tự động

Từ thư mục `backend/`:

```bash
# Unit test service + controller
./gradlew test --tests 'com.english_hub.core.modules.module.application.service.ModuleServiceTest'
./gradlew test --tests 'com.english_hub.core.modules.module.presentation.rest.ModuleControllerTest'

# Integration test end-to-end (cần Docker cho localstack S3, và Postgres dev ở localhost:5432)
./gradlew test --tests 'com.english_hub.core.modules.module.integration.ModuleApiIntegrationTest'

# Toàn bộ suite (khuyến nghị trước khi duyệt)
./gradlew test
```

> `ModuleApiIntegrationTest` dùng container `localstack/localstack:3` để dựng S3 và thực hiện
> PUT trực tiếp vào presigned URL thật, sau đó confirm → GET để kiểm tra bytes. Test xóa module
> chạy ở transaction `NOT_SUPPORTED` để after-commit hook thực sự fire, và tự dọn dữ liệu đã commit.

**Trạng thái test tại thời điểm bàn giao:** `ModuleServiceTest` (40 test), `ModuleControllerTest`
(8 test), `ModuleApiIntegrationTest` (11 test) — tất cả PASS; toàn bộ suite backend PASS.

---

## 6. Bằng chứng cần thu thập

- Log request/response các bước presign → PUT → confirm cho 1 happy path (TC-MOD-AUD-01).
- Ảnh chụp body `FAILED` (TC-MOD-AUD-02).
- Kết quả liệt kê object trong bucket trước/sau khi upload lại và sau khi xóa module
  (TC-MOD-AUD-08, TC-MOD-AUD-09).
- Ma trận phân quyền (TC-MOD-AUD-06) với mã HTTP thực tế.
- Output `./gradlew test` (toàn bộ suite xanh).

---

## 7. Lưu ý cho các vai trò khác

- **`@fe-primary` / `@fe-secondary`:** endpoint `POST /api/v1/modules/{moduleId}/audio` đã đổi
  từ `multipart/form-data` sang JSON + presigned URL. Các chỗ đang dùng `FormData` cần chuyển
  sang luồng 3 bước. Audio playback phải fetch blob bằng axios (`responseType: 'blob'`) rồi tạo
  `URL.createObjectURL` vì endpoint yêu cầu header `Authorization`.
- **`@devops-*`:** property `LOCAL_STORAGE_ROOT` / `app.storage.local-root` đã bị xóa; có thể bỏ
  khỏi cấu hình/môi trường. Đảm bảo `STORAGE_S3_ENABLED=true` và cấu hình S3 đầy đủ ở mọi môi
  trường chạy thật, nếu không upload audio sẽ trả `500`.
