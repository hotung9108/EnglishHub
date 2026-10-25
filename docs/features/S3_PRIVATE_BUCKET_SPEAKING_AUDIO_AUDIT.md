# BÁO CÁO RÀ SOÁT KIẾN TRÚC & PHÂN TÍCH LỖI TRUY CẬP S3 BUCKET PRIVATE (HTTP 403 ACCESSDENIED)
## PHÂN HỆ PHÁT ÂM THANH BÀI NỘI (SPEAKING SUBMISSION AUDIO PLAYBACK)

- **Mã tài liệu**: `DOC-AUDIT-S3-SPEAKING-AUDIO-01`
- **Ngày lập**: 2026-10-24
- **Tác giả**: Frontend Engineering Team (`@fe-primary` / Maloque18705)
- **Trạng thái**: Hoàn thành phía Frontend (Chờ phối hợp Backend & DevOps)
- **Đối tượng áp dụng**: `@fe-primary`, `@be-primary`, `@be-secondary`, `@devops-primary`, `@tester`
- **Tài liệu liên quan**:
  - [.agents/rules/convention-fe.md](file:///d:/Coding/EnglishHub/.agents/rules/convention-fe.md)
  - [.agents/private/frontend-ui-standards](file:///d:/Coding/EnglishHub/.agents/private/frontend-ui-standards)
  - [ADR-002: Chuẩn Hóa Lớp Lưu Trữ Tệp S3-Compatible và Presigned URL](file:///d:/Coding/EnglishHub/docs/supplements/adr/ADR-002-s3-presigned-url-upload.md)
  - [Hướng dẫn cấu hình S3 Service Credentials](file:///d:/Coding/EnglishHub/docs/devops/s3-config-guide.md)

---

## 1. TỔNG QUAN SỰ VỤ & BỐI CẢNH

### 1.1. Hiện tượng báo cáo từ người dùng
Khi học viên hoàn thành nộp bài thi Nói (Speaking module):
1. **AI chấm điểm thành công**: Hệ thống backend AI (`GradingAiAnalysisServiceImpl`) vẫn đọc được tệp âm thanh và trả về trạng thái `AI_GRADED`, đi kèm điểm số các tiêu chí (Fluency, Pronunciation, Grammar, Vocabulary) cùng nhận xét chi tiết.
2. **Giao diện không thể nghe lại bài ghi âm**:
   - Ở trang kết quả học viên ([StudentSubmissionResult.tsx](file:///d:/Coding/EnglishHub/frontend/src/pages/StudentSubmissionResult.tsx)): Thẻ trình phát âm thanh không phát được bài nộp của học viên.
   - Ở trang giáo viên chấm bài ([TeacherSubmissionDetails.tsx](file:///d:/Coding/EnglishHub/frontend/src/pages/TeacherSubmissionDetails.tsx)): Thẻ phát âm thanh bài nộp cũng không thể tải và phát lại âm thanh để giáo viên nghe và chấm điểm thủ công.

### 1.2. Ràng buộc kỹ thuật nghiêm ngặt
- **Phạm vi can thiệp**: Chỉ thực hiện chỉnh sửa trong mã nguồn Frontend (`frontend/src/`).
- **Nghiêm cấm can thiệp**: Không sửa đổi mã nguồn Backend Java Spring Boot và không sửa đổi file cấu hình Docker Compose (`docker-compose.dev.yml`).
- **Quy chuẩn bắt buộc**: Tuân thủ tuyệt đối [convention-fe.md](file:///d:/Coding/EnglishHub/.agents/rules/convention-fe.md) (TypeScript nghiêm ngặt, xử lý đủ 3 trạng thái loading/error/empty, không inline styles, token-based) và `.agents/private/frontend-ui-standards` (Theme Royal Academic, zero-bloat, 8px grid spacing, trạng thái lỗi trang nhã).

---

## 2. NGHỊCH LÝ VÀ PHÂN TÍCH NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE ANALYSIS)

### 2.1. Nghịch lý: "Tại sao AI chấm được mà Người dùng không nghe được?"
Sự mâu thuẫn này bắt nguồn từ **Kiến trúc hai luồng truy cập đối tượng độc lập (Dual Access Path)** giữa Server-to-Server và Browser-to-Storage:

```
                            [MinIO / S3 Storage]
                           (Bucket: englishhub-dev)
                           [Policy: anonymous none]
                                /          \
         (A) Root S3Client /   /            \ (B) Unauthenticated
       Presigned GET Request  /              \      HTTP GET
                             /                \
            [GradingAiAnalysisServiceImpl]     [Browser: <audio src="...">]
                 (Backend / AI Worker)            (Student / Teacher)
                         |                                 |
                         v                                 v
                 TẢI FILE THÀNH CÔNG             BỊ CHẶN BỞI MINIO:
                 (Status: AI_GRADED)             HTTP 403 Forbidden
                                                 <Code>AccessDenied</Code>
```

#### Luồng A: Phía Backend AI (Đặc quyền cao)
- `GradingAiAnalysisServiceImpl.java` sử dụng bean `StorageService` (`S3StorageService.java`), được khởi tạo bằng tài khoản quản trị S3 gốc (`MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`).
- Khi AI phân tích bài nói, backend gọi `storageService.generatePresignedGetUrl(storageKey)` (sinh URL có chữ ký bảo mật HMAC-SHA256 tạm thời có TTL 15 phút) hoặc trực tiếp đọc mảng byte nhị phân qua `getObjectBytes(storageKey)`.
- Do đó, MinIO chứng thực quyền hợp lệ 100%, AI Service phân tích file âm thanh và trả kết quả chấm `AI_GRADED`.

#### Luồng B: Phía Trình duyệt Người dùng (Không có đặc quyền)
- Khi Student mở [StudentSubmissionResult.tsx](file:///d:/Coding/EnglishHub/frontend/src/pages/StudentSubmissionResult.tsx) hoặc Teacher mở [TeacherSubmissionDetails.tsx](file:///d:/Coding/EnglishHub/frontend/src/pages/TeacherSubmissionDetails.tsx), client gọi API:
  `GET /api/v1/submission-modules/{submissionModuleId}`
- API backend trả về DTO `AnswerDetailResponse`:
  ```json
  {
    "id": 258,
    "questionId": 917,
    "audioStorageKey": "submissions/258/module-917/audio.webm",
    "audioMimeType": "audio/webm",
    "audioUploadStatus": "COMPLETED"
  }
  ```
- **Lỗ hổng hợp đồng dữ liệu**: API chỉ trả về `audioStorageKey` dạng chuỗi đường dẫn tương đối nội bộ. Backend **KHÔNG** trả về URL đã được ký số (`audioDownloadUrl` / presigned GET URL).
- Thẻ HTML5 `<audio src="...">` trên trình duyệt buộc phải gọi trực tiếp tới file lưu trữ thông qua proxy:
  `GET http://localhost:5173/s3-upload/englishhub-dev/submissions/258/module-917/audio.webm`
- Request này hoàn toàn không có tham số xác thực chữ ký S3 (`X-Amz-Signature`).

### 2.2. Lỗi phân mảnh URL trước khi sửa tại Frontend
Trước đợt rà soát này, mã nguồn Frontend xử lý `audioStorageKey` bị lệch chuẩn:
1. **Phía Student ([StudentSubmissionResult.tsx](file:///d:/Coding/EnglishHub/frontend/src/pages/StudentSubmissionResult.tsx))**:
   ```ts
   // CODE CŨ TRƯỚC SỬA:
   const resolveAudioUrl = (storageKey?: string) => {
     if (!storageKey) return '';
     if (storageKey.startsWith('http://') || storageKey.startsWith('https://')) return storageKey;
     return `/s3-upload/${storageKey.replace(/^\/+/, '')}`;
   };
   ```
   => URL tạo ra: `/s3-upload/submissions/258/module-917/audio.webm`
   => **Kết quả**: MinIO coi `submissions` là tên Bucket! MinIO trả về **HTTP 404/400 `NoSuchBucket`**, tệp không bao giờ đến được đúng bucket `englishhub-dev`.
2. **Phía Teacher ([TeacherSubmissionDetails.tsx](file:///d:/Coding/EnglishHub/frontend/src/pages/TeacherSubmissionDetails.tsx))**:
   Có tự chèn prefix `englishhub-dev/`, dẫn đến URL: `/s3-upload/englishhub-dev/submissions/258/module-917/audio.webm`.
   => URL đến đúng bucket, nhưng gặp rào cản chính sách bảo mật MinIO `AccessDenied`.
3. **Trải nghiệm người dùng (UX) khi phát sinh lỗi**:
   Cả hai giao diện khi thẻ `<audio>` bị lỗi mạng (403/NoSuchBucket) đều không có thông báo trang nhã cho người dùng, người dùng chỉ thấy thanh phát âm thanh bị liệt (disabled) hoặc phát 0:00 mà không hiểu nguyên nhân.

---

## 3. CÁC THAY ĐỔI ĐÃ TRIỂN KHAI PHÍA FRONTEND

Tuân thủ nghiêm ngặt yêu cầu không sửa backend/docker, đội ngũ Frontend đã tái cấu trúc và hoàn thiện toàn bộ phân hệ phát âm thanh như sau:

### 3.1. Chuẩn hoá Single Source of Truth: [audioUrl.utils.ts](file:///d:/Coding/EnglishHub/frontend/src/utils/audioUrl.utils.ts)
Tạo file tiện ích dùng chung độc lập [frontend/src/utils/audioUrl.utils.ts](file:///d:/Coding/EnglishHub/frontend/src/utils/audioUrl.utils.ts) với hàm `resolveAudioUrl`:
- **Loại bỏ phân mảnh logic**: Cả học viên và giáo viên đều dùng chung một bộ phân giải URL duy nhất.
- **Xử lý URL nội bộ Docker**: Tự động chuyển đổi `http://minio:9000/...` thành `/s3-upload/...` qua Vite Proxy mà vẫn bảo toàn đầy đủ chuỗi chữ ký truy vấn nếu có.
- **Bảo toàn URL tuyệt đối**: Giữ nguyên vẹn các URL CDN bên ngoài (`https://...`).
- **Chuẩn hoá Bucket Name**: Tự động chèn tiền tố `englishhub-dev/` nếu storage key nhận được từ backend là đường dẫn tương đối (ví dụ `submissions/1/audio.webm`).

### 3.2. Cập nhật giao diện và Trạng thái lỗi chuẩn Royal Academic
1. **[StudentSubmissionResult.tsx](file:///d:/Coding/EnglishHub/frontend/src/pages/StudentSubmissionResult.tsx)**:
   - Tích hợp `resolveAudioUrl` từ utils.
   - Thêm trạng thái `audioError` được quản lý phản ứng (reset tự động khi URL thay đổi).
   - Thêm sự kiện `onError={() => setAudioError(true)}` trên thẻ `<audio>`.
   - Bổ sung khối cảnh báo lỗi âm thanh trang nhã với nút "Tải lại âm thanh" (`variant="secondary"`, icon `RefreshCw`).
2. **[TeacherSubmissionDetails.tsx](file:///d:/Coding/EnglishHub/frontend/src/pages/TeacherSubmissionDetails.tsx)**:
   - Xóa bỏ hàm cục bộ và đồng bộ sử dụng `resolveAudioUrl`.
   - Bổ sung giao diện thông báo lỗi âm thanh bài nộp của học sinh đồng bộ phong cách với trang học viên.
3. **Kiểu dáng CSS chuẩn hóa trong [student-result.css](file:///d:/Coding/EnglishHub/frontend/src/styles/student-result.css) và [teacher.css](file:///d:/Coding/EnglishHub/frontend/src/styles/teacher.css)**:
   - Áp dụng các biến token hệ thống: `var(--color-danger)`, `var(--color-danger-light)`, `var(--radius-sm)`, `var(--space-2)`.
   - Đảm bảo 100% không dùng inline style, tuân thủ nguyên tắc zero-bloat và spacing 8px.

### 3.3. Kiểm thử tự động (Unit Tests)
Đã bổ sung bộ kiểm thử đơn vị độc lập tại [frontend/src/api/__tests__/audioUrl.test.ts](file:///d:/Coding/EnglishHub/frontend/src/api/__tests__/audioUrl.test.ts):
- Kiểm thử null, undefined, chuỗi rỗng.
- Kiểm thử rewrite host nội bộ docker `//minio:9000/`.
- Kiểm thử bảo toàn URL CDN ngoài.
- Kiểm thử chèn bucket prefix đối với storage key tương đối.
- **Kết quả**: 143/143 unit test toàn frontend đều PASSED, lệnh `npm run build` (bao gồm `tsc -b && vite build`) hoàn thành với 0 cảnh báo/lỗi type.

---

## 4. RÀ SOÁT CÁC LỖI CÒN LẠI LIÊN QUAN TỚI S3 BUCKET PRIVATE (HTTP 403 ACCESSDENIED)

Dù Frontend đã hoàn thiện tối đa trong phạm vi cho phép, việc **không thay đổi Backend hoặc Docker** dẫn đến các vấn đề tồn đọng cố hữu mang tính kiến trúc:

### 4.1. Giới hạn bản chất của giải pháp thuần Frontend
- **Nguyên lý bảo mật đám mây (OWASP Cloud Security)**:
  Bucket `englishhub-dev` được thiết lập `mc anonymous set none` (chặn toàn bộ truy cập không có chữ ký số). Để đọc được một tệp trong private bucket, bắt buộc phải có chữ ký số HMAC-SHA256 được tạo ra từ `AWS_SECRET_ACCESS_KEY`.
- **Frontend không được phép nắm giữ Secret Key**:
  Frontend chạy trực tiếp trên trình duyệt của người dùng. Việc đưa `AWS_SECRET_ACCESS_KEY` xuống client để tự sinh presigned URL là vi phạm nghiêm trọng nguyên tắc an toàn thông tin (lộ toàn bộ bucket cho bất kỳ ai inspect mã nguồn).
- **Hệ quả**: Nếu Backend không chủ động cấp Presigned GET URL hoặc không mở cổng proxy truyền luồng dữ liệu (stream), trình duyệt gửi request thô tới `/s3-upload/englishhub-dev/...` **vẫn sẽ bị MinIO từ chối với mã HTTP 403 Forbidden: AccessDenied**.

### 4.2. Rủi ro phá vỡ kiến trúc trên Staging và Production
- **Vite Proxy `/s3-upload` chỉ tồn tại ở Local Development**:
  Proxy `/s3-upload` được cấu hình trong `frontend/vite.config.ts`. Cơ chế này chỉ chạy khi lập trình viên chạy Vite Dev Server (`npm run dev`).
- **Trên môi trường Staging / Production**:
  - Ứng dụng Frontend được biên dịch thành các tệp tĩnh (HTML, JS, CSS) và phục vụ qua Nginx hoặc Cloudflare Pages.
  - Khi đó, đường dẫn tương đối `/s3-upload/...` sẽ bị máy chủ Web trả về **HTTP 404 Not Found** (vì Nginx không có directive proxy tương ứng) hoặc trỏ sai máy chủ.
  - Kho lưu trữ trên Staging/Production sử dụng AWS S3 hoặc Cloudflare R2 với bucket **Private tuyệt đối** để bảo vệ dữ liệu cá nhân (PII) và bài thi của học viên. Không một hệ thống giáo dục nào được phép mở `public download` cho toàn bộ bucket chứa bài nộp của học viên.

### 4.3. Các phân hệ khác trong hệ thống đang gặp lỗi tiềm ẩn tương tự
Qua rà soát toàn bộ codebase frontend, có thêm hai phân hệ đang chịu ảnh hưởng trực tiếp từ cơ chế này:
1. **Phát âm thanh bài nghe của Giáo viên ([TeacherAssignmentDetails.tsx](file:///d:/Coding/EnglishHub/frontend/src/pages/TeacherAssignmentDetails.tsx))**:
   - Dòng 200: `audio = modDetail.sourceAudioStorageKey || ''`
   - Dòng 605: `<audio controls src={activeMod.audioUrl}>`
   - Giáo viên khi xem lại bài tập nghe (Listening module) cũng nhận được chuỗi key tương đối (ví dụ `modules/131/audio/sample.mp3`). Trình duyệt cố gắng tải trực tiếp file này và cũng sẽ gặp lỗi 403 hoặc 404.
2. **Tải tệp tài liệu bài nộp phần Viết ([TeacherSubmissionDetails.tsx](file:///d:/Coding/EnglishHub/frontend/src/pages/TeacherSubmissionDetails.tsx) & [StudentSubmissionResult.tsx](file:///d:/Coding/EnglishHub/frontend/src/pages/StudentSubmissionResult.tsx))**:
   - `docStorageKey` được trả về cho các bài nộp dạng Essay/File đính kèm (ví dụ `submissions/10/module-12/essay.pdf`).
   - Giao diện giáo viên hiện tại có nút tải tệp (dòng 651), nhưng chỉ có thể hiển thị thông báo tạm thời `showToast('Preparing download...')` do API backend chưa cung cấp link tải có chữ ký số.

---

## 5. BẢNG TỔNG HỢP TRẠNG THÁI & MA TRẬN TÁC ĐỘNG

| Phân hệ / Tính năng | Hiện trạng Frontend | Cơ chế API Backend hiện tại | Kết quả Runtime (Private Bucket) | Trạng thái kỹ thuật |
|---|---|---|---|---|
| **Student Speaking Playback** | Đã sửa, có UI báo lỗi & retry | Chỉ trả về `audioStorageKey` thô | 403 Forbidden (AccessDenied) | Cần Backend bổ sung Presigned GET URL |
| **Teacher Speaking Playback** | Đã sửa, có UI báo lỗi & retry | Chỉ trả về `audioStorageKey` thô | 403 Forbidden (AccessDenied) | Cần Backend bổ sung Presigned GET URL |
| **Teacher Listening Preview** | Trỏ vào `sourceAudioStorageKey` | Chỉ trả về storage key thô | 403 Forbidden / Failed load | Cần Backend bổ sung Presigned GET URL |
| **Teacher Writing Doc Download** | Có component UI FileItem | Chỉ trả về `docStorageKey` thô | Chưa có URL để tải tệp | Cần Backend bổ sung Presigned GET URL |
| **Speaking AI Auto-Grading** | Không liên quan trực tiếp | Backend dùng root credentials | **Thành công 100% (AI_GRADED)** | Đã hoạt động tốt |

---

## 6. ĐỀ XUẤT KIẾN TRÚC BÀN GIAO CHO BACKEND & DEVOPS

Để hệ thống vận hành hoàn chỉnh trên toàn bộ các môi trường (Dev, Staging, Prod), đề xuất chuyển giao nhiệm vụ như sau:

### 6.1. Dành cho Backend Team (`@be-primary`, `@be-secondary`)
Áp dụng đúng định hướng đã được phê duyệt trong [ADR-002](file:///d:/Coding/EnglishHub/docs/supplements/adr/ADR-002-s3-presigned-url-upload.md):
1. **Tận dụng phương thức đã có sẵn trong mã nguồn**:
   Trong [S3StorageService.java](file:///d:/Coding/EnglishHub/backend/src/main/java/com/english_hub/core/modules/submission/infrastructure/storage/S3StorageService.java#L78-L86), phương thức `generatePresignedGetUrl(String storageKey)` **đã được cài đặt sẵn** với thời hạn `PRESIGN_TTL` (15 phút).
2. **Cập nhật DTO `AnswerDetailResponse`**:
   Bổ sung thêm 2 trường:
   ```java
   public record AnswerDetailResponse(
       Long id,
       Long questionId,
       JsonNode content,
       String docStorageKey,
       String docDownloadUrl,     // <--- BỔ SUNG PRESIGNED GET URL
       String docMimeType,
       String docUploadStatus,
       String audioStorageKey,
       String audioDownloadUrl,   // <--- BỔ SUNG PRESIGNED GET URL
       String audioMimeType,
       String audioUploadStatus
   )
   ```
3. **Ánh xạ trong `SubmissionService.java`**:
   Khi truy vấn chi tiết bài nộp cho học sinh hoặc giáo viên:
   ```java
   String audioDownloadUrl = answer.getAudioStorageKey() != null 
       ? storageService.generatePresignedGetUrl(answer.getAudioStorageKey()) 
       : null;
   ```
   *Lợi ích*: Giữ nguyên tính bảo mật của Private Bucket, không gây tải cho máy chủ Spring Boot, tương thích 100% với chuẩn S3 API trên AWS S3, Cloudflare R2 và MinIO.

### 6.2. Dành cho DevOps Team (`@devops-primary`)
1. **Giải pháp tạm thời cho môi trường Local Dev (`docker-compose.dev.yml`)**:
   Nếu muốn hỗ trợ phát âm thanh ngay lập tức trên máy lập trình viên trước khi backend cập nhật DTO, cập nhật container `minio-setup` trong `docker-compose.dev.yml`:
   ```yaml
   # THAY ĐỔI DÒNG 131:
   # mc anonymous set none local/"$$MINIO_BUCKET"
   # THÀNH:
   mc anonymous set download local/"$$MINIO_BUCKET"
   ```
   *Lưu ý*: Chỉ áp dụng cho môi trường phát triển cục bộ (dev), tuyệt đối không áp dụng cho Staging/Production.
2. **Cấu hình Nginx / CDN Staging**:
   Đảm bảo cấu hình CORS trên S3/R2 cho phép header `Range` để trình duyệt người dùng có thể tua âm thanh (audio seeking) mượt mà.

---

## 7. HƯỚNG DẪN KIỂM THỬ DÀNH CHO QA (`@tester`)

1. **Kiểm thử xử lý giao diện khi gặp lỗi 403 (Test UI Error Handling)**:
   - Đăng nhập bằng tài khoản học sinh (`student1@englishhub.com` / `Password123!`).
   - Mở bài nộp Speaking đã chấm.
   - Khi MinIO trả về lỗi mạng / 403 AccessDenied, xác nhận giao diện hiển thị thông báo thân thiện: *"Không thể tải tệp âm thanh bài nói từ kho lưu trữ (S3/MinIO)"* cùng nút *"Thử lại"* với icon xoay.
   - Bấm nút *"Thử lại"*, kiểm tra xem trình duyệt có kích hoạt lại việc tải tệp âm thanh hay không.
2. **Kiểm thử tương thích đường dẫn âm thanh (Test URL Resolution)**:
   - Chạy lệnh test: `npm --prefix frontend run test audioUrl`
   - Xác nhận 6/6 test cases của `audioUrl.utils.ts` đạt kết quả PASSED.
3. **Kiểm thử hồi quy toàn bộ hệ thống Frontend**:
   - Chạy lệnh: `npm --prefix frontend run test` (143 unit tests passing).
   - Chạy lệnh: `npm --prefix frontend run build` (Biên dịch TypeScript và Vite đóng gói thành công 100%).
