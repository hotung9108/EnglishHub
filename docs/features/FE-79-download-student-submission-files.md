# FE-79: Thêm Nút Tải Tệp Bài Làm Của Học Viên (Document & Audio) Trên Giao Diện Frontend

> **Mã tính năng:** `FE-79`  
> **Dự án:** EnglishHub  
> **Người thực hiện:** Phạm Minh Tuấn (`@tuanpham21105` / Trello: `@tunnguyn601`)  
> **Vai trò:** Developer phụ trách nhiệm vụ  
> **Trello Card:** [https://trello.com/c/HYZGwBrw](https://trello.com/c/HYZGwBrw)  
> **Tài liệu bàn giao:** `production_artifacts/pm_to_dev/FE-79-download-student-submission-files.md`  
> **Nhánh Git dự kiến:** `feat/FE-79-download-student-submission-files`  
> **Nhánh đích (Target):** `develop`  

---

## 1. BỐI CẢNH VÀ NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE)

### 1.1. Hiện trạng trên màn hình chấm bài của giáo viên (`TeacherSubmissionDetails.tsx`)
1. **Lỗi tải file Writing**:
   - Nút "Tải xuống" của tệp bài làm đính kèm đang gọi `handleDownloadDocument(storageKey)`.
   - Hàm này sử dụng `resolveStorageUrl(storageKey)` vốn trả về đường dẫn tương đối `/s3-upload/englishhub-dev/...`.
   - Trên môi trường Staging/Production, bucket S3 là private và không cho phép truy cập trực tiếp qua đường dẫn proxy nội bộ, dẫn đến việc giáo viên bấm tải file thì nhận lỗi 403 Forbidden hoặc 404 Not Found.
2. **Thiếu nút tải file âm thanh Speaking**:
   - Khu vực nghe bài làm Nói chỉ có trình phát audio player, chưa có nút bấm riêng cho phép giáo viên tải file ghi âm gốc (`audio.webm` / `audio.mp3`) về máy tính để lưu trữ hoặc nghe ngoại tuyến.

### 1.2. Hiện trạng trên màn hình xem kết quả của học viên (`StudentSubmissionResult.tsx`)
1. Học viên sau khi nộp bài và xem lại kết quả chỉ xem được nội dung hiển thị trên canvas hoặc audio player.
2. Hoàn toàn chưa có nút bấm để học viên tải lại tệp bài viết Writing (file `.docx`, `.pdf` hoặc `essay.txt`) hoặc file âm thanh Speaking mà mình đã nộp lên hệ thống.

---

## 2. QUY CHUẨN KỸ THUẬT VÀ PHƯƠNG ÁN THỰC THI

### 2.1. Tận Dụng Các API Presigned URL Có Sẵn
Backend EnglishHub đã cung cấp đầy đủ các endpoint sinh Presigned GET URL cho bài nộp:
- **Tài liệu Writing**: `GET /api/v1/submission-modules/{id}/document-download-url?mode=download`
  -> Frontend gọi qua `submissionService.getDocumentDownloadUrl(submissionModuleId, 'download')`.
- **Ghi âm Speaking**: `GET /api/v1/submission-modules/{id}/audio-download-url?mode=download`
  -> Frontend gọi qua `submissionService.getAudioDownloadUrl(submissionModuleId, 'download')`.

### 2.2. Hiện Thực Trên `TeacherSubmissionDetails.tsx`
1. **Sửa `handleDownloadDocument`**:
   ```typescript
   const handleDownloadDocument = async (storageKey: string) => {
     if (!activeModule?.id) return;
     try {
       const res = await submissionService.getDocumentDownloadUrl(activeModule.id, 'download');
       const downloadUrl = res.downloadUrl;
       const fileName = res.fileName || getFileNameFromKey(storageKey);
       triggerFileDownload(downloadUrl, fileName);
     } catch (err) {
       console.error('Failed to get document download url:', err);
       showToast(isVi ? 'Không thể tải tệp bài làm. Vui lòng thử lại.' : 'Failed to download file.');
     }
   };
   ```
2. **Thêm nút tải file âm thanh Speaking**:
   - Thêm nút với icon `Download` từ `lucide-react` cạnh trình phát audio:
     ```tsx
     <Button
       type="button"
       variant="outline"
       size="sm"
       icon={Download}
       onClick={() => handleDownloadAudio(activeModule.id)}
       disabled={isDownloadingAudio}
     >
       {isVi ? 'Tải bản ghi âm' : 'Download Audio'}
     </Button>
     ```

### 2.3. Hiện Thực Trên `StudentSubmissionResult.tsx`
1. **Bài viết Writing**:
   - Trong khối header bài nộp hoặc thẻ tài liệu, bổ sung nút:
     ```tsx
     <Button
       type="button"
       variant="outline"
       size="sm"
       icon={Download}
       onClick={handleDownloadStudentDoc}
     >
       {t('studentResult.downloadSubmissionFile') || 'Tải bài làm'}
     </Button>
     ```
2. **Bài thi Speaking**:
   - Thêm nút tải bản ghi âm bên cạnh thanh điều khiển audio của học viên.

### 2.4. Tiện Ích Kích Hoạt Tải File Chuẩn Trình Duyệt (`fileDownload.utils.ts`)
```typescript
export function triggerFileDownload(url: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

---

## 3. CHECKLIST KIỂM THỬ VÀ ĐẢM BẢO CHẤT LƯỢNG (QA CHECKLIST)
- [ ] Giáo viên bấm tải tài liệu Writing dạng `.docx`: File `.docx` được tải về máy thành công, mở được bằng Microsoft Word.
- [ ] Giáo viên bấm tải tài liệu Writing dạng `.pdf`: File `.pdf` được tải về máy thành công, mở được bằng trình xem PDF.
- [ ] Giáo viên bấm tải bản ghi âm Speaking: File âm thanh (`.webm`/`.mp3`) được tải về máy thành công, phát lại bình thường.
- [ ] Học viên bấm tải bài nộp Writing và Speaking của mình trên màn hình kết quả: File được tải về thành công.
- [ ] Kiểm tra trên môi trường Staging: Không bị lỗi 403 Forbidden hay 404 Not Found.
