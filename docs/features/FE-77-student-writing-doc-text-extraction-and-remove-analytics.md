# FE-77: Trích Xuất Nội Dung Văn Bản File DOCX/PDF Bài Viết Writing & Loại Bỏ Mục Phân Tích Học Tập

> **Mã tính năng:** `FE-77`  
> **Dự án:** EnglishHub  
> **Người thực hiện:** Tiến Sơn Trần (`@Maloque18705` / Trello: `@tinsntrn`) & Hồ Việt Tùng (`@hotung9108` / Trello: `@hvittung`)  
> **Vai trò:** Frontend Developer Lead & PM  
> **Trello Card:** [https://trello.com/c/0pYdQX0q](https://trello.com/c/0pYdQX0q)  
> **Tài liệu bàn giao:** `production_artifacts/pm_to_dev/FE-77-student-writing-doc-text-extraction-and-remove-analytics.md`  
> **Nhánh Git dự kiến:** `fix/FE-77-student-writing-doc-text-and-remove-analytics`  
> **Nhánh đích (Target):** `develop`  

---

## 1. BỐI CẢNH VÀ NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE)

### 1.1. Vấn đề 1: Tràn mã nhị phân khi hiển thị bài làm Writing dạng file DOCX/PDF
- **Hiện trạng:**
  - Tại `frontend/src/pages/StudentSubmissionResult.tsx`:
    ```typescript
    submissionService
      .getDocumentFileBlob(selectedModuleId)
      .then((blob) => blob.text())
      .then((text) => {
        if (isMounted && text && text.trim()) {
          setLoadedDocText(text);
        }
      })
    ```
  - Khi học viên nộp bài luận Writing bằng file `.docx` hoặc `.pdf`, hệ thống lưu file vào S3 (`submissions/{subId}/module-{modId}/essay.docx` hoặc `essay.pdf`).
  - Hàm `submissionService.getDocumentFileBlob()` tải về `Blob` nhị phân của file gốc.
  - Sau đó code frontend gọi `blob.text()` vô điều kiện đối với mọi loại file.
  - File `.docx` thực chất là một kho lưu trữ nén dạng ZIP chứa các file XML (`[Content_Types].xml`, `word/document.xml`, ...), còn file `.pdf` là chuỗi byte mã hóa PDF.
  - Khi ép kiểu byte nhị phân thành UTF-8 text bằng `blob.text()`, toàn bộ header nén và byte rác bị đổ thẳng ra giao diện màn hình:
    ```text
    PK[99;5u[100;5u[116;5u[102;5u[127;5u!ߤlZ[97;5u [101;5u[115;5u[127;5u[98;5u[Content_Types].xml [100;5u[98;5u([98;5un0[112;5uE[111;5uUb袪*[98;5u>-R[103;5u[120;5u{[98;5uVǼ[115;5u[98;5uQU[97;5u...
    ```
  - Điều này làm giao diện bài làm của học viên hoàn toàn bị vỡ nát, không thể đọc được nội dung bài nộp và khiến các ghi chú AI (annotations) không thể ánh xạ vị trí highlight tương ứng.
- **Yêu cầu giải pháp:**
  - Tuyệt đối không gọi `blob.text()` trực tiếp trên các tệp nhị phân (`.docx`, `.pdf`, `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`).
  - Xây dựng module/tiện ích trích xuất văn bản tài liệu `extractDocumentText(blob, filename)`:
    - Nếu file là văn bản thuần `.txt`: đọc qua `blob.text()`.
    - Nếu file là `.docx`: trích xuất các đoạn văn bản (paragraphs / text runs) từ cấu trúc XML (`word/document.xml`).
    - Nếu file là `.pdf`: trích xuất các chuỗi text từ các trang PDF.
    - Nếu tệp không trích xuất được hoặc bị lỗi: hiển thị thẻ tài liệu đính kèm (Document Card) sạch đẹp gồm icon file, tên file, dung lượng và nút tải xuống file gốc (`Tải tệp bài làm`), không bao giờ để rò rỉ mã nhị phân `PK...` ra canvas.
  - Kiểm tra và đồng bộ logic hiển thị này trên cả `TeacherSubmissionDetails.tsx` khi giáo viên chấm bài.

### 1.2. Vấn đề 2: Loại bỏ mục "Phân tích học tập" khỏi phần người dùng học viên
- **Hiện trạng:**
  - Thanh điều hướng bên (Sidebar) của học viên có mục "Phân tích học tập" dẫn đến đường dẫn `/student/analytics`.
  - Phân hệ này hiện tại không còn nằm trong phạm vi nghiệp vụ người dùng học viên và cần được tinh gọn theo yêu cầu sản phẩm.
- **Yêu cầu giải pháp:**
  - Xóa bỏ mục `{ path: '/student/analytics', label: language === 'vi' ? 'Phân tích học tập' : 'Analytics', icon: BarChart3 }` khỏi `frontend/src/components/layout/Sidebar.tsx`.
  - Gỡ bỏ hoặc điều hướng an toàn route `/student/analytics` trong `frontend/src/App.tsx` (chuyển hướng về `/student/dashboard` nếu người dùng truy cập trực tiếp bằng URL).
  - Cập nhật tiêu đề trang `frontend/src/utils/pageTitle.ts` và test case `frontend/src/api/__tests__/pageTitle.test.ts`.

---

## 2. QUY CHUẨN KỸ THUẬT VÀ KIẾN TRÚC FRONTEND

### 2.1. Module Trích Xuất Văn Bản Tài Liệu (`documentTextExtractor.ts`)
Tạo tiện ích `frontend/src/utils/documentTextExtractor.ts`:
```typescript
export interface DocumentExtractionResult {
  text: string;
  isExtracted: boolean;
  fileName?: string;
  fileType: 'txt' | 'docx' | 'pdf' | 'other';
}

export async function extractDocumentText(
  blob: Blob,
  fileName?: string,
  mimeType?: string
): Promise<DocumentExtractionResult>
```
1. **Đối với `.txt` / `text/plain`**:
   - Sử dụng `await blob.text()`.
2. **Đối với `.docx` / `application/vnd.openxmlformats-officedocument.wordprocessingml.document`**:
   - Nhận diện qua đuôi `.docx` hoặc MIME type Word.
   - Giải nén cấu trúc zip để đọc `word/document.xml`, lọc các thẻ `<w:t>` theo từng đoạn `<w:p>`.
   - Ghép thành các đoạn văn bản cách nhau bằng dấu xuống dòng `\n\n`.
3. **Đối với `.pdf` / `application/pdf`**:
   - Nhận diện qua đuôi `.pdf` hoặc MIME type `application/pdf`.
   - Trích xuất text thuần hoặc bóc tách các text stream có cấu trúc.
4. **Cơ chế an toàn (Safe Fallback Guard)**:
   - Nếu dữ liệu bắt đầu bằng các byte ma thuật nén `PK\x03\x04` hoặc `%PDF-` mà chưa thể trích xuất văn bản hợp lệ, trả về `isExtracted: false` và `text: ''`.
   - Cấm triệt để việc đẩy chuỗi thô nhị phân vào biến state hiển thị.

### 2.2. Hiển Thị Tại `StudentSubmissionResult.tsx`
1. Thay thế logic đọc trực tiếp tại `useEffect`:
   ```typescript
   const docAnswer = moduleDetail?.answers?.find(a => !!a.docStorageKey);
   const docFileName = docAnswer?.docStorageKey?.split('/').pop() || 'essay';
   
   const extraction = await extractDocumentText(blob, docFileName, docAnswer?.docMimeType);
   if (extraction.isExtracted && extraction.text.trim()) {
     setLoadedDocText(extraction.text);
   } else {
     setLoadedDocText(null); // Kích hoạt hiển thị Document Fallback Card
   }
   ```
2. Giao diện khi không có text trích xuất:
   - Hiển thị khối `result-doc-card` với icon định dạng tương ứng (Word / PDF).
   - Hiển thị tên file và nút bấm tải xuống file bài làm thông qua Presigned Download URL.

### 2.3. Loại Bỏ Mục "Phân Tích Học Tập"
1. `Sidebar.tsx`: Xóa phần tử menu `/student/analytics`.
2. `App.tsx`: Xóa `<Route path="analytics" element={<StudentAnalytics />} />` hoặc thay thế bằng `<Route path="analytics" element={<Navigate to="/student/dashboard" replace />} />`.
3. `pageTitle.ts`: Cập nhật regex và danh sách route.

---

## 3. CHECKLIST KIỂM THỬ VÀ ĐẢM BẢO CHẤT LƯỢNG (QA CHECKLIST)
- [ ] Upload file `.docx` trong bài Writing -> Nộp bài -> Vào trang kết quả: Nội dung hiển thị là các đoạn văn bản rõ ràng, không có ký tự `PK...`.
- [ ] Upload file `.pdf` trong bài Writing -> Nộp bài -> Vào trang kết quả: Nội dung hiển thị văn bản chuẩn hoặc Document Card sang trọng.
- [ ] Nhập text trực tiếp vào editor (được nộp dưới dạng `essay.txt`) -> Nội dung bài nộp hiển thị chuẩn xác 100%.
- [ ] Đăng nhập tài khoản học viên: Sidebar không còn mục "Phân tích học tập".
- [ ] Truy cập đường dẫn trực tiếp `/student/analytics`: Chuyển hướng an toàn về Dashboard, không gặp màn hình trắng hay lỗi 404.
