---
id: TASK-FE-52-CLOSE-ASSIGNMENT
title: "Bổ sung thao tác Đóng bài tập cho giáo viên & Đồng bộ trạng thái nộp bài (Close Assignment)"
role: fe-primary
assignee: Maloque18705
status: "Done"
created_at: 2026-10-21T19:18:21+07:00
updated_at: 2026-10-21T21:45:00+07:00
completed_at: 2026-10-21T21:45:00+07:00
priority: P1
tags: [frontend, teacher, student, assignments, close-assignment, fe-52, issue-152, qa29-021, convention-fe]
---

# [FE-52][ISSUE #152] Bổ sung thao tác Đóng bài tập cho giáo viên & Đồng bộ trạng thái nộp bài (Close Assignment)

## 1. Bối cảnh & Mục tiêu (Context & Objective)
- **Vấn đề / Bug Tracker**: GitHub Issue #152 (xuất phát từ gói kiểm thử QA-29, test case `QA29-021` bị `BLOCKED` do automation không tìm thấy nút đóng bài tập trên trang chi tiết).
- **Mục tiêu**: 
  - Cho phép giáo viên phụ trách chủ động đóng (`CLOSED`) một bài tập đang mở (`PUBLISHED`) thay vì chỉ chờ hết hạn tự động.
  - Ngăn chặn hoàn toàn học viên tiếp tục làm bài hoặc nộp bài sau khi bài tập đã đóng.
  - Khắc phục triệt để các sai lệch về trạng thái làm bài dở (`IN_PROGRESS`), loại trừ việc đếm nhầm bài đang làm thành *"Đã nộp bài"* hoặc *"Chờ chấm"*.
- **Quy chuẩn áp dụng**: Tuân thủ nghiêm ngặt quy định phát triển Frontend tại `.agents/rules/convention-fe.md` (React 19, TypeScript Strict Mode, Design Tokens Royal Academic, không inline style, xử lý state API rõ ràng, phân quyền RBAC theo vai trò giáo viên sở hữu).

---

## 2. Phạm vi & Đặc tả kỹ thuật (Scope & Specifications)

### 2.1. Thao tác Đóng bài tập & Quyền sở hữu (Ownership & RBAC)
- **Vị trí**: Đặt nút "Đóng bài tập" ngay cạnh nút "Chỉnh sửa bài tập" trên header trang chi tiết bài tập (`TeacherAssignmentDetails.tsx`).
- **Xác thực quyền sở hữu (`isOwner`)**:
  - Tích hợp hook `useAuth()` để lấy thông tin người dùng đang đăng nhập (`user`).
  - Lưu trữ thông tin lớp học `currentClass` khi tải chi tiết bài tập.
  - Tính toán `isOwner`: chỉ khi `user.role === 'teacher'` và `currentClass.teacherId === user.id` (hoặc lớp thuộc giáo viên phụ trách), các nút quản trị bài tập mới hiển thị và cho phép thao tác.
  - Giáo viên không sở hữu bài tập hoặc học viên sẽ không thấy/không bấm được nút này.
- **Modal xác nhận đóng bài tập (Phương án B - Custom Modal Dialog)**:
  - Thiết kế tối giản, đồng bộ với Design System Royal Academic (`var(--surface)`, `var(--border-color)`, `var(--radius-lg)`).
  - **Tiêu đề**: `Đóng bài tập` (VI) / `Close Assignment` (EN).
  - **Nội dung**: `Bạn có chắc chắn muốn đóng bài tập này không? Học viên sẽ không thể nộp bài sau khi đóng.` (VI) / `Are you sure you want to close this assignment? Students will not be able to submit after closing.` (EN).
  - **Hành động**: Nút "Hủy" (`variant="secondary"`) và nút "Đóng bài tập" (`variant="danger"`, `loading={isClosing}`).
  - Hỗ trợ phím `Escape` và click ra ngoài backdrop overlay để đóng modal an toàn.
- **Tích hợp API**:
  - Gọi `PATCH /api/v1/assignments/{assignmentId}/status` với `{ status: 'CLOSED' }`.
  - Cập nhật state bài tập sang `CLOSED`, status pill chuyển sang màu xám với nhãn `Đã đóng (Closed)` và nút chuyển sang `disabled`.
  - Trích xuất thông điệp lỗi chi tiết từ Backend payload nếu xảy ra lỗi.

### 2.2. Đồng bộ trạng thái bài làm dở (`IN_PROGRESS`) phía Giáo viên
- **Phân định 3 trạng thái nộp bài**: `status: 'submitted' | 'in_progress' | 'missing'`.
- **Khi bài tập đang mở (`PUBLISHED`)**:
  - Học viên mới bắt đầu làm bài (`IN_PROGRESS`): hiển thị badge **"Đang làm bài"** (`.tad-badge-in-progress`, màu hổ phách/tertiary), trạng thái chấm điểm `"Chưa có bài"`, nút thao tác `"Gửi nhắc nhở"` (không hiển thị nút "Chấm bài ngay").
  - `submittedCount` và `pendingCount` chỉ đếm các bài thực sự đã nộp (`status === 'submitted'`).
- **Khi bài tập đã đóng (`CLOSED`)**:
  - Các lượt `IN_PROGRESS` chưa nộp kịp tự động chuyển sang trạng thái **"Chưa nộp bài"** (`missing`).
  - Ngay khi giáo viên bấm đóng bài tập trên Modal, state cục bộ cập nhật chuyển học viên `in_progress` sang `missing` theo thời gian thực mà không cần reload trang.
- **Khắc phục đếm nhầm "1 bài chờ chấm" trên danh sách bài tập**:
  - Trong `TeacherAssignments.tsx` và `TeacherClasses.tsx`, thêm điều kiện loại trừ `s.status !== 'IN_PROGRESS'` khi tính `pendingGradingCount`, khắc phục triệt để lỗi do Backend tự động gán `GradingStatus.PENDING` ngay khi khởi tạo lượt làm dở.
- **Bảo vệ trang chi tiết bài nộp học viên (`TeacherSubmissionDetails.tsx`)**:
  - Ngăn chặn gọi `loadModuleData` nếu `submission.status === 'IN_PROGRESS'` (tránh lỗi 400 Bad Request từ Backend).
  - Hiển thị component `EmptyState` thông báo học viên đang trong quá trình làm bài và chưa nộp bài chính thức.

### 2.3. Khóa toàn bộ luồng tiếp tục làm bài & nộp bài phía Học viên khi `CLOSED`
- **`StudentAssignmentOverview.tsx`**:
  - Trong bảng lịch sử lượt làm bài: Hàng chứa lượt `in_progress` chuyển sang nhãn **`Chưa nộp (Đã đóng)`** và nút thao tác đổi thành **`Đã đóng`** (`disabled`).
  - Nút CTA cuối trang: Lọc các bài nộp hoàn tất (`a.status !== 'in_progress'`). Nếu chưa có bài nộp nào, nút chuyển thành **`Bài tập đã đóng (Không thể làm bài)`** (`disabled`).
  - Xóa bỏ việc nuốt lỗi (Swallow Error) trong `handleStartAttempt` và `handleStartSkill`. Nếu Backend từ chối hoặc bài đã đóng, dừng điều hướng ngay lập tức.
  - Vô hiệu hóa nút các phần thi kỹ năng (`m.skill`) với nhãn `"Đã đóng"`.
- **4 Workspace kỹ năng (`Writing`, `Speaking`, `Reading`, `Listening`)**:
  - Hiển thị Banner cảnh báo bài tập đã đóng ngay khi vào trang.
  - Vô hiệu hóa nút nộp bài với nhãn `"Bài tập đã đóng"`.
- **`StudentAssignments.tsx` & `StudentWorkspace.tsx`**:
  - Không hiển thị nhãn "Đang làm" hay nút "Tiếp tục làm bài" trên danh sách bài tập khi bài đã đóng.
  - Tự động lọc bỏ các bản nháp thuộc bài tập đã đóng khỏi kệ bản nháp đang dở trong workspace.

### 2.4. Chuẩn hóa thông tin Overview & Loại bỏ trường ngoài Schema
- **Loại bỏ trường ngoài Schema & Khối hướng dẫn tĩnh**:
  - Xác minh từ database migration (`V1`, `V2`) và entity backend `Assignment.java`: hệ thống không lưu trữ "Thời lượng làm bài" và "Phương thức tính điểm".
  - Đã loại bỏ 2 card hardcode này khỏi `StudentAssignmentOverview.tsx` để bảo toàn tính toàn vẹn dữ liệu, chỉ giữ lại các trường có thật trong Schema: "Thời hạn nộp" và "Số lượt nộp cho phép".
  - Đã loại bỏ khối văn bản tĩnh "Hướng dẫn & Yêu cầu bài làm" (`.overview-instructions-box`) theo yêu cầu, tinh giản layout và tuân thủ tiêu chuẩn giao diện trực quan tại `convention-fe.md`.
  - Cập nhật grid CSS layout chia 2 cột cân đối và thẩm mỹ.
- **Hiển thị chính xác số lượt đã nộp**:
  - Chuyển sang dùng `completedAttemptsCount` thay cho `attempts.length`. Đảm bảo học viên làm dở chưa nộp sẽ thấy `Tối đa 1 lần (Đã nộp 0/1)`.
- **Hiển thị "Thời hạn nộp" khi bài đã đóng**:
  - Khi `assignment?.status === 'CLOSED'`, ô Thời hạn nộp và Meta status badge hiển thị rõ ràng là `Đã đóng`, chấm dứt việc hiển thị sai lệch `Mở trực tuyến`.

### 2.5. Tương thích kiểm thử tự động QA (Selenium QA29-021)
- Cập nhật hàm `closeAssignment` trong `test/selenium/pages/teacher/TeacherExtendedPage.js`:
  - Bổ sung fallback tự động nhận diện và click nút xác nhận trong Modal (`.tad-modal-actions .btn-danger`) nếu automation không bắt được native browser alert, đảm bảo test case `QA29-021` pass hoàn toàn khi QA chạy lại trên môi trường Staging/Dev.

---

## 3. Các tệp tin thay đổi (Impacted Files)

| File | Thay đổi chính |
| :--- | :--- |
| `frontend/src/pages/TeacherAssignmentDetails.tsx` | Tích hợp `useAuth`, kiểm tra quyền sở hữu `isOwner`, Modal xác nhận đóng bài tập, phân định trạng thái `in_progress` vs `missing` khi đóng bài, cập nhật state realtime khi đóng thành công. |
| `frontend/src/pages/TeacherAssignments.tsx` | Sửa bộ lọc `submittedCount` và `pendingGradingCount` loại trừ bài làm dở `IN_PROGRESS`, tránh hiển thị sai bài chờ chấm. |
| `frontend/src/pages/TeacherClasses.tsx` | Đồng bộ bộ lọc `pendingCount` loại trừ bài làm dở `IN_PROGRESS`. |
| `frontend/src/pages/TeacherEditAssignment.tsx` | Sửa turnout stats chỉ tính các bài nộp thực tế không phải `IN_PROGRESS`. |
| `frontend/src/pages/TeacherSubmissionDetails.tsx` | Ngăn chặn gọi module detail gây lỗi 400 cho bài `IN_PROGRESS`, hiển thị EmptyState thân thiện và lọc phân trang học viên. |
| `frontend/src/pages/StudentAssignmentOverview.tsx` | Khóa nút "Tiếp tục làm bài" trong bảng lịch sử khi bài đã đóng, vô hiệu hóa nút CTA cuối trang, chặn các hàm bắt đầu bài thi khi `CLOSED`, sửa đếm số lượt nộp dùng `completedAttemptsCount`, hiển thị "Đã đóng" cho hạn nộp, loại bỏ 2 trường ngoài schema (Thời lượng, Phương thức tính điểm), xóa khối hướng dẫn tĩnh, và chuẩn hóa trạng thái hiển thị thành "Đang làm" (thay vì "Đang làm dở"). |
| `frontend/src/pages/StudentAssignments.tsx` | Đổi `displayStatus` thành `not_started` khi bài tập đã `CLOSED`, ẩn nút "Tiếp tục", chuẩn hóa badge `statusInProgress` ("Đang làm"). |
| `frontend/src/pages/StudentWorkspace.tsx` | Lọc bỏ các bản nháp của bài tập đã đóng khỏi danh sách bản nháp đang làm, chuẩn hóa thông báo trống thành "Không có bản nháp nào đang làm!". |
| `frontend/src/pages/StudentAssignmentWriting.tsx` | Cảnh báo banner bài tập đã đóng, chặn nộp bài và vô hiệu hóa nút nộp khi `CLOSED`; chuẩn hóa thẻ "Thông tin chấm điểm": loại bỏ text ảo "100 điểm (Quy đổi Band 9.0)", hiển thị thang điểm động theo module/snapshot (`maxScore` điểm) và "Lượt làm bài" tối giản, không badge/text thừa. |
| `frontend/src/pages/StudentAssignmentSpeaking.tsx` | Tương tự, chặn nộp bài và vô hiệu hóa nút nộp bài khi đã đóng. |
| `frontend/src/pages/StudentAssignmentReading.tsx` | Tương tự, chặn nộp bài và vô hiệu hóa nút nộp bài khi đã đóng. |
| `frontend/src/pages/StudentAssignmentListening.tsx` | Tương tự, chặn nộp bài và vô hiệu hóa nút nộp bài khi đã đóng. |
| `frontend/src/styles/teacher.css` | Thêm modal overlay, modal box, và styling cho `.tad-badge-in-progress`, `.tad-badge-dot.in-progress` sử dụng Design Tokens Royal Academic. |
| `frontend/src/styles/student-overview.css` | Điều chỉnh grid quy tắc nộp bài thành 2 cột cân đối cho 2 card thật ("Thời hạn nộp" và "Số lượt nộp cho phép"). |
| `frontend/src/locales/teacher.ts` | Bổ sung nhãn đa ngôn ngữ `statusInProgressLabel` ("Đang làm bài" / "In Progress"). |
| `test/selenium/pages/teacher/TeacherExtendedPage.js` | Mở rộng helper `closeAssignment` để hỗ trợ click nút xác nhận Modal trong trường hợp giao diện sử dụng Custom Modal Dialog. |
| `test/selenium/support/student/ui-contract.js` | Đồng bộ hàm `verifyAttemptRule` đối sánh số lượt nộp thực tế với các lượt nộp hoàn tất (`completedAttempts`). |

---

## 4. Kiểm tra tiêu chí hoàn thành (Definition of Done - DoD)

- [x] **Vị trí & Phân quyền**: Nút "Đóng bài tập" hiển thị đúng vị trí bên cạnh "Chỉnh sửa bài tập", chỉ giáo viên sở hữu assignment mới thấy và bấm được.
- [x] **Xác nhận**: Có dialog xác nhận; bấm Hủy hoặc ấn Escape thì modal đóng và trạng thái không đổi.
- [x] **API Status Transition**: Xác nhận thì gọi `PATCH /assignments/{id}/status`, trạng thái chuyển `CLOSED`, status pill cập nhật đúng ("Đã đóng / Closed") và nút chuyển sang disabled.
- [x] **Xử lý lỗi**: Lỗi API từ Backend được trích xuất và hiển thị rõ ràng trên Toast thông báo.
- [x] **Đồng bộ trạng thái nộp bài**: Học viên làm dở không bị tính là bài đã nộp hay bài chờ chấm. Khi bài đóng, học viên chưa nộp tự động chuyển về "Chưa nộp bài".
- [x] **Khóa luồng học viên**: Học viên không thể bấm "Tiếp tục làm bài", "Bắt đầu làm bài" hay nộp bài sau khi giáo viên đã đóng bài tập.
- [x] **Kiểm thử tự động**: Test case `QA29-021` được cập nhật tương thích cả native alert lẫn Modal UI.
- [x] **Chất lượng mã nguồn**:
  - `npm --prefix frontend run build`: Thành công (`0 errors`).
  - `npm --prefix frontend run lint`: Pass (`0 errors`).
  - `npm --prefix frontend test`: Pass `126/126` unit & integration tests.
- [x] **Git Rule**: Không thực hiện git commit theo đúng chỉ thị của người dùng.
