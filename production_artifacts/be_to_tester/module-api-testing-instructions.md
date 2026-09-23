# Module API (#26–#31) — Tester Handoff

## Phạm vi

Module API được implement theo DDD bounded context riêng:

- Domain model/repository port: `backend/src/main/java/com/english_hub/core/modules/module/domain/`
- Application service: `backend/src/main/java/com/english_hub/core/modules/module/application/`
- JPA adapter/entity/mapper: `backend/src/main/java/com/english_hub/core/modules/module/infrastructure/`
- REST controller/DTO: `backend/src/main/java/com/english_hub/core/modules/module/presentation/`

Không tích hợp Cloudflare R2. Audio được lưu local bằng storage key dạng:

```text
modules/{moduleId}/audio/{uuid}.{extension}
```

Trong Docker, storage dùng named volume `englishhub_backend_storage` tại `/app/storage`.

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

6. `POST /api/v1/modules/{moduleId}/audio`
   - `multipart/form-data`, field `file`.
   - Chỉ module `LISTENING` và Teacher owner được upload.
   - Hỗ trợ `.mp3`, `.wav`, `.m4a`, tối đa 25 MB.
   - Kiểm tra cả extension/content type và file signature.
   - Upload local đồng bộ nhưng response/DB status hiện là `PROCESSING` theo quyết định tạm thời.
   - Response không trả absolute filesystem path, chỉ trả `sourceAudioStorageKey`.

## Test commands

Từ thư mục `backend/`:

```bash
./gradlew test --tests 'com.english_hub.core.modules.module.application.service.ModuleServiceTest'
./gradlew test --tests 'com.english_hub.core.modules.module.presentation.rest.ModuleControllerTest'
./gradlew test --tests 'com.english_hub.core.modules.module.integration.ModuleApiIntegrationTest'
./gradlew test
```

Các test trên đã được chạy và pass trong phiên implementation này.
