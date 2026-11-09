# FE-78: Sửa Chi Tiết Trang Xem Bài Nộp Học Viên Trong Giáo Viên - Đọc Nội Dung Writing Từ answers[0].content và Transcript Speaking Từ API Response

> **Mã tính năng:** `FE-78`  
> **Dự án:** EnglishHub  
> **Người thực hiện:** Phạm Minh Tuấn (`@tuanpham21105` / Trello: `@tunnguyn601`)  
> **Người kiểm thử (QA):** Zawn-Tsu  
> **Trello Card:** [https://trello.com/c/KX3GEPKk](https://trello.com/c/KX3GEPKk)  
> **Tài liệu bàn giao:** `production_artifacts/pm_to_dev/FE-78-teacher-submission-docx-and-transcript.md`  
> **Nhánh Git dự kiến:** `fix/FE-78-teacher-submission-docx-and-transcript`  
> **Nhánh đích (Target):** `develop`  

---

## 1. BỐI CẢNH VÀ NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE)

### 1.1. Vấn đề 1: Trang chi tiết bài làm học viên phía giáo viên (`TeacherSubmissionDetails.tsx`) không hiển thị nội dung bài làm Writing nộp bằng file DOCX/PDF
- **Hiện trạng trước đây:**
  - Khi học viên nộp bài luận bằng file Word (`.docx`) hoặc PDF (`.pdf`), trường `content` trong đối tượng câu trả lời của bảng `answers` bị trả về là `null` (chỉ có `docStorageKey`).
  - Trang giáo viên (`TeacherSubmissionDetails.tsx`) không có văn bản để hiển thị lên canvas bài làm, dẫn đến việc chỉ hiển thị một thông báo tệp đính kèm đơn thuần:
    > "Học viên đã nộp bài hoàn chỉnh qua tệp đính kèm ở trên. Hãy bấm 'Xem' hoặc 'Tải xuống' để kiểm tra bài làm."
  - Giáo viên không thể đọc bài luận trực tiếp trên màn hình chấm, không thấy số từ bài viết (word count = 0), và toàn bộ các ghi chú AI (annotations/snippets) không thể ánh xạ lên văn bản bài làm.
- **Cập nhật kiến trúc từ Backend (Dev Tuấn):**
  - Backend đã hoàn tất cập nhật: Sau khi AI Service bóc tách văn bản từ file tài liệu đính kèm, Backend tự động cập nhật chuỗi text thuần túy vào trường `content` của bảng `answers`.
  - Cụ thể, khi Frontend gọi API `GET /api/v1/submission-modules/{id}` (`submissionService.getSubmissionModuleDetail`):
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
- **Yêu cầu giải pháp Frontend:**
  - Frontend **KHÔNG CẦN** tự giải mã hay bóc tách file nhị phân DOCX/PDF ở phía client.
  - Frontend chỉ việc đọc `moduleDetail.answers[0].content` (chuẩn hóa trích xuất chuỗi văn bản nếu là string, object hoặc stringified JSON).
  - Đưa chuỗi văn bản này vào `studentAnswerText` để render trực tiếp lên canvas bài làm học viên, hỗ trợ tự động tính số từ (word count) và làm căn cứ để hiển thị highlight các ghi chú sửa lỗi AI (annotations).

### 1.2. Vấn đề 2: Transcript bài làm Speaking trên trang giáo viên chưa liên kết trực tiếp với dữ liệu API response
- **Hiện trạng:**
  - Tại `TeacherSubmissionDetails.tsx`, transcript được tổng hợp qua:
    ```typescript
    const transcriptText = useMemo(() => {
      const rawTranscript =
        aiSuggestion?.transcript ??
        gradingDetail?.aiTranscript ??
        (gradingSummary as { aiTranscript?: unknown })?.aiTranscript ??
        (moduleDetail?.grading as { aiTranscript?: unknown })?.aiTranscript ??
        (activeModule?.grading as { aiTranscript?: unknown })?.aiTranscript;
      const text = extractTranscriptText(rawTranscript);
      return text.length > 0 ? text : null;
    }, [aiSuggestion, gradingDetail, gradingSummary, moduleDetail, activeModule]);
    ```
  - Trong cấu trúc response thực tế của backend:
    - `moduleDetail.grading` (`GradingDetailResponse`) chứa trường `aiTranscript` và đối tượng `aiAnalysisDetails` (trong đó có `aiAnalysisDetails.transcript`).
    - Biến `rawTranscript` chưa truy xuất sâu vào `aiAnalysisDetails.transcript` và có thể bị rỗng nếu `aiSuggestion` chưa tải xong hoặc `gradingDetail` chưa kịp nạp.
    - Điều này khiến giao diện hiển thị thông báo "Chưa có bản ghi âm tự động (Bấm 'Chấm bài bằng AI' để trích xuất transcript...)" mặc dù backend đã hoàn tất phân tích transcript từ trước.
- **Yêu cầu giải pháp:**
  - Bổ sung kiểm tra toàn diện các trường transcript trong API response:
    - `aiSuggestion?.transcript`
    - `gradingDetail?.aiTranscript`
    - `(gradingDetail?.aiAnalysisDetails as Record<string, unknown>)?.transcript`
    - `(moduleDetail?.grading as Record<string, unknown>)?.aiTranscript`
    - `((moduleDetail?.grading as Record<string, unknown>)?.aiAnalysisDetails as Record<string, unknown>)?.transcript`
    - `(activeModule?.grading as Record<string, unknown>)?.aiTranscript`
  - Đảm bảo hiển thị ngay lập tức văn bản lời nói (AI Transcript) của học viên khi giáo viên mở bài nộp Speaking, không bắt buộc giáo viên phải bấm chấm lại.

---

## 2. QUY CHUẨN KỸ THUẬT VÀ PHƯƠNG ÁN THỰC THI

### 2.1. Đọc và chuẩn hóa nội dung bài làm Writing (`TeacherSubmissionDetails.tsx`)
```typescript
const studentAnswerText = useMemo(() => {
  if (!moduleDetail?.answers || moduleDetail.answers.length === 0) {
    return loadedDocText || '';
  }

  const firstAnswer = moduleDetail.answers[0];
  if (firstAnswer.content === null || firstAnswer.content === undefined) {
    return loadedDocText || '';
  }

  // 1. Trường hợp content là chuỗi string thuần (Backend đã bóc tách từ file DOCX/PDF)
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

  // 2. Trường hợp content là đối tượng JSON object
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

### 2.2. Chuẩn hóa trích xuất Transcript từ API Response
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

---

## 3. CHECKLIST KIỂM THỬ VÀ ĐẢM BẢO CHẤT LƯỢNG (QA CHECKLIST)
- [ ] Giáo viên mở bài nộp Writing của học viên nộp bằng file `.docx`: Nội dung văn bản được nạp từ `moduleDetail.answers[0].content` và hiển thị đầy đủ trên canvas bài làm.
- [ ] Số lượng từ (Word Count) của bài luận được tính toán chính xác từ chuỗi văn bản trong `answers[0].content`.
- [ ] Các gợi ý sửa lỗi AI annotations được gắn và highlight đúng vị trí các đoạn văn bản.
- [ ] Giáo viên mở bài nộp Speaking đã có kết quả chấm: Khối AI Transcript hiển thị bản ghi lời nói của học viên ngay lập tức từ dữ liệu response mà không cần bấm "Chấm bài bằng AI" lại.
- [ ] Toàn bộ unit tests frontend (`npm test` và `npm run test:ui`) pass 100%.
- [ ] Project Doctor (`npm run build`) biên dịch 0 lỗi TypeScript/ESLint.
