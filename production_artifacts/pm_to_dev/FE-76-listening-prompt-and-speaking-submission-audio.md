# SPECIFICATION HANDOFF: [FE-76] Tích Hợp Phát Audio Đề Bài Listening Qua Presigned URL & Chuẩn Hóa URL Audio Bài Làm Speaking

> **Mã nhiệm vụ:** `[FE-76]`  
> **Trello Card:** [https://trello.com/c/6Vb2rdww](https://trello.com/c/6Vb2rdww)  
> **Người thực hiện:** Thái Sơn Đoàn (`@doanthaison2706` / Trello: `@thaisndoan`)  
> **Vai trò:** Developer phụ trách nhiệm vụ  
> **Nhánh Git:** `fix/FE-76-listening-prompt-and-speaking-submission-audio`  
> **Target Branch:** `develop`  
> **Tài liệu đặc tả:** [`docs/features/FE-76-listening-prompt-and-speaking-submission-audio.md`](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/docs/features/FE-76-listening-prompt-and-speaking-submission-audio.md)  

---

## 1. MÔ TẢ VẤN ĐỀ VÀ PHÂN TÍCH HIỆN TRẠNG

### 1.1. Lỗi 1: `StudentAssignmentListening.tsx` chưa lấy audio đề bài
- Giao diện làm bài thi Listening của học sinh hiện tại đang dùng các biến state giả lập (`audioProgress = 30`, `isPlaying = false`) mà không có thẻ `<audio>` thật và không gọi API lấy URL âm thanh đề bài.
- **Yêu cầu:** Gọi `moduleService.getAudioDownloadUrl(moduleId)` (endpoint: `GET /api/v1/modules/{moduleId}/audio-download-url`) để nạp file audio và điều khiển phát nhạc bằng thẻ `<audio>` thật.

### 1.2. Lỗi 2: Dùng sai path trực tiếp `/s3-upload/...` khi phát bài làm Speaking
- Trong `TeacherSubmissionDetails.tsx` và `StudentSubmissionResult.tsx`, hệ thống đang lấy `audioStorageKey` và gọi `resolveAudioUrl(audioStorageKey)`. Hàm này trả về path tương đối `/s3-upload/englishhub-dev/...`.
- Đường dẫn `/s3-upload/...` chỉ là proxy cục bộ của Vite dev server, hoàn toàn không hoạt động trên Staging/Production vì S3 bucket là private và không cho phép truy cập trực tiếp.
- **Yêu cầu:** Sử dụng Presigned GET URL (`audioDownloadUrl`) đã được trả về sẵn trong đối tượng answer từ `submissionService.getSubmissionModuleDetail()`, hoặc gọi `submissionService.getAudioDownloadUrl(submissionModuleId)` (`GET /api/v1/submission-modules/{id}/audio-download-url`).

---

## 2. QUY TRÌNH THỰC HIỆN TỪNG BƯỚC

### Bước 1: Tạo nhánh Git làm việc
```bash
git checkout develop
git pull origin develop
git checkout -b fix/FE-76-listening-prompt-and-speaking-submission-audio
```

### Bước 2: Hiện thực Audio Player thật trong `StudentAssignmentListening.tsx`
1. Khai báo ref và state:
   ```typescript
   const audioRef = useRef<HTMLAudioElement | null>(null);
   const [audioUrl, setAudioUrl] = useState<string | null>(null);
   const [currentTime, setCurrentTime] = useState<number>(0);
   const [duration, setDuration] = useState<number>(0);
   const [isPlaying, setIsPlaying] = useState<boolean>(false);
   const [audioLoading, setAudioLoading] = useState<boolean>(false);
   ```
2. Gọi API lấy audio URL khi nạp module:
   ```typescript
   if (moduleDetail?.id) {
     setAudioLoading(true);
     moduleService.getAudioDownloadUrl(moduleDetail.id)
       .then(res => setAudioUrl(res.downloadUrl))
       .catch(err => console.error('Failed to load listening audio URL', err))
       .finally(() => setAudioLoading(false));
   }
   ```
3. Gắn thẻ `<audio>` ẩn và bind các sự kiện:
   - `onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}`
   - `onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}`
   - `onEnded={() => setIsPlaying(false)}`
4. Điều khiển:
   - Toggle Play/Pause: `if (isPlaying) audioRef.current?.pause(); else audioRef.current?.play();`
   - Tua: `audioRef.current.currentTime = Math.max(0, currentTime - 10)` và `Math.min(duration, currentTime + 10)`.
   - Tiến trình: `(currentTime / duration) * 100`.

### Bước 3: Sửa nguồn phát audio Speaking trong `TeacherSubmissionDetails.tsx` và `StudentSubmissionResult.tsx`
1. Thay vì:
   ```typescript
   const audioUrl = audioStorageKey ? resolveAudioUrl(audioStorageKey) : null;
   ```
2. Đổi thành:
   ```typescript
   const audioUrl = audioAnswer?.audioDownloadUrl || (audioStorageKey ? resolveAudioUrl(audioStorageKey) : null);
   ```
3. Bổ sung fallback gọi `submissionService.getAudioDownloadUrl(submissionModuleId)` khi `audioAnswer.audioDownloadUrl` bị null hoặc hết hạn.

### Bước 4: Kiểm thử và mở Pull Request
1. Chạy build kiểm tra TypeScript:
   ```bash
   npm --prefix frontend run build
   ```
2. Chạy bộ unit test:
   ```bash
   npm --prefix frontend test
   ```
3. Mở Pull Request vào nhánh `develop`:
   - Tiêu đề: `fix(FE-76): fetch listening prompt audio and fix speaking submission audio download url`
   - Gán Trello card link vào mô tả PR.

---

## 3. CHECKLIST NGHIỆM THU (DOD)
- [ ] Màn hình làm bài `StudentAssignmentListening.tsx` gọi đúng `moduleService.getAudioDownloadUrl(moduleId)` và phát được âm thanh đề bài thật.
- [ ] Bộ điều khiển audio Listening (Play, Pause, Tua, Progress bar, Thời gian mm:ss) hoạt động mượt mà với thẻ audio thật.
- [ ] Trang giáo viên chấm bài `TeacherSubmissionDetails.tsx` sử dụng Presigned URL (`audioDownloadUrl`) để phát bài làm Speaking của học sinh, không dùng path `/s3-upload/` cứng.
- [ ] Trang học sinh xem kết quả `StudentSubmissionResult.tsx` sử dụng Presigned URL (`audioDownloadUrl`) để nghe lại bài Nói đã nộp.
- [ ] Viết bổ sung hoặc cập nhật unit test trong `StudentAssignmentListening.test.tsx`, `TeacherSubmissionDetails.test.tsx`, `StudentSubmissionResult.test.tsx`.
- [ ] Chạy `npm --prefix frontend run build` đạt kết quả sạch (0 lỗi TypeScript).
- [ ] Chạy `npm --prefix frontend test` pass 100%.
- [ ] Mở PR vào nhánh `develop` tuân thủ PR convention linter `fix(FE-76): ...`.
- [ ] Tester (`@Zawn-Tsu`) kiểm thử thực tế và nghiệm thu trên Staging.
