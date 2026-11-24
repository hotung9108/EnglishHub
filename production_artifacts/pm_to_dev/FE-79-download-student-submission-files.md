# SPECIFICATION HANDOFF: [FE-79] Thêm Nút Tải Tệp Bài Làm Của Học Viên (Document & Audio) Trên Giao Diện Frontend

> **Mã nhiệm vụ:** `[FE-79]`  
> **Trello Card:** [https://trello.com/c/HYZGwBrw](https://trello.com/c/HYZGwBrw)  
> **Cột trạng thái:** `Sprint Backlog`  
> **Người thực hiện:** Phạm Minh Tuấn (`@tuanpham21105` / Trello: `@tunnguyn601`)  
> **Vai trò:** Developer phụ trách nhiệm vụ  
> **Nhánh Git:** `feat/FE-79-download-student-submission-files`  
> **Target Branch:** `develop`  
> **Tài liệu đặc tả:** [`docs/features/FE-79-download-student-submission-files.md`](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/docs/features/FE-79-download-student-submission-files.md)  

---

## 1. MÔ TẢ VẤN ĐỀ VÀ PHÂN TÍCH HIỆN TRẠNG

### 1.1. Hiện trạng
- **Giáo viên xem bài nộp (`TeacherSubmissionDetails.tsx`)**:
  - Tải file bài làm Writing đang gọi `resolveStorageUrl()` trả về chuỗi nội bộ `/s3-upload/...`. Trên Staging/Production, S3 bucket là private và không hỗ trợ proxy trực tiếp nên link bị lỗi 403/404.
  - Phần chấm bài Nói (Speaking) chưa có nút tải file audio ghi âm của học sinh về máy.
- **Học viên xem kết quả (`StudentSubmissionResult.tsx`)**:
  - Chưa có nút để học viên tải lại file bài làm Writing (DOCX/PDF/TXT) hoặc file ghi âm Speaking của mình.

### 1.2. Yêu cầu nghiệp vụ
- Thêm nút "Tải tệp bài làm" (hoặc "Tải bản ghi âm") trực quan bằng icon `Download` cho cả Giáo viên và Học viên.
- Sử dụng chính thức các API sinh Presigned Download URL:
  - Tài liệu: `submissionService.getDocumentDownloadUrl(moduleId, 'download')`
  - Âm thanh: `submissionService.getAudioDownloadUrl(moduleId, 'download')`

---

## 2. QUY TRÌNH THỰC HIỆN TỪNG BƯỚC CHO DEVELOPER (MINH TUẤN)

### Bước 1: Tạo nhánh Git làm việc
```bash
git checkout develop
git pull origin develop
git checkout -b feat/FE-79-download-student-submission-files
```

### Bước 2: Cập Nhật `TeacherSubmissionDetails.tsx`
1. Thay đổi logic tải file tài liệu:
   ```typescript
   const handleDownloadDocument = async (storageKey: string) => {
     if (!activeModule?.id) return;
     try {
       const res = await submissionService.getDocumentDownloadUrl(activeModule.id, 'download');
       const link = document.createElement('a');
       link.href = res.downloadUrl;
       link.download = res.fileName || getFileNameFromKey(storageKey);
       link.target = '_blank';
       link.rel = 'noopener noreferrer';
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
     } catch (err) {
       console.error('Download document error:', err);
       showToast(isVi ? 'Không thể tải tệp bài làm.' : 'Failed to download file.');
     }
   };
   ```
2. Thêm nút tải file ghi âm Speaking cạnh trình phát audio:
   ```typescript
   const handleDownloadAudio = async () => {
     if (!activeModule?.id) return;
     try {
       const res = await submissionService.getAudioDownloadUrl(activeModule.id, 'download');
       const link = document.createElement('a');
       link.href = res.downloadUrl;
       link.download = res.fileName || 'submission_audio.webm';
       link.target = '_blank';
       link.rel = 'noopener noreferrer';
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
     } catch (err) {
       console.error('Download audio error:', err);
       showToast(isVi ? 'Không thể tải bản ghi âm.' : 'Failed to download audio.');
     }
   };
   ```

### Bước 3: Cập Nhật `StudentSubmissionResult.tsx`
- Bổ sung nút tải bài làm tương ứng trong khu vực hiển thị bài nộp Writing và Speaking.

### Bước 4: Kiểm Thử Đơn Vị & Quality Gate
1. Chạy unit tests:
   ```bash
   npm test
   npm run test:ui
   ```
2. Kiểm tra biên dịch:
   ```bash
   npm run build
   ```
3. Mở PR vào `develop` và gắn link thẻ Trello `FE-79`.

---

## 3. TIÊU CHÍ NGHIỆM THU (DEFINITION OF DONE)
- [ ] Giáo viên tải được file bài làm Writing (.docx/.pdf/.txt) bằng Presigned URL thành công trên Staging.
- [ ] Giáo viên tải được file ghi âm Speaking bằng Presigned URL thành công trên Staging.
- [ ] Học viên tải được file bài làm Writing và Speaking của mình trên trang xem kết quả.
- [ ] Tên file tải về khớp với tên file gốc đã nộp kèm định dạng đúng.
- [ ] Toàn bộ unit tests frontend (`npm test` và `npm run test:ui`) pass 100%.
- [ ] Project Doctor (`npm run build`) biên dịch 0 lỗi.
- [ ] Mở PR `feat/FE-79-...` vào `develop` và chuyển card sang `Review`.
