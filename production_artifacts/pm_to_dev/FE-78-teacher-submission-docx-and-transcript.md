# SPECIFICATION HANDOFF: [FE-78] Sửa Chi Tiết Trang Xem Bài Nộp Học Viên Trong Giáo Viên - Đọc Nội Dung Writing Từ answers[0].content và Transcript Speaking Từ API Response

> **Mã nhiệm vụ:** `[FE-78]`  
> **Trello Card:** [https://trello.com/c/KX3GEPKk](https://trello.com/c/KX3GEPKk)  
> **Cột trạng thái:** `Sprint Backlog`  
> **Người thực hiện:** Phạm Minh Tuấn (`@tuanpham21105` / Trello: `@tunnguyn601`)  
> **Người kiểm thử (QA):** Zawn-Tsu  
> **Vai trò:** Developer & PM  
> **Nhánh Git:** `fix/FE-78-teacher-submission-docx-and-transcript`  
> **Target Branch:** `develop`  
> **Tài liệu đặc tả:** [`docs/features/FE-78-teacher-submission-docx-and-transcript.md`](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/docs/features/FE-78-teacher-submission-docx-and-transcript.md)  

---

## 1. MÔ TẢ VẤN ĐỀ VÀ CẬP NHẬT KIẾN TRÚC TỪ BACKEND

### 1.1. Nội dung văn bản bài làm Writing trên trang chi tiết giáo viên (`TeacherSubmissionDetails.tsx`)
- **Cập nhật kỹ thuật từ Backend**:
  - Khi học viên nộp bài luận bằng file `.docx` hoặc `.pdf`, sau khi AI Service hoàn tất bóc tách văn bản, Backend sẽ tự động cập nhật chuỗi text thuần túy vào trường `content` của bảng `answers`.
  - Cụ thể khi Frontend gọi API `GET /api/v1/submission-modules/{id}` (`submissionService.getSubmissionModuleDetail`):
    ```json
    {
      "id": 102,
      "moduleId": 55,
      "skill": "WRITING",
      "status": "GRADED",
      "answers": [
        {
          "id": 88,
          "questionId": null,
          "content": "Nowadays, many educators argue that unpaid community service should be compulsory in high school. In my opinion, I completely agree with this viewpoint...",
          "docStorageKey": "submissions/88/module-102/essay.docx",
          "docMimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "docUploadStatus": "READY"
        }
      ]
    }
    ```
- **Nhiệm vụ của Developer (Phạm Minh Tuấn)**:
  - Frontend **KHÔNG CẦN** tự giải mã hay bóc tách file DOCX/PDF ở client.
  - Đọc `moduleDetail.answers[0].content` (chuẩn hóa trích xuất nếu là string hoặc object).
  - Nạp chuỗi text này vào `studentAnswerText` trong `TeacherSubmissionDetails.tsx` để render trực tiếp lên canvas bài làm học viên, hỗ trợ tự động tính số từ (word count) và làm căn cứ hiển thị highlight các ghi chú AI (annotations).

### 1.2. Hiển thị Transcript bài làm Speaking từ API response
- Trên giao diện giáo viên, phần hiển thị bản ghi lời nói (AI Transcript) phải đọc và hiển thị ngay lập tức từ dữ liệu response (`moduleDetail.grading.aiTranscript`, `gradingDetail.aiTranscript`, `aiAnalysisDetails.transcript`, `aiSuggestion.transcript`).
- Tránh trường hợp giao diện hiển thị rỗng hoặc bắt giáo viên phải bấm "Chấm bài bằng AI" lại.

---

## 2. QUY TRÌNH THỰC HIỆN TỪNG BƯỚC CHO DEVELOPER (PHẠM MINH TUẤN)

### Bước 1: Tạo nhánh Git làm việc
```bash
git checkout develop
git pull origin develop
git checkout -b fix/FE-78-teacher-submission-docx-and-transcript
```

### Bước 2: Cập Nhật `studentAnswerText` Trong `TeacherSubmissionDetails.tsx`
Chuẩn hóa logic đọc `firstAnswer.content`:
```typescript
const studentAnswerText = useMemo(() => {
  if (!moduleDetail?.answers || moduleDetail.answers.length === 0) {
    return loadedDocText || '';
  }

  const firstAnswer = moduleDetail.answers[0];
  if (firstAnswer.content === null || firstAnswer.content === undefined) {
    return loadedDocText || '';
  }

  // 1. Nếu content là string
  if (typeof firstAnswer.content === 'string') {
    const trimmed = firstAnswer.content.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        const innerText = parsed.text ?? parsed.essay ?? parsed.answer ?? parsed.content;
        if (typeof innerText === 'string') return innerText.trim();
      } catch {
        // Fall back to trimmed string
      }
    }
    return trimmed || loadedDocText || '';
  }

  // 2. Nếu content là JSON object
  if (typeof firstAnswer.content === 'object') {
    const obj = firstAnswer.content as Record<string, unknown>;
    const textVal = obj.text ?? obj.essay ?? obj.answer ?? obj.content;
    if (typeof textVal === 'string') {
      const trimmed = textVal.trim();
      return trimmed || loadedDocText || '';
    }
    return JSON.stringify(obj);
  }

  return String(firstAnswer.content ?? '').trim() || loadedDocText || '';
}, [moduleDetail, loadedDocText]);
```

### Bước 3: Cập Nhật Resolve Transcript Trong `TeacherSubmissionDetails.tsx`
Mở rộng `rawTranscript` trong `transcriptText` (khoảng dòng 985-995):
```typescript
const transcriptText = useMemo(() => {
  const gDetail = gradingDetail as Record<string, unknown> | null;
  const modGrading = moduleDetail?.grading as Record<string, unknown> | null;
  const actGrading = activeModule?.grading as Record<string, unknown> | null;
  const gSummary = gradingSummary as Record<string, unknown> | null;

  const rawTranscript =
    aiSuggestion?.transcript ??
    gDetail?.aiTranscript ??
    (gDetail?.aiAnalysisDetails as Record<string, unknown>)?.transcript ??
    modGrading?.aiTranscript ??
    (modGrading?.aiAnalysisDetails as Record<string, unknown>)?.transcript ??
    actGrading?.aiTranscript ??
    (actGrading?.aiAnalysisDetails as Record<string, unknown>)?.transcript ??
    gSummary?.aiTranscript;

  const text = extractTranscriptText(rawTranscript);
  return text.length > 0 ? text : null;
}, [aiSuggestion, gradingDetail, gradingSummary, moduleDetail, activeModule]);
```

### Bước 4: Kiểm Thử Đơn Vị & Quality Gate
1. Bổ sung unit tests trong `frontend/src/__tests__/components/TeacherSubmissionDetails.test.tsx`:
   - Mock response `moduleDetail.answers[0].content` là chuỗi văn bản thuần túy (được bóc tách từ file DOCX). Đảm bảo canvas hiển thị đúng nội dung và word count.
   - Mock response có `aiTranscript` / `aiAnalysisDetails.transcript`. Đảm bảo khối AI Transcript hiển thị văn bản lời nói của học viên ngay khi mở trang.
2. Chạy test suite và build:
   ```bash
   npm test
   npm run test:ui
   npm run build
   ```
3. Mở PR vào `develop` và gắn link thẻ Trello `FE-78`.

---

## 3. TIÊU CHÍ NGHIỆM THU (DEFINITION OF DONE)
- [ ] Giao diện chấm bài Writing của giáo viên hiển thị đầy đủ nội dung bài luận từ trường `moduleDetail.answers[0].content`.
- [ ] Số lượng từ bài viết hiển thị chính xác theo nội dung văn bản trong `answers[0].content`.
- [ ] Các gợi ý sửa lỗi AI (annotations) hiển thị và highlight chuẩn xác theo vị trí văn bản bài nộp.
- [ ] Transcript bài thi Nói (Speaking) hiển thị đầy đủ ngay từ dữ liệu API response khi mở trang chấm bài.
- [ ] Toàn bộ unit tests frontend (`npm test` và `npm run test:ui`) pass 100%.
- [ ] Project Doctor (`npm run build`) biên dịch 0 lỗi.
- [ ] Mở PR `fix/FE-78-...` vào `develop` và chuyển card sang `Review`.
