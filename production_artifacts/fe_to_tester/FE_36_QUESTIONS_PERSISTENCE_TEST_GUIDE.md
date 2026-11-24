# FE-36 Handoff: Khắc phục lỗi mất trắng câu hỏi khi tạo/sửa Reading & Listening

## 1. Thông tin tổng quan
- **Mã Task**: `FE-36` / `TASK-FE-36-FIX-QUESTION-PERSISTENCE`
- **Mức độ ưu tiên**: `P0` (Blocker cho toàn bộ luồng thi trắc nghiệm học sinh)
- **Assignee**: `@fe-primary` (Maloque18705)
- **Người nhận bàn giao**: `@tester` (Zawn-Tsu)
- **Các file đã sửa**:
  1. `frontend/src/api/services/question.service.ts`
  2. `frontend/src/api/services/module.service.ts`
  3. `frontend/src/pages/TeacherCreateAssignment.tsx`
  4. `frontend/src/pages/TeacherEditAssignment.tsx`
  5. `frontend/src/pages/TeacherAssignmentDetails.tsx`
  6. `frontend/src/pages/TeacherAssignments.tsx`
  7. `frontend/src/pages/StudentAssignments.tsx`
  8. `frontend/src/pages/StudentAssignmentOverview.tsx`
  9. `frontend/src/pages/StudentAssignmentReading.tsx`
  10. `frontend/src/pages/StudentAssignmentListening.tsx`
  11. `frontend/src/pages/StudentSubmissionResult.tsx`
  12. `frontend/src/api/__tests__/question.service.test.ts` (Unit tests)
  13. `frontend/src/api/__tests__/module.service.test.ts` (Unit tests)

---

## 2. Nguyên nhân gốc rễ & Giải pháp đã thực hiện

### 2.1 Nguyên nhân gốc rễ
1. Trước khi sửa, hàm `executeCreateAssignment` và `saveAssignmentChanges` chỉ gọi `assignmentService` và `moduleService`, hoàn toàn không gọi `questionService`. Câu hỏi trong React state bị vứt bỏ, module tạo ra có 0 câu hỏi.
2. Điều hướng bài tập học sinh suy luận kỹ năng bằng `title.toLowerCase()` dẫn đến bài đọc/nghe bị nhảy nhầm sang màn hình viết tự luận `StudentAssignmentWriting`.
3. `listQuestions` và `listModules` trả về `{ data: [...] }` từ Backend khiến giao diện kiểm tra `qRes.questions` hoặc `modRes.modules` bị undefined và gán mảng rỗng `[]`, khiến giáo viên vào xem bài tập không thấy danh sách câu hỏi và đề bài.
4. Khi học sinh nộp bài trắc nghiệm, `handleSubmit` gửi `questionId: Number(qId)` (index 1..N của mảng thay vì DB `q.id`) và `content: { selectedOptionIds: ['A'] }` (chuỗi ký tự thay vì số nguyên dương `@Positive Long 1..4`). Khối `catch {}` rỗng nuốt chửng lỗi validation nên đáp án không được lưu vào DB và không được tự động chấm điểm.
5. Màn hình kết quả `StudentSubmissionResult.tsx` ép kiểu `q.correctAnswer` thành `"[object Object]"`, đọc sai thuộc tính câu trả lời học sinh thành `"--"`, hardcode các lựa chọn thành `"Phương án A"`, và so sánh đúng/sai bị sai lệch.
6. Khi giáo viên sửa bài tập đã ở trạng thái `PUBLISHED` (như đổi đáp án đúng của câu hỏi), hàm lưu luôn gọi `updateAssignmentStatus(id, 'PUBLISHED')`. Backend kiểm tra `canTransitionTo('PUBLISHED')` trả về false (vì chỉ cho phép `DRAFT -> PUBLISHED` hoặc `PUBLISHED -> CLOSED`), ném ngoại lệ `400 BAD_REQUEST: Không thể chuyển sang trạng thái này.`, làm gián đoạn việc gọi API cập nhật câu hỏi `updateQuestion`.

### 2.2 Giải pháp kỹ thuật đã áp dụng
1. **Tuân thủ strict contract Backend & DB**:
   - `MULTIPLE_CHOICE`: Tạo đúng 4 options `{ id: 1..4, content, isCorrect }` với đúng 1 option có `isCorrect: true`.
   - `SHORT_ANSWER`: Tạo payload `{ correctAnswer: { correctAnswer: "..." } }`.
2. **Xử lý tuần tự tránh 409 Lock Contention**:
   - Backend sử dụng `SELECT FOR UPDATE` trên bảng `modules` (`Pessimistic Locking`).
   - Frontend gửi các request tạo/sửa/xóa câu hỏi **tuần tự** bằng vòng lặp `for...of`, không dùng `Promise.all`.
3. **Chuẩn hóa response normalization**:
   - `questionService.listQuestions` và `moduleService.listModules` trả về đồng thời cả `questions`/`modules` và `data`.
4. **Chuẩn hóa payload nộp bài trắc nghiệm**:
   - Map đúng DB `questionId: q.id` và `selectedOptionIds: [1..4]`. Xử lý lỗi minh bạch, không nuốt lỗi ngầm.
5. **Hiển thị kết quả chấm bài trắc nghiệm chi tiết**:
   - Parse chính xác đáp án chuẩn, phương án học sinh chọn, nhãn `ĐÚNG`/`SAI` và các thẻ phương án sinh động với đánh dấu tích `✓ Đáp án đúng` và `✗ Lựa chọn của bạn`.
6. **Kiểm soát chuyển đổi trạng thái hợp lệ**:
   - Lưu `currentDbStatus`, chỉ gọi API `updateAssignmentStatus` khi trạng thái mục tiêu thực sự thay đổi và hợp lệ theo quy tắc backend (`DRAFT -> PUBLISHED` hoặc `PUBLISHED -> CLOSED`).
   - Khóa nút chuyển về bản nháp khi bài tập đã công khai, đổi nhãn nút thành "Lưu thay đổi".
   - Đảm bảo tính bất biến (`react-hooks/immutability`), không mutate trực tiếp React state.

---

## 3. Kịch bản kiểm thử cho QA / Tester

### Kịch bản 1: Tạo mới bài tập Reading có câu hỏi trắc nghiệm
1. Đăng nhập tài khoản Giáo viên (`cao.ngoc.thao@gmail.com` / `Password123!`).
2. Vào màn hình **Tạo bài tập mới** (`/teacher/assignments/create?type=reading`).
3. Chọn lớp học, nhập tiêu đề bài đọc, thêm 2-3 câu hỏi trắc nghiệm (nhập nội dung câu hỏi, 4 lựa chọn, tích chọn đáp án đúng).
4. Bấm **Giao bài ngay** (`PUBLISHED`).
5. **Kiểm tra kết quả**:
   - Network tab: Phải có 1 request `POST /assignments/{classId}`, 1 request `POST /assignments/{id}/modules`, và các request `POST /modules/{moduleId}/questions` tuần tự tương ứng.
   - Database: Bảng `questions` có đầy đủ các bản ghi của `module_id` vừa tạo.

### Kịch bản 2: Học sinh làm bài thi trắc nghiệm (Xác minh luồng P0)
1. Đăng nhập tài khoản Học sinh thuộc lớp được giao bài (`ly.duc.viet@gmail.com` / `Password123!`).
2. Vào danh sách bài tập (`/student/assignments`): Bài tập Reading hiển thị đúng huy hiệu kỹ năng **Reading**.
3. Bấm vào bài tập hoặc nút **Bắt đầu làm bài** -> Điều hướng chuẩn xác vào bài thi trắc nghiệm `/student/assignments/reading/:id`.
4. **Kiểm tra kết quả**:
   - Màn hình hiển thị đầy đủ danh sách câu hỏi trắc nghiệm, các lựa chọn A, B, C, D.
   - Học sinh chọn được đáp án và bấm **Nộp bài** thành công.

### Kịch bản 3: Học sinh xem kết quả bài nộp trắc nghiệm
1. Sau khi nộp bài (hoặc truy cập `/student/submissions/:submissionId`), xem chi tiết kết quả bài nộp.
2. **Kiểm tra kết quả**:
   - Điểm số tự động hiển thị chính xác (ví dụ: `3 / 3` hoặc `3 / 10`).
   - Danh sách câu hỏi hiển thị đầy đủ:
     - Thẻ nhãn trạng thái `ĐÚNG` (màu xanh lá) hoặc `SAI` (màu đỏ).
     - **Câu trả lời của bạn**: hiển thị đúng ký tự và nội dung phương án đã chọn (ví dụ: `A. To monitor real-time resource usage...`).
     - **Đáp án đúng**: hiển thị đúng phương án chuẩn của đề bài.
     - Thẻ 4 phương án A, B, C, D hiển thị trực quan: tích xanh `✓ Đáp án đúng` tại câu chuẩn và dấu `✗ Lựa chọn của bạn` nếu chọn sai.

### Kịch bản 4: Giáo viên xem chi tiết bài tập & bộ câu hỏi
1. Đăng nhập tài khoản Giáo viên, vào danh sách bài tập (`/teacher/assignments`).
2. Bấm vào bài tập vừa tạo -> Điều hướng đến `/teacher/assignments/:id`.
3. **Kiểm tra kết quả**:
   - Hiển thị đầy đủ box đề bài & hướng dẫn.
   - Khu vực **Danh sách câu hỏi đề bài** hiển thị đầy đủ các câu hỏi đã cấu hình:
     - Số thứ tự câu, huy hiệu `TRẮC NGHIỆM`, số điểm.
     - Nội dung câu hỏi.
     - 4 lựa chọn (A, B, C, D) kèm nhãn **✓ Đáp án đúng** màu xanh lá.

### Kịch bản 5: Giáo viên chỉnh sửa bài tập đã xuất bản (Đổi đáp án đúng)
1. Đăng nhập Giáo viên, vào màn hình chỉnh sửa bài tập (`/teacher/assignments/:id/edit`).
2. Form nạp đầy đủ dữ liệu câu hỏi cũ từ DB.
3. Thay đổi đáp án đúng của 1 câu hỏi (ví dụ: chuyển tích chọn đáp án đúng từ A sang B).
4. Bấm **Lưu thay đổi**.
5. **Kiểm tra kết quả**:
   - Không bị lỗi `400 BAD_REQUEST: Không thể chuyển sang trạng thái này.`
   - Toast thông báo *"Cập nhật bài tập thành công!"*.
   - Mở lại trang xem chi tiết `/teacher/assignments/:id`: Đáp án đúng của câu hỏi đã chuyển sang phương án B với tích xanh `✓ Đáp án đúng`.

---

## 4. Báo cáo chất lượng kỹ thuật
- **Unit Tests**: Chạy `npm test` tại `frontend` -> **85/85 tests PASS** (100%).
- **TypeScript Typecheck**: `npx tsc --noEmit` -> **0 lỗi**.
- **ESLint**: `npx eslint` -> **0 lỗi, 0 cảnh báo**.
- **Production Build**: `npm run build` (`tsc -b && vite build`) -> **Build thành công**.
