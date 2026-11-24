# SPECIFICATION HANDOFF: [FE-77] Trích Xuất Văn Bản File DOCX/PDF Bài Viết Writing & Loại Bỏ Mục Phân Tích Học Tập Của Học Viên

> **Mã nhiệm vụ:** `[FE-77]`  
> **Trello Card:** [https://trello.com/c/0pYdQX0q](https://trello.com/c/0pYdQX0q)  
> **Người thực hiện:** Tiến Sơn Trần (`@Maloque18705` / Trello: `@tinsntrn`) & Hồ Việt Tùng (`@hotung9108` / Trello: `@hvittung`)  
> **Vai trò:** Frontend Developer Lead & PM  
> **Nhánh Git:** `fix/FE-77-student-writing-doc-text-and-remove-analytics`  
> **Target Branch:** `develop`  
> **Tài liệu đặc tả:** [`docs/features/FE-77-student-writing-doc-text-extraction-and-remove-analytics.md`](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/docs/features/FE-77-student-writing-doc-text-extraction-and-remove-analytics.md)  

---

## 1. MÔ TẢ VẤN ĐỀ VÀ PHÂN TÍCH HIỆN TRẠNG

### 1.1. Lỗi 1: Tràn mã nhị phân khi hiển thị bài làm Writing nộp bằng file DOCX/PDF
- **Hiện tượng:** Khi học viên nộp bài Writing bằng file Word (`.docx`) hoặc PDF (`.pdf`), trang xem kết quả làm bài (`StudentSubmissionResult.tsx`) tải file blob từ S3 và gọi hàm `blob.text()`.
- **Nguyên nhân:** File `.docx` là tệp nén ZIP chứa các cấu trúc file XML (`[Content_Types].xml`, `word/document.xml`, ...), còn file `.pdf` là chuỗi byte nhị phân. Khi gọi `blob.text()`, dữ liệu nhị phân bị giải mã thành chuỗi văn bản UTF-8 rác:
  ```text
  PK[99;5u[100;5u[116;5u[102;5u[127;5u!ߤlZ[97;5u [101;5u[115;5u[127;5u[98;5u[Content_Types].xml [100;5u[98;5u([98;5un0[112;5uE[111;5uUb袪*[98;5u>-R[103;5u[120;5u{[98;5uVǼ[115;5u[98;5uQU[97;5u...
  ```
- **Hậu quả:** Giao diện canvas bài nộp bị vỡ nát, học viên không thể đọc bài mình đã làm và các gợi ý sửa lỗi AI annotations không thể hiển thị khớp vào vị trí đoạn văn.
- **Yêu cầu:** 
  1. Tuyệt đối không gọi `blob.text()` trên các file nhị phân.
  2. Xây dựng module trích xuất văn bản từ file DOCX/PDF. Chỉ lấy nội dung văn bản thuần túy (paragraphs/runs) để hiển thị lên canvas.
  3. Nếu file không thể bóc tách text, hiển thị thẻ đính kèm tài liệu (`attachedDocCard`) kèm nút bấm tải xuống file gốc một cách trực quan, không được để lộ bất kỳ byte nhị phân nào.

### 1.2. Yêu cầu 2: Bỏ mục "Phân tích học tập" trong phần người dùng học viên
- **Yêu cầu:** 
  1. Gỡ bỏ mục menu `{ path: '/student/analytics', label: 'Phân tích học tập' }` khỏi Sidebar của học viên.
  2. Gỡ bỏ hoặc chuyển hướng an toàn route `/student/analytics` trong `App.tsx` (chuyển hướng về `/student/dashboard`).
  3. Dọn dẹp tiêu đề trang trong `pageTitle.ts` và cập nhật unit test `pageTitle.test.ts`.

---

## 2. QUY TRÌNH THỰC HIỆN TỪNG BƯỚC CHO DEVELOPER

### Bước 1: Tạo nhánh Git làm việc
```bash
git checkout develop
git pull origin develop
git checkout -b fix/FE-77-student-writing-doc-text-and-remove-analytics
```

### Bước 2: Tạo Utility Trích Xuất Văn Bản Tài Liệu
Tạo file `frontend/src/utils/documentTextExtractor.ts`:
- Nhận diện định dạng dựa trên đuôi file (`.txt`, `.docx`, `.pdf`) hoặc MIME type.
- Đối với `.txt`: Đọc bằng `blob.text()`.
- Đối với `.docx`: Giải nén và bóc tách các node văn bản XML trong `word/document.xml` hoặc sử dụng bộ parser phù hợp.
- Đối với `.pdf`: Bóc tách chuỗi văn bản trang PDF.
- Thêm bảo vệ (Guard): Nếu chuỗi bắt đầu bằng `PK` hoặc `%PDF`, kiểm tra tính toàn vẹn; nếu không thể trích xuất text đọc được, trả về rỗng và gắn cờ `isExtracted: false`.

### Bước 3: Cập Nhật `StudentSubmissionResult.tsx`
- Thay thế đoạn code nạp file:
  ```typescript
  const docAnswer = moduleDetail?.answers?.find(a => !!a.docStorageKey);
  const docFileName = docAnswer?.docStorageKey?.split('/').pop() || 'essay';
  const extraction = await extractDocumentText(blob, docFileName, docAnswer?.docMimeType);
  
  if (extraction.isExtracted && extraction.text.trim()) {
    setLoadedDocText(extraction.text);
  } else {
    setLoadedDocText(null);
  }
  ```
- Khi `loadedDocText` là `null`, UI sẽ tự động rơi vào fallback hiển thị thẻ tài liệu (`result-doc-card`) với tên file và nút tải xuống file gốc.

### Bước 4: Đồng Bộ Hiển Thị `TeacherSubmissionDetails.tsx`
- Kiểm tra khối hiển thị bài nộp của giáo viên khi học viên nộp file DOCX/PDF, đảm bảo hiển thị đồng bộ văn bản hoặc thẻ tài liệu chuyên nghiệp.

### Bước 5: Loại Bỏ "Phân Tích Học Tập" Khỏi Giao Diện Học Viên
1. Trong `frontend/src/components/layout/Sidebar.tsx`:
   - Xóa dòng `{ path: '/student/analytics', label: language === 'vi' ? 'Phân tích học tập' : 'Analytics', icon: BarChart3 }` khỏi danh sách menu học sinh.
2. Trong `frontend/src/App.tsx`:
   - Thay route `/student/analytics` bằng redirect về `<Navigate to="/student/dashboard" replace />` để tránh lỗi 404 nếu người dùng truy cập link cũ.
3. Trong `frontend/src/utils/pageTitle.ts` & `frontend/src/api/__tests__/pageTitle.test.ts`:
   - Dọn dẹp khớp nối route `/student/analytics`.

### Bước 6: Kiểm Thử & Quality Gate
1. Chạy unit tests:
   ```bash
   npm test
   npm run test:ui
   ```
2. Kiểm tra biên dịch TypeScript và Lint:
   ```bash
   npm run build
   ```
3. Mở Pull Request vào `develop` và gắn nhãn, liên kết Trello card #516.

---

## 3. TIÊU CHÍ NGHIỆM THU (DEFINITION OF DONE)
- [ ] 100% không còn hiện tượng tràn mã nhị phân `PK...` hoặc `%PDF...` trên canvas bài nộp Writing của học sinh.
- [ ] File DOCX và PDF hiển thị được nội dung văn bản thuần túy hoặc hiển thị thẻ tệp bài làm đính kèm tải xuống hợp lệ.
- [ ] Sidebar học viên không còn xuất hiện mục "Phân tích học tập".
- [ ] Route `/student/analytics` được dọn dẹp hoặc chuyển hướng an toàn về Dashboard.
- [ ] Unit tests frontend (`npm test` và `npm run test:ui`) pass 100%.
- [ ] Project Doctor (`npm run build`) biên dịch 0 lỗi.
- [ ] PR được mở vào `develop`, gắn link thẻ Trello `FE-77` và chuyển thẻ sang `Review`.
