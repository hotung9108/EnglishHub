# Bàn giao FE -> BE: Bổ sung Guard kiểm tra Audio khi nộp bài Speaking (Issue #176)

- **Người gửi**: Frontend Team (`@fe-primary`, `@fe-secondary`)
- **Người nhận**: Backend Team (`@be-primary`, `@be-secondary`)
- **Ngày lập**: 31/10/2026
- **Liên quan**: Bug Issue #176 (`QA30-016`), Issue #183 (`QA30-039`)
- **Trạng thái FE**: Đã hoàn thành (chặn nộp khi chưa có bản ghi, loại bỏ dead code, kiểm tra hậu submit `Boolean(firstAnswer) && audioUploadStatus === 'READY'` để chặn hoàn tất bài thi nếu file chưa sẵn sàng).

---

## 1. Bối cảnh & Hiện tượng (Issue #176)

Khi học sinh làm bài Speaking dạng `RECORDING`:
- Tại [`SubmissionService.java`](file:///D:/Coding/EnglishHub/backend/src/main/java/com/english_hub/core/modules/submission/application/service/SubmissionService.java#L316-L346) trong hàm `submitFileModule`:
  ```java
  FileCandidate found = candidates.stream()
      .filter(candidate -> storageService.objectExists(
          storageKey(submission.getId(), submissionModule.getId(), filename, candidate.extension())))
      .findFirst()
      .orElse(null);

  String matchedKey = found == null
      ? null
      : storageKey(submission.getId(), submissionModule.getId(), filename, found.extension());
  UploadStatus uploadStatus = found == null ? UploadStatus.UPLOADING : UploadStatus.READY;
  ...
  submissionModule.setStatus(SubmissionStatus.SUBMITTED);
  submissionModuleRepository.save(submissionModule);
  ```
- **Vấn đề cốt lõi**:
  Nếu `found == null` (ví dụ do lỗi mạng lúc PUT hoặc file chưa kịp hoàn tất ghi vào MinIO/S3), Backend vẫn gán `UploadStatus.UPLOADING` và **chốt `submissionModule.setStatus(SubmissionStatus.SUBMITTED)` vào cơ sở dữ liệu**.
- **Hệ quả nghiêm trọng**:
  Tại đầu hàm `submitModule`:
  ```java
  if (submissionModule.getStatus() != SubmissionStatus.IN_PROGRESS) {
      throw ApiException.badRequest(ALREADY_SUBMITTED_MESSAGE); // "Phần làm bài này đã được nộp."
  }
  ```
  Một khi `submissionModule` đã bị chuyển sang `SUBMITTED`, Frontend **hoàn toàn không thể retry nộp lại được nữa** vì mọi request `submitModule` tiếp theo đều bị Backend chặn với HTTP 400 (`"Phần làm bài này đã được nộp."`). Điều này khiến bài nộp bị kẹt ở trạng thái mồ côi (không có audio nhưng đã nộp).

---

## 2. Phần việc Frontend đã thực hiện (Done)

Tại [`frontend/src/pages/StudentAssignmentSpeaking.tsx`](file:///D:/Coding/EnglishHub/frontend/src/pages/StudentAssignmentSpeaking.tsx):
1. **Nút "Nộp bài"**: Được khóa chặt chẽ bằng `disabled={isSubmitting || isRecording || !recordedAudioReady || !submission}` (với `recordedAudioReady = Boolean(audioBlob && audioBlob.size > 0 && audioUrl)`). Loại bỏ hoàn toàn mã thừa `if (isRecording)`.
2. **Payload `submitModule`**: Gọi `submitModule(subModuleId)` sạch (không gửi thừa các trường `storageKey` hay `audioStorageKey` mà DTO Backend không nhận).
3. **Guard hậu kiểm**: Sau khi gọi `submitModule`, kiểm tra nghiêm ngặt `Boolean(firstAnswer)` và trạng thái `audioUploadStatus === 'READY'`. Nếu không thỏa mãn, ném lỗi dừng lại ngay lập tức, **không** gọi `submitSubmission` và **không** chuyển hướng sang trang kết quả.
4. **Nút "Thử lại"**: Phân định ranh giới lỗi bằng `isUploadPhaseError`. Nếu lỗi ở pha upload PUT lên S3, học sinh bấm "Thử lại" sẽ nộp lại trực tiếp với Blob trong RAM. Nếu lỗi xảy ra sau khi gọi `submitModule`, nút "Thử lại" sẽ kích hoạt tải lại dữ liệu từ server thay vì cố gửi lại request để tránh xung đột mã lỗi 400.

---

## 3. Phần việc Backend cần xử lý (Bắt buộc phía BE)

Tại [`SubmissionService.java#L316-L346`](file:///D:/Coding/EnglishHub/backend/src/main/java/com/english_hub/core/modules/submission/application/service/SubmissionService.java#L316-L346) trong hàm `submitFileModule`:

### Logic cần bổ sung:
```java
// Khi taskType là RECORDING:
if (taskType == ModuleTaskType.RECORDING) {
    if (found == null) {
        throw ApiException.badRequest("Không tìm thấy tệp âm thanh bài nói trong kho lưu trữ. Vui lòng thử lại.");
    }
}
```

### Yêu cầu:
- Ném `ApiException.badRequest(...)` **TRƯỚC KHI** gọi `submissionModule.setStatus(SubmissionStatus.SUBMITTED)`.
- Giữ nguyên trạng thái `submissionModule` là `IN_PROGRESS` trong Database khi upload thất bại, để học sinh có thể tải lại file và nộp lại thành công.
