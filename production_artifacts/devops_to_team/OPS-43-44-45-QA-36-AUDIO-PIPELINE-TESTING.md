# Bàn giao Triển khai Bộ Test CI cho Pipeline Audio (OPS-43, OPS-44, OPS-45, QA-36)

- **Phụ trách**: Tuấn Phạm (devops-primary / be-secondary)
- **Ngày thực hiện**: 06/11/2026
- **Trạng thái**: Sẵn sàng kiểm thử & tích hợp CI/CD

---

## 1. Danh sách Task Hoàn thành

| Task ID | Phân loại | Mục tiêu & Kết quả bàn giao |
|:---:|:---:|:---|
| **[OPS-43]** | Backend CI | **Integration test upload & lưu trữ audio với MinIO container**:<br>- File test: [`MinioAudioStorageIntegrationTest.java`](file:///home/tuan-pham/Documents/School_Projects/EnglishHub/backend/src/test/java/com/english_hub/core/modules/submission/infrastructure/storage/MinioAudioStorageIntegrationTest.java).<br>- Sử dụng MinIO Testcontainers với bind volume `/data`.<br>- Tải lên Presigned PUT cho Speaking (WebM) và Listening (MP3).<br>- Xác minh SHA-256 sau khi restart container MinIO để đảm bảo tính toàn vẹn và độ bền dữ liệu.<br>- Cập nhật `.github/workflows/ci-backend.yml` pre-pull image `minio/minio:RELEASE.2024-01-18T22-51-28Z`. |
| **[OPS-45]** | AI Service CI | **Test tự động chuyển mã WebM/OGG qua AI Service (FFmpeg)**:<br>- File test: [`test_audio_processor_ffmpeg.py`](file:///home/tuan-pham/Documents/School_Projects/EnglishHub/ai-service/tests/test_audio_processor_ffmpeg.py).<br>- Bổ sung test chuyển mã WebM (Opus) và OGG (Vorbis/Opus) thành chuẩn WAV 16kHz mono 16-bit.<br>- Cập nhật `.github/workflows/ci-ai-service.yml`: Cài đặt FFmpeg trên runner trước khi test và chạy kiểm tra transcode trong container `ai-service:ci-test`. |
| **[OPS-44]** | Backend / CD | **Nâng cấp endpoint stream audio & Smoke test post-deploy**:<br>- Cập nhật [`ModuleController.java`](file:///home/tuan-pham/Documents/School_Projects/EnglishHub/backend/src/main/java/com/english_hub/core/modules/module/presentation/rest/ModuleController.java) hỗ trợ HTTP Range: `206 Partial Content`, headers `Content-Range`, `Accept-Ranges: bytes`.<br>- Thêm unit/integration tests trong `ModuleControllerTest` và `ModuleApiIntegrationTest`.<br>- Tạo script smoke test [`test/scripts/smoke-test-audio-stream.sh`](file:///home/tuan-pham/Documents/School_Projects/EnglishHub/test/scripts/smoke-test-audio-stream.sh) kiểm tra phân quyền (401/403) và Range header (206/200).<br>- Tích hợp bước smoke test tự động vào pipeline `cd-backend-development.yml`. |
| **[QA-36]** | Staging / Selenium | **Tích hợp E2E Selenium luồng phát Listening & ghi âm Speaking vào staging**:<br>- Cập nhật [`test/selenium/tests/student/cases.js`](file:///home/tuan-pham/Documents/School_Projects/EnglishHub/test/selenium/tests/student/cases.js) (QA30-015 Listening playback & QA30-016 Speaking recording với fake media stream).<br>- Tạo script [`test/scripts/run-selenium-audio-staging.sh`](file:///home/tuan-pham/Documents/School_Projects/EnglishHub/test/scripts/run-selenium-audio-staging.sh) và script `test:student:audio` trong `package.json`.<br>- Tích hợp job chạy test tự động trên Staging vào cuối workflow `cd-backend-development.yml`. |

---

## 2. Hướng dẫn Kiểm thử Thủ công / Tự động cho Tester (@Zawn-Tsu)

### 2.1. Chạy Smoke Test Stream Audio [OPS-44]
```bash
./test/scripts/smoke-test-audio-stream.sh https://api-staging.hotung9108.me <MODULE_ID> <STUDENT_TOKEN>
```
Script sẽ kiểm tra:
1. `401 Unauthorized` khi không có Authorization header.
2. `403 Forbidden` khi tài khoản không có quyền truy cập module.
3. `200 OK` và header `Accept-Ranges: bytes` khi truy vấn đầy đủ.
4. `206 Partial Content` và header `Content-Range: bytes 0-1023/...` khi gửi `Range: bytes=0-1023`.

### 2.2. Chạy Selenium Audio E2E trên Staging [QA-36]
```bash
cd test/selenium
npm run test:student:audio
```
Hoặc dùng script shell:
```bash
./test/scripts/run-selenium-audio-staging.sh
```
Kiểm tra:
- **QA30-015**: Trình duyệt truy cập bài Listening, kích hoạt nút phát âm thanh, điền đáp án câu trả lời ngắn và nộp bài thành công.
- **QA30-016**: Trình duyệt kích hoạt ghi âm (dùng Chrome synthetic audio device), đếm tối thiểu 3 giây, dừng ghi âm, nộp bài và verify API trả về `audioUploadStatus = READY` và `audioStorageKey` hợp lệ.
