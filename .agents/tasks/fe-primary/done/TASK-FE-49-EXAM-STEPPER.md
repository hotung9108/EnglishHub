---
id: TASK-FE-49-EXAM-STEPPER
title: "[FE-49] Xây dựng bộ chuyển tiếp Module thi nhiều kỹ năng (Exam Stepper) & Tinh chỉnh UI/UX luồng bài nộp"
role: fe-primary
assignee: Maloque18705
status: "Done"
created_at: 2026-10-21T23:08:58+07:00
updated_at: 2026-10-22T14:55:00+07:00
completed_at: 2026-10-22T14:55:00+07:00
priority: P1
tags: [frontend, student, teacher, assignments, multi-module, exam-stepper, BUG-20, fe-49, convention-fe]
---

# [FE-49] Xây dựng bộ chuyển tiếp Module thi nhiều kỹ năng (Exam Stepper) & Tinh chỉnh UI/UX luồng bài nộp

## 1. Bối cảnh & Mục tiêu (Context & Objective)
- **Vấn đề / Bug Tracker**: BUG-20 trong `docs/PROJECT_COMPLETE_AUDIT_AND_BUGS.md`.
  - Học sinh làm bài thi tổng hợp nhiều kỹ năng bị kẹt ở module đầu tiên hoặc logic quét từ khóa trong tiêu đề làm nhảy sai module.
  - Thiếu bộ chuyển tiếp (Stepper) giữa các module trong một assignment.
  - Học sinh có thể bỏ qua thứ tự làm bài, vi phạm quy trình thi tuần tự.
  - Phản hồi từ người dùng về giao diện: các badge/card rườm rà (thẻ stats card thừa, badge điểm/icon không cần thiết), lỗi hiển thị trạng thái sai lệch giữa bài đã làm và bài chưa làm, và quy tắc hiển thị "Đã chấm" cho bài thi nhiều phần.
- **Mục tiêu**:
  - Xây dựng bộ chuyển tiếp `ExamStepper` trực quan theo chuẩn Royal Academic Theme.
  - Sửa đổi hoàn toàn logic điều hướng: loại bỏ regex tiêu đề, đọc chính xác thứ tự module từ backend (`orderIndex` / danh sách modules).
  - Ràng buộc tuần tự: hoàn thành module trước mới được mở module sau (Nghe -> Đọc -> Viết -> Nói).
  - Chuẩn hóa bộ lọc và trạng thái bài tập phía Học viên và Giáo viên, loại bỏ các chi tiết thừa thãi (stat cards, icon medal, score badge), đảm bảo giao diện gọn gàng, tinh tế và đồng bộ.
- **Tiêu chuẩn áp dụng**: Tuân thủ tuyệt đối `.agents/rules/convention-fe.md` và `.agents/private/frontend-ui-standards` (Design Tokens Royal Academic, zero inline styles, 8px grid scale, TypeScript Strict Mode).

---

## 2. Các thay đổi đã thực hiện (Implementation Details)

### 2.1. Router (`frontend/src/App.tsx`)
- Bổ sung route tường minh `<Route path="assignments/writing/:id" element={<StudentAssignmentWriting />} />`.
- Giữ route cũ `<Route path="assignments/:id" element={<StudentAssignmentWriting />} />` để đảm bảo 100% tương thích ngược.

### 2.2. Module Utility (`frontend/src/utils/examStepper.utils.ts`)
- `normalizeSkill`: Chuẩn hóa tên kỹ năng (`listening`, `reading`, `writing`, `speaking`).
- `getSkillRoute`: Sinh URL chính xác kèm query `submissionId`.
- `isModuleSubmittedOrGraded`: Nhận diện module đã nộp hoặc đã có điểm (`SUBMITTED` | `GRADED`).
- `isModuleAccessible`: Kiểm tra khóa tuần tự (Module `k` chỉ mở khi tất cả module `0..k-1` đã hoàn thành).
- `getNextIncompleteModule`: Lấy module chưa hoàn thành đầu tiên theo thứ tự bài thi.
- `calculateExamSteps`: Tính toán trạng thái các bước cho Stepper (`COMPLETED`, `ACTIVE`, `AVAILABLE`, `LOCKED`).

### 2.3. Component `ExamStepper` (`frontend/src/components/assignments/ExamStepper.tsx`)
- Biến thể `overview`: Hiển thị dạng thẻ timeline chi tiết tại `StudentAssignmentOverview.tsx`.
- Biến thể `compact`: Hiển thị dạng thanh breadcrumb stepper tại header của các màn hình thi (`Listening`, `Reading`, `Writing`, `Speaking`).
- Styling: `frontend/src/styles/exam-stepper.css` sử dụng CSS variables từ hệ thống.

### 2.4. Màn hình Tổng quan (`StudentAssignmentOverview.tsx`)
- Gỡ bỏ hoàn toàn logic quét chuỗi tiêu đề (`titleLower.includes('nói')`).
- `handleStartAttempt`: Xác định chính xác module đầu tiên chưa nộp từ dữ liệu `startAttempt` hoặc `inProgressSub`.
- `handleStartSkill`: Kiểm tra khóa tuần tự `isModuleAccessible`, ngăn chặn học sinh bấm nhảy cóc vào các module chưa được mở.
- Nút CTA thông minh: Hiển thị đúng phần thi tiếp theo `"Tiếp tục làm bài (Phần: ...)"`.

### 2.5. Tích hợp chuyển tiếp tại các màn hình kỹ năng
- Tích hợp `ExamStepper` (dạng `compact`) vào header của cả 4 màn hình:
  - `StudentAssignmentListening.tsx`
  - `StudentAssignmentReading.tsx`
  - `StudentAssignmentWriting.tsx`
  - `StudentAssignmentSpeaking.tsx`
- Khi nộp thành công một module:
  - Nếu còn module kế tiếp: Hiển thị thông báo hoàn thành và tự động chuyển tiếp sang URL của module tiếp theo sau 1.5s kèm `submissionId`.
  - Nếu là module cuối cùng: Tự động hoàn tất bài nộp (`submitSubmission`) và chuyển tới màn hình kết quả `StudentSubmissionResult`.
- **Dọn sạch mock data (Zero-bloat)**: Loại bỏ bộ đếm thời gian đếm ngược tĩnh (30:00/40:00) tại `StudentAssignmentReading.tsx` và `StudentAssignmentListening.tsx` do schema không hỗ trợ trường duration bài làm.

### 2.6. Sửa lỗi hiển thị trạng thái sau khi nộp toàn bộ bài thi
- **Vấn đề**: Sau khi nộp toàn bộ các phần thi, khi quay lại `StudentAssignmentOverview.tsx`, kỹ năng đầu tiên vẫn hiển thị "Đang làm bài" và nút "Tiếp tục làm".
- **Khắc phục**:
  - `StudentAssignmentOverview.tsx`: Thêm state `latestCompletedSub` theo dõi lượt nộp gần nhất (`status === 'SUBMITTED' | 'GRADED'`). Truyền `displaySub?.modules` và cờ `hasActiveAttempt = Boolean(inProgressSub)` vào `ExamStepper`.
  - `examStepper.utils.ts` & `ExamStepper.tsx`: Bổ sung tham số `hasActiveAttempt`. Khi `hasActiveAttempt === false`, bước chưa hoàn thành ở trạng thái `AVAILABLE` hoặc `LOCKED`, tuyệt đối không gắn cờ `ACTIVE`. Khi tất cả các phần thi đã nộp, 100% các bước hiển thị `COMPLETED` với nút *"Xem lại"*.
  - Nút *"Xem lại"* điều hướng trực tiếp tới trang chi tiết bài nộp `/student/submissions/:submissionId`.

### 2.7. Chuẩn hóa trạng thái chấm điểm bài thi đa phần (`TeacherAssignmentDetails.tsx`, `submission.service.ts`)
- **Bỏ số phần trong cột trạng thái**: Xóa hậu tố đếm phần bài (ví dụ: `(1/3 phần)`), hiển thị tinh gọn trạng thái "Chưa chấm" theo đúng quy chuẩn giao diện.
- **Xác định bài tập đã chấm**: Bổ sung hàm `isSubmissionGraded` và `isModuleGraded` trong `submission.service.ts`. Bài thi đa kỹ năng (như Reading tự động chấm + Speaking + Writing) chỉ được coi là "Đã chấm" khi tất cả các kỹ năng đều đã có kết quả chấm điểm hoàn tất, tránh việc mới chỉ có Reading tự động chấm mà cả bài thi đã vội hiển thị "Đã chấm".

### 2.8. Tinh giản giao diện & tối ưu bộ lọc lớp học phía Học viên (`StudentClassDetails.tsx`)
- **Loại bỏ thẻ thống kê thừa**: Xóa bỏ hoàn toàn 3 stats card ("Chưa làm", "Chờ chấm", "Đã có điểm") giúp khu vực danh sách bài tập thoáng đãng, tập trung vào nội dung chính.
- **Duy trì filter pill**: Giữ lại các nút bấm filter tương tác tinh gọn ("Tất cả", "Chưa làm", "Chờ chấm", "Đã có điểm") kèm badge đếm số lượng.
- **Sửa lỗi hiển thị trạng thái**: Khắc phục lỗi học viên đã làm bài nhưng bảng hiển thị "Chưa làm":
  - Tăng hạn mức lấy submissions (`limit: 100`).
  - So khớp chuẩn xác mã bài tập `String(s.assignmentId) === String(a.id)`.
  - Ưu tiên lựa chọn bài nộp có trạng thái tốt nhất (`GRADED` > `SUBMITTED` > `IN_PROGRESS`).

### 2.9. Tinh gọn danh sách bài tập phía Học viên (`StudentAssignments.tsx`)
- **Sắp xếp lại filter**: Đồng bộ thứ tự bộ lọc bài tập thành "Tất cả", "Chưa làm", "Chờ chấm", "Đã có điểm".
- **Xóa badge điểm**: Gỡ bỏ badge điểm và quy đổi band (`Điểm: ... / 100 • Band ...`) khỏi thẻ bài tập.
- **Lược bỏ icon trang trí**: Xóa bỏ các icon không cần thiết (`<Clock>`, `<CheckCircle2>`, chấm trạng thái `.std-asg-dot`), chỉ giữ badge văn bản tối giản theo chuẩn Royal Academic.
- **Sửa lỗi ghi đè trạng thái**: Loại bỏ logic ép bài tập đã đóng thành "Chưa làm" khi học sinh đã có lượt nộp bài hoặc đang làm dở.

### 2.10. Tinh giản và hoàn thiện màn hình kết quả bài làm (`StudentSubmissionResult.tsx`, `student-result.css`, `locales/student.ts`)
- **Badge trạng thái**: Gỡ bỏ icon huân chương `<Award size={13} />`, sửa nội dung từ "Đã chấm điểm hoàn tất" thành "Đã chấm điểm" (`studentResult.statusGraded`).
- **Lược bỏ "Chấm bởi..."**: Xóa phần hiển thị `gradedBy` và dấu phân cách bullet dư thừa trong `.result-hero-meta`, chỉ giữ lại ngày nộp bài và kỹ năng đang hiển thị.
- **Bộ lọc kỹ năng chuyên nghiệp**:
  - Đổi nhãn từ "Kỹ năng / Phần bài:" thành "Kỹ năng:" (`moduleSwitcherLabel`).
  - Bọc các nút chuyển đổi kỹ năng vào `.result-skill-buttons-group`, căn chỉnh chiều cao chuẩn 36px, gap 8px, font-weight 500.
  - Sử dụng token màu Royal Sovereign Green (`--primary`) khi kích hoạt (`.result-skill-btn.active`).
  - Sắp xếp thứ tự hiển thị kỹ năng theo chuẩn học thuật cố định: `Listening` -> `Reading` -> `Writing` -> `Speaking`.

---

## 3. Kiểm thử & Đánh giá (Testing & Verification)
- **Unit Tests**:
  - `frontend/src/api/__tests__/exam-stepper-navigation.test.ts`: 9 test cases bao quát quy trình tuần tự, điều hướng, khóa module, và trạng thái hoàn thành.
  - `frontend/src/api/__tests__/submission.service.test.ts`: Bổ sung test cases cho `isModuleGraded` và `isSubmissionGraded` với các bài thi hỗn hợp (Reading tự động chấm + Speaking + Writing).
  - Kết quả: **139/139 unit test cases PASS (100%)**.
- **Build & Quality Check**:
  - `npm --prefix frontend run build`: Compile TypeScript (`tsc -b`) và đóng gói Vite thành công (0 errors).
  - `npm --prefix frontend run lint`: ESLint đạt chuẩn (0 errors).
