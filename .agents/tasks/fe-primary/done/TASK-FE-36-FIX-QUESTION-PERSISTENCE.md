---
id: TASK-FE-36-FIX-QUESTION-PERSISTENCE
title: "Fix Missing Questions on Reading and Listening Assignment Create/Edit (P0)"
role: fe-primary
assignee: Maloque18705
status: "Done"
created_at: 2026-10-11T22:35:00+07:00
updated_at: 2026-10-12T00:41:00+07:00
priority: P0
tags: [frontend, questions, teacher-create-assignment, teacher-edit-assignment, question-service, module-service, assignment-routing, student-submission-result, fe-36]
---

# TASK-FE-36: Fix Missing Questions on Reading and Listening Assignment Create/Edit (P0)

## 1. Context & Objective
Khắc phục lỗi mất trắng câu hỏi trắc nghiệm khi giáo viên tạo hoặc sửa bài tập Reading & Listening (chặn toàn bộ luồng thi trắc nghiệm học sinh), sửa toàn bộ lỗi điều hướng bài tập, sửa lỗi nộp bài và xem kết quả submission học sinh, và giải quyết lỗi 400 không cho phép sửa đáp án đúng của bài tập đã công khai.

- **Scope**: 
  - `TeacherCreateAssignment.tsx`, `TeacherEditAssignment.tsx`, `TeacherAssignmentDetails.tsx`, `TeacherAssignments.tsx`
  - `StudentAssignments.tsx`, `StudentAssignmentOverview.tsx`, `StudentAssignmentReading.tsx`, `StudentAssignmentListening.tsx`, `StudentSubmissionResult.tsx`
  - `question.service.ts`, `module.service.ts`
- **Root Causes**:
  1. `executeCreateAssignment` và `saveAssignmentChanges` không gọi `questionService`, khiến câu hỏi trong React state bị vứt bỏ, module tạo ra có 0 câu hỏi.
  2. Điều hướng bài tập học sinh suy luận kỹ năng bằng `title.toLowerCase()` gây nhầm lẫn (ví dụ bài "Kiểm tra Unit 1" bị coi là `General Task` và nhảy vào màn hình làm bài tự luận Writing `StudentAssignmentWriting`).
  3. `listQuestions` và `listModules` trả về `{ data: [...] }` từ Backend khiến giao diện kiểm tra `qRes.questions` hoặc `modRes.modules` bị undefined và gán mảng rỗng `[]`, dẫn đến ẩn toàn bộ khối câu hỏi và đề bài trong `TeacherAssignmentDetails.tsx`.
  4. Trong `StudentAssignmentReading.tsx` và `StudentAssignmentListening.tsx`, hàm `handleSubmit` gửi `questionId: Number(qId)` (với `qId` là index 1..N trên UI thay vì `q.id` trong DB) và `content: { selectedOptionIds: ['A'] }` (chuỗi ký tự thay vì số nguyên dương `@Positive Long 1..4`). Khối `catch {}` rỗng nuốt chửng lỗi validation, khiến bài nộp không lưu được đáp án và không được tự động chấm điểm.
  5. Trong `StudentSubmissionResult.tsx`, trường `q.correctAnswer` bị ép kiểu `String()` thành `"[object Object]"`, nội dung câu trả lời của học sinh đọc sai thuộc tính thành `"--"`, so sánh đúng/sai bị lỗi, và các lựa chọn phương án bị hardcode thành `"Phương án A"`.
  6. Trong `TeacherEditAssignment.tsx`, khi giáo viên chỉnh sửa bài tập đã ở trạng thái `PUBLISHED` (ví dụ đổi phương án đúng của câu hỏi), hàm `saveAssignmentChanges` luôn gọi `updateAssignmentStatus(id, 'PUBLISHED')`. Backend kiểm tra `canTransitionTo('PUBLISHED')` trả về false (vì chỉ cho phép `DRAFT -> PUBLISHED` hoặc `PUBLISHED -> CLOSED`), ném ngoại lệ `400 BAD_REQUEST: Không thể chuyển sang trạng thái này.`, làm gián đoạn luồng thực thi trước khi gọi API cập nhật câu hỏi `updateQuestion`.

- **Output**: 
  - Câu hỏi lưu đầy đủ xuống DB khi tạo/sửa bài Reading & Listening.
  - Điều hướng bài tập học sinh chuẩn xác theo module skill thực tế từ Backend.
  - Giáo viên xem trước đầy đủ danh sách câu hỏi, đề bài và đáp án đúng trong trang chi tiết bài tập.
  - Học sinh làm bài, nộp bài chuẩn xác với payload hợp lệ; trang kết quả hiển thị rõ phương án đã chọn, đáp án chuẩn, nhãn `ĐÚNG`/`SAI` và các thẻ phương án trực quan.
  - Giáo viên chỉnh sửa bài tập đã xuất bản (đổi đáp án đúng, sửa nội dung câu hỏi) mượt mà không gặp lỗi chuyển đổi trạng thái 400.

---

## 2. Definition of Done (DoD) Criteria
- [x] Bổ sung mapper & helper chuẩn hóa câu hỏi (`buildMcqPayload`, `buildShortAnswerPayload`, `extractMcqOptions`, `extractShortAnswerText`) trong `question.service.ts`.
- [x] Lưu câu hỏi tuần tự trong `TeacherCreateAssignment.tsx` khi tạo bài Reading / Listening.
- [x] Tải và đồng bộ (create/update/delete) câu hỏi tuần tự trong `TeacherEditAssignment.tsx`.
- [x] Chuẩn hóa `QuestionService.listQuestions` và `ModuleService.listModules` trả về cả `questions`/`modules` và `data`.
- [x] Sửa điều hướng `StudentAssignments.tsx`, `StudentAssignmentOverview.tsx`, `StudentWorkspace.tsx` lấy đúng skill từ `modules[0].skill`.
- [x] Thêm khu vực xem trước "Danh sách câu hỏi đề bài" và nội dung đề bài trong `TeacherAssignmentDetails.tsx`.
- [x] Tự động xác định đúng kỹ năng trong `TeacherAssignments.tsx` cho bộ lọc và thẻ hiển thị.
- [x] Chuẩn hóa `handleSubmit` trong `StudentAssignmentReading.tsx` và `StudentAssignmentListening.tsx`: map đúng DB `questionId: q.id` và `selectedOptionIds: [1..4]`, không nuốt lỗi ngầm.
- [x] Sửa `StudentSubmissionResult.tsx`: parse chính xác `correctAnswer`, `selectedOptionIds`, nhãn `ĐÚNG`/`SAI`, hiển thị thẻ phương án sinh động và tính toán điểm số chính xác.
- [x] Sửa `TeacherEditAssignment.tsx`: theo dõi `currentDbStatus`, chỉ gọi `updateAssignmentStatus` khi trạng thái thay đổi và hợp lệ theo quy tắc Backend (`DRAFT -> PUBLISHED` hoặc `PUBLISHED -> CLOSED`), khóa nút chuyển về Draft cho bài tập đã công khai và điều chỉnh nhãn nút thành "Lưu thay đổi".
- [x] Đảm bảo cập nhật câu hỏi tuân thủ tính bất biến (`react-hooks/immutability`), không mutate trực tiếp state.
- [x] Viết unit tests cho mapper & CRUD methods trong `question.service.test.ts` và `module.service.test.ts`.
- [x] Kiểm tra chất lượng: `npm test` (**85/85 tests passed**), `npx tsc --noEmit` (0 lỗi), `npm run build` thành công, `npx eslint` pass 100%.
- [x] Cập nhật tài liệu bàn giao tester trong `production_artifacts/fe_to_tester/FE_36_QUESTIONS_PERSISTENCE_TEST_GUIDE.md`.
