# Module API (#26–#31) — Tester Handoff

## Phạm vi

Module API được implement theo DDD bounded context riêng:

- Domain model/repository port: `backend/src/main/java/com/english_hub/core/modules/module/domain/`
- Application service: `backend/src/main/java/com/english_hub/core/modules/module/application/`
- JPA adapter/entity/mapper: `backend/src/main/java/com/english_hub/core/modules/module/infrastructure/`
- REST controller/DTO: `backend/src/main/java/com/english_hub/core/modules/module/presentation/`

Audio bài nghe được lưu trên kho lưu trữ tương thích S3 (không còn lưu disk local) bằng storage
key dạng:

```text
modules/{moduleId}/audio/{uuid}.{extension}
```

> **Cập nhật (task `BE-41`):** `LocalAudioStorageAdapter` và property `app.storage.local-root` đã bị
> xóa. Nếu `app.storage.s3.enabled=false`, các API audio trả `500` với message
> `"Lưu trữ chưa được cấu hình."`. Hướng dẫn kiểm thử đầy đủ cho luồng upload mới nằm ở
> `production_artifacts/be_to_tester/file-upload-api-testing-instructions.md`.

## API cần test

1. `GET /api/v1/assignments/{assignmentId}/modules`
   - Teacher phụ trách lớp và Student là thành viên được đọc.
   - Teacher khác lớp và Admin nhận `403`.
   - Kết quả sort tăng dần theo `orderIndex`.

2. `POST /api/v1/assignments/{assignmentId}/modules`
   - Chỉ Teacher phụ trách lớp được tạo.
   - Cặp skill/taskType hợp lệ hiện tại:
     - `READING/QUIZ`
     - `LISTENING/QUIZ`
     - `WRITING/ESSAY`
     - `SPEAKING/RECORDING`
   - Duplicate `orderIndex` trả `400` với message:
     `orderIndex đã được sử dụng trong bài tập này.`

3. `GET /api/v1/modules/{moduleId}`
   - Trả đầy đủ instruction, aiInstruction, orderIndex, maxScore và audio metadata.
   - Teacher owner và Student member được đọc; user ngoài lớp/Admin bị chặn.

4. `PUT /api/v1/modules/{moduleId}`
   - Cập nhật instructions, aiInstruction, maxScore, orderIndex.
   - Duplicate order của module khác trả `400` với message:
     `orderIndex đã được sử dụng.`
   - Giữ nguyên orderIndex của chính module hiện tại là hợp lệ.

5. `DELETE /api/v1/modules/{moduleId}`
   - Teacher owner được xoá module.
   - Questions bị xoá bởi database FK `ON DELETE CASCADE`.
   - Nếu module đã được tham chiếu bởi `submission_modules`, trả `400`:
     `Không thể xoá module đã có bài nộp.`

6. Audio bài nghe của module — luồng presigned upload 3 bước (không còn `multipart/form-data`):
   - `POST /api/v1/modules/{moduleId}/audio` — JSON `{ "mimeType": "audio/mpeg" }`, chỉ module
     `LISTENING` và Teacher owner. Trả `{ uploadUrl, storageKey, expiresAt, sourceAudioUploadStatus }`
     với status `UPLOADING`. Mime hợp lệ: `audio/mpeg`, `audio/mp3`, `audio/wav`, `audio/x-wav`,
     `audio/wave`, `audio/mp4`, `audio/m4a`, `audio/x-m4a`.
   - `PUT <uploadUrl>` với `Content-Type` trùng `mimeType` để upload bytes trực tiếp lên storage.
   - `POST /api/v1/modules/{moduleId}/audio/confirm` — JSON `{ "storageKey": "..." }`; probe object
     và trả `sourceAudioUploadStatus` = `READY` (đã upload) hoặc `FAILED` (chưa upload, HTTP vẫn `200`).
   - `GET /api/v1/modules/{moduleId}/audio` — stream bytes audio; Teacher owner và Student thành viên
     lớp được phép; `ADMIN` và user ngoài lớp nhận `403`; `404` khi chưa có audio.
   - Đã bỏ giới hạn 25 MB và kiểm tra file signature phía server (backend không còn nhận bytes).

## Test commands

Từ thư mục `backend/`:

```bash
./gradlew test --tests 'com.english_hub.core.modules.module.application.service.ModuleServiceTest'
./gradlew test --tests 'com.english_hub.core.modules.module.presentation.rest.ModuleControllerTest'
./gradlew test --tests 'com.english_hub.core.modules.module.integration.ModuleApiIntegrationTest'
./gradlew test
```

Các test trên đã được chạy và pass trong phiên implementation này.
