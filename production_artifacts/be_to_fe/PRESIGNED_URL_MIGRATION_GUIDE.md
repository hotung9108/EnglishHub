# Hướng Dẫn Tích Hợp & Migrate Các Hàm Xử Lý File Presigned URL (S3 / MinIO)

Tài liệu này hướng dẫn các lập trình viên Frontend (FE devs) cách sử dụng và migrate sang các hàm gom nhóm (consolidated helper functions) mới cho các tác vụ tải lên (upload) và tải về (download/get) file thông qua **Presigned URL** kết nối S3 / MinIO.

---

## 1. Bối cảnh & Lý do gom nhóm

Trước đây hoặc ở tầng API thuần, để upload hoặc download file qua S3 Presigned URL, FE dev thường phải tự viết và quản lý từ 2 đến 3 bước thủ công:

- **Khi Upload file (3 bước):**
  1. Gọi API Backend để tạo Presigned PUT URL và nhận `storageKey`.
  2. Dùng `fetch` với method `PUT` đẩy file nhị phân trực tiếp lên S3/MinIO (đồng thời phải tự xử lý dev proxy `/s3-upload` cho môi trường docker MinIO và tránh gửi kèm header `Authorization` làm hỏng chữ ký presigned).
  3. Gọi API confirm về Backend để xác nhận file đã nằm trên storage và cập nhật trạng thái `READY` (đối với audio bài nghe của giáo viên).
- **Khi Lấy file (2 bước):**
  1. Gọi API Backend để tạo Presigned GET URL.
  2. Dùng Presigned URL đó để fetch file nhị phân (Blob) hoặc gán vào thẻ `<audio src="...">` / thẻ `<a>`.

Việc gọi rời rạc này khiến code ở các trang như `TeacherCreateAssignment`, `StudentAssignmentSpeaking`, `StudentAssignmentWriting` bị lặp lại nhiều lần logic HTTP fetch, xử lý proxy MinIO và bắt lỗi.

**Giải pháp:** Tầng service (`moduleService`, `submissionService`) đã gom các chuỗi bước này lại thành các hàm 1-call tiện ích. FE dev chỉ cần gọi **1 hàm duy nhất**.

---

## 2. Bảng tổng hợp các hàm mới

### 2.1. Module Audio (Dành cho Giáo viên tạo / quản lý bài thi Listening)

Vị trí: `src/api/services/module.service.ts`

| Hàm | Số bước đã gom | Mục đích | Kết quả trả về |
| :--- | :--- | :--- | :--- |
| `moduleService.uploadAudio(moduleId, file, mimeType?, options?)` | **3 bước trong 1**<br>1. Request PUT URL<br>2. Upload trực tiếp S3<br>3. Confirm với Backend | Tải file âm thanh bài nghe lên kho lưu trữ và xác nhận hoàn tất. | `Promise<AudioUploadConfirmResponse>`<br>`{ storageKey, uploadStatus: 'READY', message }` |
| `moduleService.getAudioFileBlob(moduleId, options?)` | **2 bước trong 1**<br>1. Lấy presigned GET URL<br>2. Fetch file nhị phân | Tải toàn bộ nội dung file âm thanh về dưới dạng `Blob` (dùng khi cần offline, xử lý âm thanh hoặc tạo ObjectURL). | `Promise<Blob>` |
| `moduleService.getAudioDownloadUrl(moduleId, options?)` | 1 bước (kèm chuẩn hoá proxy) | Lấy link URL presigned đã được chuẩn hóa để gán trực tiếp vào `<audio src={url}>` phát trực tuyến (streaming). | `Promise<AudioDownloadUrlResponse>`<br>`{ downloadUrl, storageKey, mimeType, durationSeconds }` |
| `moduleService.requestAudioUploadUrl(moduleId, mimeType?, options?)` | Bước 1 riêng lẻ | Dùng khi cần lấy URL presigned PUT tùy biến luồng riêng. | `Promise<AudioUploadUrlResponse>` |
| `moduleService.confirmAudioUpload(moduleId, storageKey, options?)` | Bước 3 riêng lẻ | Dùng khi cần xác nhận thủ công storageKey. | `Promise<AudioUploadConfirmResponse>` |

---

### 2.2. Submission Files (Dành cho Học viên nộp Speaking / Writing)

Vị trí: `src/api/services/submission.service.ts`

| Hàm | Số bước đã gom | Mục đích | Kết quả trả về |
| :--- | :--- | :--- | :--- |
| `submissionService.uploadAudio(submissionModuleId, fileOrBlob, mimeType?, options?)` | **2 bước trong 1**<br>1. Lấy presigned PUT URL<br>2. Upload trực tiếp S3 | Tải bản ghi âm Speaking của học viên lên S3. | `Promise<UploadUrlResponse>`<br>`{ uploadUrl, storageKey, expiresAt }` |
| `submissionService.uploadDocument(submissionModuleId, fileOrBlob, mimeType?, options?)` | **2 bước trong 1**<br>1. Lấy presigned PUT URL<br>2. Upload trực tiếp S3 | Tải file bài luận Writing (PDF, DOCX) của học viên lên S3. | `Promise<UploadUrlResponse>`<br>`{ uploadUrl, storageKey, expiresAt }` |
| `submissionService.getAudioFileBlob(submissionModuleId, options?)` | **2 bước trong 1**<br>1. Lấy presigned GET URL<br>2. Fetch file nhị phân | Lấy dữ liệu file ghi âm của học viên dưới dạng `Blob`. | `Promise<Blob>` |
| `submissionService.getDocumentFileBlob(submissionModuleId, mode?, options?)` | **2 bước trong 1**<br>1. Lấy presigned GET URL<br>2. Fetch file nhị phân | Lấy dữ liệu file bài luận Writing dưới dạng `Blob` (tiện tải về máy khách). | `Promise<Blob>` |
| `submissionService.getAudioDownloadUrl(submissionModuleId, options?)` | 1 bước (kèm chuẩn hoá proxy) | Lấy presigned GET URL chuẩn hóa để stream audio bản ghi âm của học viên. | `Promise<SubmissionFileDownloadUrlResponse>` |
| `submissionService.getDocumentDownloadUrl(submissionModuleId, mode?, options?)` | 1 bước (kèm chuẩn hoá proxy) | Lấy presigned GET URL để mở tài liệu trong tab mới hoặc nhúng iframe xem trước. | `Promise<SubmissionFileDownloadUrlResponse>` |

---

### 2.3. Utility dùng chung

Vị trí: `src/utils/storage.utils.ts`

- `normalizeStorageUrl(rawUrl)`: Tự động phát hiện URL trỏ tới `http://minio:9000/...` trong môi trường Docker dev và chuyển thành `/s3-upload/...` để trình duyệt truy cập thông suốt qua proxy.
- `uploadDirectToStorage(uploadUrl, fileOrBlob, mimeType?)`: Hàm PUT trực tiếp lên storage, không đính kèm Bearer token.
- `fetchFileBlobFromPresignedUrl(downloadUrl)`: Hàm GET file từ S3 presigned URL trả về `Blob`.

---

## 3. Hướng dẫn Migrate (Before & After)

### Kịch bản 1: Giáo viên upload Audio bài nghe (TeacherCreateAssignment / TeacherEditAssignment)

#### Trước đây:
```typescript
// Phải gửi multipart/form-data cũ hoặc tự gọi tuần tự 3 request
await moduleService.uploadAudio(moduleId, audioFile); // cách cũ gửi formData
```

#### Sau khi migrate (Chỉ 1 hàm gom gọn):
```typescript
import { moduleService } from '@/api/services/module.service';

// Gọi 1 lệnh: tự lấy presigned PUT -> tự upload lên S3 -> tự gọi confirm
const result = await moduleService.uploadAudio(moduleId, audioFile);

console.log('Audio đã sẵn sàng:', result.storageKey, result.uploadStatus); // 'READY'
```

---

### Kịch bản 2: Học viên nộp ghi âm Speaking (StudentAssignmentSpeaking)

#### Trước đây:
```typescript
// Bước 1: Xin presigned PUT
const { uploadUrl, storageKey } = await submissionService.getAudioUploadUrl(subModuleId, mimeType);

// Bước 2: Tự fetch PUT
await submissionService.uploadDirectToStorage(uploadUrl, audioBlob, mimeType);

// Bước 3: Submit module với storageKey
await submissionService.submitModule(subModuleId, { audioStorageKey: storageKey });
```

#### Sau khi migrate:
```typescript
import { submissionService } from '@/api/services/submission.service';

// Bước 1: 1 hàm duy nhất làm cả xin URL lẫn đẩy lên S3
const { storageKey } = await submissionService.uploadAudio(subModuleId, audioBlob, mimeType);

// Bước 2: Nộp bài với storageKey nhận được
await submissionService.submitModule(subModuleId, { audioStorageKey: storageKey });
```

> **Lưu ý quan trọng cho FE khi học viên bỏ trống bài nói Speaking**:
> Backend đã được cập nhật để cho phép nộp phần thi Speaking mà không bắt buộc có file âm thanh (`empty submission`).
> Nếu học viên không thể ghi âm, FE có thể hiển thị hộp thoại xác nhận bỏ trắng bài nói và gọi trực tiếp `await submissionService.submitModule(subModuleId);` mà không cần gọi upload file. Module Speaking sẽ được chuyển sang `SUBMITTED` bình thường, tránh tình trạng học viên bị kẹt không thể nộp bài thi chung (xem chi tiết tại `production_artifacts/be_to_fe/EMPTY_SPEAKING_SUBMISSION_SPEC.md`).

---

### Kịch bản 3: Học viên nộp file bài luận Writing PDF / DOCX (StudentAssignmentWriting)

#### Trước đây:
```typescript
// Bước 1: Xin presigned PUT
const { uploadUrl, storageKey } = await submissionService.getDocumentUploadUrl(subModuleId, mimeType);

// Bước 2: Tự viết fetch PUT kèm kiểm tra targetUrl minio:9000
let targetUrl = uploadUrl.replace(/^https?:\/\/minio:9000/, '/s3-upload');
await fetch(targetUrl, { method: 'PUT', body: uploadedFile, headers: { 'Content-Type': uploadedFile.type } });

// Bước 3: Submit module
await submissionService.submitModule(subModuleId, { storageKey });
```

#### Sau khi migrate:
```typescript
import { submissionService } from '@/api/services/submission.service';

// Bước 1: 1 hàm gom gọn
const { storageKey } = await submissionService.uploadDocument(subModuleId, uploadedFile);

// Bước 2: Nộp bài
await submissionService.submitModule(subModuleId, { storageKey });
```

---

### Kịch bản 4: Lấy file bài làm để phát âm thanh hoặc tải về máy

#### Cách A: Phát trực tiếp trên thẻ `<audio>` (Khuyên dùng cho streaming để tránh tốn RAM):
```typescript
const { downloadUrl } = await submissionService.getAudioDownloadUrl(submissionModuleId);
// downloadUrl đã được tự động chuẩn hoá (xử lý proxy MinIO nếu có)
audioElement.src = downloadUrl;
```

#### Cách B: Lấy file nhị phân Blob (Khuyên dùng khi muốn lưu file offline hoặc tải về đĩa):
```typescript
// 1 lệnh duy nhất: tự xin presigned GET và tự fetch Blob về
const blob = await submissionService.getDocumentFileBlob(submissionModuleId, 'download');

// Tải file về máy của người dùng
const downloadLink = document.createElement('a');
downloadLink.href = URL.createObjectURL(blob);
downloadLink.download = 'bai-lam-writing.pdf';
downloadLink.click();
URL.revokeObjectURL(downloadLink.href);
```

---

## 4. Checklist khi FE Dev thực hiện refactor màn hình

1. **Không cần viết code fetch thủ công** với `method: 'PUT'` tới S3 nữa.
2. **Không cần tự thay thế regex `http://minio:9000`** ở cấp component nữa (đã được tự động xử lý bên dưới).
3. Đảm bảo import `moduleService` hoặc `submissionService` từ `@/api/services/...`.
4. Khi upload audio Speaking, nên truyền đúng mimeType (ví dụ qua helper `getBackendMimeType(audioBlob)`).
