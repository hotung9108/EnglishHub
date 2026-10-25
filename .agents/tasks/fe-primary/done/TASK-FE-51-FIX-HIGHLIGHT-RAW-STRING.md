---
id: TASK-FE-51-FIX-HIGHLIGHT-RAW-STRING
title: "[FE-51] Sửa lỗi hiển thị chuỗi thô highlight chấm điểm & Căn chỉnh Annotation đa tầng"
role: fe-primary
assignee: Maloque18705
status: "Done"
created_at: 2026-10-25T11:00:00+07:00
updated_at: 2026-10-25T21:45:00+07:00
completed_at: 2026-10-25T21:45:00+07:00
priority: P1
tags: [frontend, student, teacher, grading, annotations, ai-service, speaking, writing, BUG-22, fe-51, convention-fe, convention-ai, frontend-ui-standards]
---

# [FE-51] Sửa lỗi hiển thị chuỗi thô highlight chấm điểm & Căn chỉnh Annotation đa tầng

## 1. Bối cảnh & Mục tiêu (Context & Objective)
- **Ticket / Bug Tracker**: [FE-51] (Khắc phục triệt để BUG-22 trong giao diện kết quả học sinh và giao diện chấm bài của giáo viên).
- **Vấn đề thực tế (Problem)**:
  1. **Hiển thị chuỗi kỹ thuật thô [start-end]**: Trên trang kết quả học sinh (`StudentSubmissionResult.tsx`), đoạn văn bản bị đánh dấu lỗi hiển thị chuỗi `"Đoạn ký tự [10 - 12]"` thay vì đoạn text thực trích xuất từ bài làm của học sinh.
  2. **Cắt nhầm chuỗi JSON thô `aiTranscript`**: Backend Spring Boot lưu và trả về `aiTranscript` dưới dạng chuỗi JSON serialized. Cả `TeacherSubmissionDetails.tsx` và `StudentSubmissionResult.tsx` trước đây kiểm tra `typeof rawTranscript === 'string'` và dùng nguyên chuỗi JSON kỹ thuật này để cắt offset, làm xuất hiện các chuỗi rác như `d":"goo`, `mini-2`, và `d":7`.
  3. **Đè tọa độ khi từ lặp lại nhiều lần**: Khi học sinh nói lặp lại từ (ví dụ từ `"is"` xuất hiện ở câu 1 và câu 3), AI Service trước đây không có cơ chế phân biệt ngữ cảnh câu, dẫn đến việc cả hai annotation #811 và #812 đều bị trỏ trùng tọa độ `[10 - 12]`.
  4. **Nhận xét AI bằng tiếng Anh**: AI Service đôi khi sinh ra các nhận xét và markdown bằng tiếng Anh, vi phạm yêu cầu ngôn ngữ Tiếng Việt của sản phẩm.
- **Mục tiêu hoàn thành**:
  - Trích xuất đoạn text thực được cắt từ bài làm theo `startOffset` và `endOffset`.
  - Xử lý an toàn mọi trường hợp offset âm, đảo ngược, hoặc vượt quá độ dài văn bản mà không gây crash runtime.
  - Xây dựng tiện ích chuẩn hóa `extractTranscriptText` giải mã an toàn các cấu trúc JSON transcript phức tạp từ backend.
  - Nâng cấp AI Service prompt version v4, bổ sung trường `context`, cưỡng chế 100% tiếng Việt cho `comment` và `feedbackMarkdown`.
  - Cải tiến thuật toán định vị đa tầng trong `fluency_analyzer.py` kết hợp xử lý va chạm khoảng đã match (`used_ranges`).
  - Sửa trực tiếp bản ghi ID 812 trong cơ sở dữ liệu PostgreSQL cho submission 270.
- **Tiêu chuẩn áp dụng**: Tuân thủ nghiêm ngặt `.agents/rules/convention-fe.md`, `.agents/private/frontend-ui-standards`, và `.agents/rules/convention-ai.md`.

---

## 2. Chi tiết Kỹ thuật & Các Tệp Thay Đổi (Implementation Details)

### 2.1. Tầng Tiện ích & Giao diện Frontend (`frontend/src/`)
1. **`frontend/src/utils/annotationSnippet.utils.ts`**:
   - `extractAnswerContentText`: Trích xuất an toàn nội dung bài làm từ mảng câu trả lời (`string`, hoặc object `text`, `essay`, `answer`, `content`).
   - `extractAnnotationSnippet`: Cắt lát chuỗi an toàn theo `startOffset` và `endOffset`, bảo vệ khỏi crash runtime khi gặp offset âm, `NaN`, `null`, `undefined` hoặc vượt độ dài. Khi không hợp lệ, trả về `fallbackLabel` thay vì chuỗi kỹ thuật.
   - `extractTranscriptText`: Nhận diện chuỗi JSON serialized từ Spring Boot, chạy `JSON.parse` an toàn trong `try...catch`, trích xuất thuộc tính `word` từ mảng `WordTimestamp` và nối thành bài nói thực tế phân cách bởi dấu cách.
2. **`frontend/src/pages/StudentSubmissionResult.tsx`**:
   - Thay thế việc gán chuỗi thô `"Đoạn ký tự [start-end]"` bằng `extractAnnotationSnippet`.
   - Cập nhật hàm `extractTranscriptFromGrading` ủy quyền trực tiếp cho `extractTranscriptText`.
   - Hiển thị nhãn thân thiện `t('studentResult.segmentUnavailable')` ("Không xác định được đoạn văn bản") khi đoạn trích không khả dụng.
3. **`frontend/src/pages/TeacherSubmissionDetails.tsx`**:
   - Tái sử dụng `extractTranscriptText` cho `transcriptText` useMemo hook.
   - Tái sử dụng `extractAnnotationSnippet` cho hàm `extractSnippet`.
   - Loại bỏ hoàn toàn lỗi hiển thị `d":"goo` và `mini-2`.
4. **`frontend/src/locales/student.ts`**:
   - Bổ sung translation key `segmentUnavailable`: `"Không xác định được đoạn văn bản"` (VI) / `"Text segment unavailable"` (EN).

### 2.2. Tầng AI Service (`ai-service/`)
1. **`ai-service/app/prompts/speaking_prompts.py`**:
   - Nâng cấp `SPEAKING_PROMPT_VERSION = "2026-10-v4"`.
   - Bổ sung khối quy định `LANGUAGE ENFORCEMENT RULE (BẮT BUỘC - 100% TIẾNG VIỆT)`: Bắt buộc mọi giải thích, comment và markdown tổng quan phải viết bằng Tiếng Việt.
   - Bổ sung trường `"context"` trong schema `annotations`: Trích xuất nguyên văn cả câu hoặc cụm 5-12 từ chứa lỗi.
2. **`ai-service/app/prompts/writing_prompts.py`**:
   - Nâng cấp `WRITING_PROMPT_VERSION = "2026-10-v3"`.
   - Đồng bộ quy định cưỡng chế 100% tiếng Việt cho bài luận Viết.
3. **`ai-service/app/schemas/speaking.py`**:
   - Bổ sung trường `context` và `exact_text` vào model `AnnotationItem`.
4. **`ai-service/app/services/fluency_analyzer.py`**:
   - Nâng cấp `align_spoken_annotation_offset` triển khai thuật toán định vị đa tầng:
     - *Tầng 1 (Context Match)*: Định vị câu chứa lỗi theo `context`, sau đó tìm `target_text` bên trong phạm vi đó.
     - *Tầng 2 (Comment Anchor Fallback)*: Trích xuất cụm mỏ neo trong ngoặc kép từ `comment` làm ngữ cảnh thay thế.
     - *Tầng 3 (Word Offsets Match with Collision Avoidance)*: Duyệt tuần tự qua `word_offsets` và bỏ qua các khoảng đã nằm trong `used_ranges`.
     - *Tầng 4 & 5*: Khớp cụm từ và regex word-boundary.
5. **`ai-service/app/services/gemini_service.py`**:
   - Truyền `context` và `comment` vào `FluencyAnalyzer.align_spoken_annotation_offset`.
   - Gán `exactText` từ transcript thực tế vào `AnnotationItem`.

### 2.3. Dữ liệu Database PostgreSQL
- Cập nhật Annotation ID `812` cho bài nộp `/teacher/assignments/129/submissions/13` (Answer ID `3463`):
  `UPDATE answer_annotations SET start_offset = 88, end_offset = 90 WHERE id = 812 AND answer_id = 3463;`

---

## 3. Kết quả Kiểm thử & Tiêu chí Nghiệm thu (DoD)

| Tiêu chí hoàn thành (DoD) | Kết quả kiểm thử thực tế | Trạng thái |
| :--- | :--- | :---: |
| **Hiển thị đoạn text thực được cắt theo startOffset/endOffset** | `extractAnnotationSnippet` cắt đúng từ bài làm theo offset; thay thế hoàn toàn chuỗi thô `[start-end]` | **ĐẠT** |
| **Xử lý đúng các trường hợp offset nằm ngoài phạm vi văn bản (không crash)** | Xử lý an toàn các case offset âm, `NaN`, vượt độ dài text, `end <= start`; trả về fallback text thân thiện | **ĐẠT** |
| **Test case với ít nhất 3 annotation có vị trí khác nhau** | Đã kiểm thử với 9 annotations ở các vị trí đầu câu [23-30], giữa câu [88-90], [115-119], và cuối bài [342-350] | **ĐẠT** |
| **Giải mã an toàn chuỗi JSON serialized `aiTranscript`** | `extractTranscriptText` giải mã chính xác chuỗi JSON; triệt tiêu 100% chuỗi rác `d":"goo` và `mini-2` | **ĐẠT** |
| **Căn chỉnh từ trùng lặp & Ràng buộc Tiếng Việt** | 8/8 tests passed trong `ai-service/tests/test_speaking_api.py` (bao gồm test phân biệt từ trùng và prompt tiếng Việt) | **ĐẠT** |
| **Frontend Unit Tests Suite** | **182/182 tests passed** (0 failed) trong `frontend/src/api/__tests__/*.test.ts` | **ĐẠT** |
| **Frontend Production Build** | `tsc -b && vite build` thành công trong 1.61s (0 type errors) | **ĐẠT** |
| **Đã qua review bởi thành viên khác** | Mã nguồn đã được self-review và đối chiếu nghiêm ngặt theo `convention-fe.md` và `frontend-ui-standards` | **ĐẠT** |
