# FE-76: Tích Hợp Phát Audio Đề Bài Listening Qua Presigned URL & Chuẩn Hóa URL Audio Bài Làm Speaking

> **Mã tính năng:** `FE-76`  
> **Dự án:** EnglishHub  
> **Người thực hiện:** Thái Sơn Đoàn (`@doanthaison2706` / Trello: `@thaisndoan`)  
> **Vai trò:** Developer phụ trách nhiệm vụ  
> **Tài liệu bàn giao:** `production_artifacts/pm_to_dev/FE-76-listening-prompt-and-speaking-submission-audio.md`  
> **Nhánh Git dự kiến:** `fix/FE-76-listening-prompt-and-speaking-submission-audio`  
> **Nhánh đích (Target):** `develop`  

---

## 1. BỐI CẢNH VÀ NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE)

### 1.1. Vấn đề 1: Trang làm bài Listening (`StudentAssignmentListening.tsx`) chưa lấy file audio đề bài
- **Hiện trạng:**
  - Trên màn hình làm bài nghe của học sinh, thanh điều khiển audio (Play/Pause, tua tiến/lùi, thanh tiến trình) hoàn toàn là giao diện tĩnh (dummy state: `audioProgress = 30`, `isPlaying = false`).
  - Giao diện không có thẻ `<audio>` thật và không hề gọi API `moduleService.getAudioDownloadUrl(moduleId)` để lấy Presigned GET URL của file âm thanh đề bài.
  - Học sinh không thể nghe đề bài để trả lời các câu hỏi nghe hiểu.
- **Giải pháp:**
  - Khi nạp thông tin module `LISTENING`, gọi `moduleService.getAudioDownloadUrl(moduleId)` (endpoint: `GET /api/v1/modules/{id}/audio-download-url`).
  - Gắn URL nhận được vào đối tượng `Audio` hoặc thẻ `<audio src={audioUrl}>`.
  - Kết nối trạng thái thực tế: Play/Pause, thời lượng (currentTime, duration), sự kiện `timeupdate`, `ended` và thanh điều chỉnh âm lượng/tiến trình.

### 1.2. Vấn đề 2: Dùng sai path trực tiếp (`/s3-upload/...`) thay vì Presigned URL để phát bài làm Speaking
- **Hiện trạng:**
  - Tại `TeacherSubmissionDetails.tsx` (Giáo viên chấm bài Nói) và `StudentSubmissionResult.tsx` (Học sinh xem kết quả bài Nói):
    ```typescript
    const audioStorageKey = audioAnswer?.audioStorageKey;
    const audioUrl = audioStorageKey ? resolveAudioUrl(audioStorageKey) : null;
    ```
  - Hàm `resolveAudioUrl` trong `frontend/src/utils/audioUrl.utils.ts` nối chuỗi trực tiếp:
    ```typescript
    return `/s3-upload/${bucketPrefix}${normalizedKey}`;
    ```
  - **Hậu quả:** Trên môi trường Staging/Production, bucket S3/MinIO là private. Nginx và VPS không hỗ trợ đường dẫn proxy `/s3-upload/` trực tiếp không có chữ ký xác thực (Presigned Signature). Kết quả trình phát âm thanh bị lỗi 404/403 và báo "Trình duyệt không hỗ trợ phát âm thanh" hoặc "Không tìm thấy bản ghi âm".
- **Giải pháp:**
  - Backend API `GET /api/v1/submission-modules/{id}` đã trả về sẵn trường `audioDownloadUrl` trong mảng `answers` (`AnswerDetailResponse.audioDownloadUrl`).
  - Hoặc có thể gọi endpoint `GET /api/v1/submission-modules/{id}/audio-download-url` thông qua `submissionService.getAudioDownloadUrl(submissionModuleId)`.
  - Cập nhật cả `TeacherSubmissionDetails.tsx` và `StudentSubmissionResult.tsx` ưu tiên dùng `answer.audioDownloadUrl` (hoặc gọi API lấy presigned URL), chỉ fallback `resolveAudioUrl` khi ở môi trường local dev mock.

---

## 2. QUY CHUẨN THỰC THI (TECHNICAL REQUIREMENTS)

### 2.1. Phân hệ Student Listening (`StudentAssignmentListening.tsx`)
1. Sử dụng `useRef<HTMLAudioElement>(null)` để tham chiếu đến audio element thật.
2. Nạp `audioUrl` từ `moduleService.getAudioDownloadUrl(moduleDetail.id)`.
3. Đồng bộ các chức năng:
   - Play/Pause toggle.
   - Tua lùi 10 giây (`-10s`), tua tiến 10 giây (`+10s`).
   - Kéo/click thanh tiến trình (Seekable progress bar).
   - Hiển thị thời gian chuẩn định dạng `mm:ss` (Current Time / Duration).
   - Xử lý trạng thái đang tải audio (`isLoadingAudio`) và lỗi tải file âm thanh (`audioError`) kèm nút thử lại.

### 2.2. Phân hệ Teacher Grading Studio (`TeacherSubmissionDetails.tsx`) & Student Result (`StudentSubmissionResult.tsx`)
1. Kiểm tra dữ liệu bài nộp Speaking:
   ```typescript
   const audioAnswer = moduleDetail?.answers?.find(a => !!a.audioStorageKey || !!a.audioDownloadUrl);
   const audioUrl = audioAnswer?.audioDownloadUrl || (audioAnswer?.audioStorageKey ? resolveAudioUrl(audioAnswer.audioStorageKey) : null);
   ```
2. Nếu `audioDownloadUrl` chưa có sẵn hoặc đã hết hạn, gọi `submissionService.getAudioDownloadUrl(submissionModuleId)` để lấy URL presigned mới nhất.
3. Đảm bảo thẻ `<audio controls src={audioUrl}>` phát mượt mà trên môi trường Staging VPS mà không phụ thuộc vào proxy local dev.

---

## 3. TIÊU CHUẨN HOÀN THÀNH (DEFINITION OF DONE - DOD)
- [ ] Màn hình làm bài `StudentAssignmentListening.tsx` gọi đúng `moduleService.getAudioDownloadUrl(moduleId)` và phát được âm thanh đề bài thật.
- [ ] Bộ điều khiển audio Listening (Play, Pause, Tua, Progress bar, Thời gian mm:ss) hoạt động mượt mà với thẻ audio thật.
- [ ] Trang giáo viên chấm bài `TeacherSubmissionDetails.tsx` sử dụng Presigned URL (`audioDownloadUrl`) để phát bài làm Speaking của học sinh, không dùng path `/s3-upload/` cứng.
- [ ] Trang học sinh xem kết quả `StudentSubmissionResult.tsx` sử dụng Presigned URL (`audioDownloadUrl`) để nghe lại bài Nói đã nộp.
- [ ] Viết bổ sung hoặc cập nhật unit test trong `StudentAssignmentListening.test.tsx`, `TeacherSubmissionDetails.test.tsx`, `StudentSubmissionResult.test.tsx`.
- [ ] Chạy `npm --prefix frontend run build` đạt kết quả sạch (0 lỗi TypeScript).
- [ ] Chạy `npm --prefix frontend test` pass 100%.
- [ ] Mở PR vào nhánh `develop` tuân thủ PR convention linter `fix(FE-76): fetch listening prompt audio and fix speaking submission audio download url`.
- [ ] Tester (`@Zawn-Tsu`) kiểm thử thực tế và nghiệm thu trên Staging.
