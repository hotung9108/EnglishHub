# Báo Cáo Rà Soát Frontend, Danh Sách Trang Còn Thiếu & Các Thành Phần Dư Thừa (Frontend Gap & Redundancy Analysis)

> **Dự án**: EnglishHub — Hệ thống Quản lý & Chấm chữa bài tập Tiếng Anh Thông minh  
> **Ngày cập nhật**: 16/10/2026 (Phiên bản 2.0 - Sau khi đối soát thực tế toàn bộ mã nguồn)  
> **Người thực hiện**: Hệ thống Phân tích Antigravity Agent  
> **Công nghệ**: React 19, TypeScript, Vite, React Router v7, Axios Core Client  
> **Cơ sở đối chiếu**: Toàn bộ 46 tệp React Pages trong `frontend/src/pages/` + Core SRS (`docs/core/01.SRS.md`) + Backend Spring Boot V6 + FastAPI AI Microservice (`ai-service`)

---

## 1. Tổng Quan Hiện Trạng Frontend

Qua các đợt phát triển gần nhất (`TASK-FE-08`, `TASK-FE-AXIOS-INTEGRATION`, `TASK-FE-TEACHER-DASHBOARD`, `TASK-FE-20`, v.v.), thư mục `frontend/src/pages/` hiện có **46 tệp component trang**, phủ kín các màn hình giao diện của 3 phân hệ (Admin, Teacher, Student).

### Kết quả đối soát mã nguồn thực tế (Ngày 16/10/2026):
1. **Xác thực thật (Real Auth)**: Đã hoàn thiện kết nối `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`. Các trang `ForgotPassword.tsx` và `ResetPassword.tsx` đã kết nối API thật `POST /api/v1/auth/forgot-password` và `POST /api/v1/auth/reset-password`.
2. **Phân hệ Quản trị (Admin) ĐÃ KẾT NỐI API THẬT**:
   - `Accounts.tsx`: Tích hợp hook `useUsers` và `userService.listUsers`, `userService.updateUser`.
   - `Classes.tsx`, `AddClass.tsx`, `ClassDetails.tsx`: Đã kết nối `classService.list`, `classService.create`, `classService.getDetail`, `classService.listMembers`.
   - `Teachers.tsx`, `AddTeacher.tsx`, `TeacherDetails.tsx`: Đã kết nối `userService.listUsers({ role: 'TEACHER' })`, `userService.createUser`.
   - `Students.tsx`, `AddStudent.tsx`, `StudentDetails.tsx`: Đã kết nối `userService.listUsers({ role: 'STUDENT' })`, `reportService.getStudentProgress`.
   - `AdminReports.tsx`: Đã kết nối `reportService.getOverview`, `reportService.getClassesReport`.
   - `AdminGradingAuditLogs.tsx`: Đã kết nối `gradingService.listGradings`, `gradingChangeLogService.listByGrading`.
3. **Phân hệ Giáo viên (Teacher) ĐÃ KẾT NỐI API THẬT**:
   - `TeacherDashboard.tsx`: Đã gọi `classService.list`, `assignmentService.listAssignments`, `submissionService.listSubmissions`.
   - `TeacherClasses.tsx` & `TeacherClassProgress.tsx`: Đã kết nối `classService`, `assignmentService`, `studentEvaluationService`.
   - `TeacherAssignments.tsx`: Đã kết nối `classService`, `assignmentService` và quản lý trạng thái xuất bản (`publish`, `close`).
   - `TeacherCreateAssignment.tsx`: Đã hiện thực tạo tuần tự Assignment -> Module -> Question (`TASK-FE-20` hoàn thành).
   - `TeacherAssignmentDetails.tsx`: Đã kết nối `classService`, `assignmentService`, `submissionService`, `moduleService`.
   - `TeacherSubmissionDetails.tsx`: Đã kết nối `gradingService.getAiSuggestion`, `gradingService.getBySubmissionModule`, `submissionService.getDetail`, `gradingService.updateFinalGrade`.
4. **Phân hệ Học viên (Student) ĐÃ KẾT NỐI API THẬT**:
   - `StudentDashboard.tsx`, `StudentClasses.tsx`, `StudentClassDetails.tsx`, `StudentAssignments.tsx`, `StudentAssignmentOverview.tsx`, `StudentAssignmentWriting.tsx`, `StudentAssignmentReading.tsx`, `StudentAssignmentListening.tsx`, `StudentSubmissionResult.tsx`, `StudentGrades.tsx`, `StudentAnalytics.tsx`.

---

## 2. 🚨 MỤC CÁC TÍNH NĂNG & THÀNH PHẦN BỊ THỪA (Redundant & Out-of-Scope Features)

Dưới đây là các trang, module và thành phần giao diện đã được lập trình nhưng **vượt quá phạm vi đặc tả Core SRS (`docs/core/01.SRS.md`)** hoặc **bị dư thừa, phân mảnh trải nghiệm**:

### 2.1. Các Trang Giao Diện Dư Thừa So Với Đặc Tả Core SRS

| STT | Trang / Thành phần thừa | Đường dẫn | Hiện trạng trong mã nguồn | Đánh giá dư thừa so với Core SRS | Hướng xử lý đề xuất |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **R1** | **Ngân hàng đề thi / Kho bài tập mẫu**<br>`TeacherExamBank.tsx` | `/teacher/exam-bank`<br>`/teacher/assignments/templates` | Đã code giao diện tìm kiếm đề thi mẫu, phân loại IELTS/TOEIC, xem trước đề thi. | **VƯỢT PHẠM VI (Out of Scope)**.<br>Core SRS chỉ yêu cầu Giáo viên tạo bài tập trực tiếp theo lớp (UC11, UC12). Không có yêu cầu về Ngân hàng đề thi tập trung hay chia sẻ template giữa các giáo viên trong Project 1. | Giữ nguyên ở trạng thái phụ trợ/read-only hoặc ẩn khỏi Sidebar chính của giáo viên để tránh phân tán tài nguyên kiểm thử. |
| **R2** | **Lưu trữ & Khôi phục Lớp học**<br>`AdminClassArchive.tsx` | `/admin/classes/archive` | Đã code trang danh sách các lớp đã lưu trữ kèm bộ lọc và nút "Khôi phục". | **DƯ THỪA (Redundant)**.<br>Core SRS chỉ quy định quản lý trạng thái lớp học (Đang mở/Đã đóng) trong danh sách lớp chính (`Classes.tsx`). Việc tách riêng một phân hệ Lưu trữ (Archive) là dư thừa. | Tích hợp thành một tab hoặc bộ lọc trạng thái `status=COMPLETED` ngay trong `Classes.tsx`, gỡ bỏ route riêng `/admin/classes/archive`. |
| **R3** | **Không gian tự học cá nhân**<br>`StudentWorkspace.tsx` | `/student/workspace` | Trang chứa ghi chú nhanh, danh sách bài tập nháp, tài liệu ôn tập cá nhân. | **VƯỢT PHẠM VI (Out of Scope)**.<br>Core SRS quy định học viên chỉ tương tác với bài tập được giao bởi giáo viên theo lớp. Hệ thống không có use case ghi chú cá nhân hay quản lý nháp tự do. | Ẩn khỏi Sidebar của học viên hoặc gom gọn vào trang Dashboard cá nhân. |
| **R4** | **Hộp thư Lời phê & Phản hồi riêng**<br>`StudentFeedback.tsx` | `/student/feedback` | Trang tổng hợp tất cả lời phê và nhận xét của giáo viên/AI từ trước đến nay. | **DƯ THỪA (Redundant)**.<br>Lời phê của bài tập đã nằm trực tiếp trong `StudentSubmissionResult.tsx` (UC33: Xem bài chữa), còn đánh giá định kỳ của lớp đã nằm trong `StudentClassDetails.tsx` (UC34: Đánh giá học viên). Việc tạo thêm một hòm thư feedback làm phân mảnh thông tin. | Gộp vào tab "Nhận xét & Lời phê" trong trang chi tiết lớp học (`StudentClassDetails.tsx`) hoặc trang Kết quả bài tập. |
| **R5** | **Quản lý Ma trận Phân quyền Động**<br>`Roles.tsx` | `/admin/roles` | Trang quản lý danh sách vai trò và phân quyền chi tiết từng chức năng hệ thống. | **VƯỢT PHẠM VI (Out of Scope)**.<br>Hệ thống có 3 vai trò cố định (`ADMIN`, `TEACHER`, `STUDENT`) được định nghĩa cứng trong Database Enum. Không có yêu cầu tạo role mới hoặc tùy biến quyền động qua UI. | Khóa tính năng tạo role mới, chuyển thành trang hiển thị mô tả quyền mặc định mang tính thông tin. |

### 2.2. Các Thành Phần Kỹ Thuật & Điều Hướng Dư Thừa (Technical Redundancies)

1. **Điều hướng tắt bị hardcode (Hardcoded Redirects)**:
   - Route `/progress` trong `App.tsx` đang redirect cứng về `/teacher/classes/ENG-IELTS-6.5A/progress` (chứa mã lớp hardcode `ENG-IELTS-6.5A` thay vì động theo lớp của giáo viên đăng nhập).
   - Route `/reports` redirect cứng về `/admin/reports` dù người dùng là giáo viên.
2. **Trùng lặp đường dẫn (Duplicate Route Aliases)**:
   - Hai route cho cùng chức năng sửa bài: `/teacher/assignments/:id/edit` và `/teacher/assignments/edit/:id`.
   - Hai route cho cùng chức năng xem kết quả: `/student/assignments/:id/result` và `/student/submissions/:id`.
   - Hai route cho thông tin cá nhân Admin: `/admin/accounts/profile` và `/admin/profile`.
3. **Mã kiểm tra tính hợp lệ tiếng Việt quá mức (Over-engineered Fullname Validation)**:
   - Module `nameValidation.ts` với 7 bộ unit test phức tạp chỉ để kiểm tra họ tên người dùng, trong khi backend đã có chuẩn kiểm tra validation đơn giản.

---

## 3. ❌ MỤC CÁC TRANG & THÀNH PHẦN KỸ THUẬT CÒN THIẾU (Actual Remaining Gaps)

Sau khi rà soát toàn bộ mã nguồn ngày 16/10/2026, các trang từng bị báo thiếu API nay **đã được kết nối**. Dưới đây là **những khoảng trống thực sự còn lại** cần hoàn thiện:

### 3.1. Các Trang Giao Diện Cốt Lõi Còn Thiếu Theo SRS

| STT | Trang đề xuất | Đường dẫn URL | Lý do & Nghiệp vụ cốt lõi theo Core SRS | Mức độ ưu tiên |
| :---: | :--- | :--- | :--- | :---: |
| **M1** | **Bộ Chạy Bài Thi Đa Kỹ Năng Tuần Tự**<br>`StudentAssignmentRunner.tsx` | `/student/assignments/:id/take` | **Core Architecture Gap**: Theo thiết kế DB và Core SRS, một đề thi (Assignment) có thể bao gồm nhiều module kỹ năng tuần tự (VD: Module 1 Listening Quiz -> Module 2 Reading -> Module 3 Writing Essay -> Module 4 Speaking). Hiện tại Frontend chia tách thành 4 trang rời rạc, **thiếu khung điều hướng chuyển tiếp giữa các module** trong một phiên làm bài liên tục. | **P0 (Bắt buộc)** |
| **M2** | **Bảng Điều Khiển Duyệt Gợi Ý Sửa Lỗi AI Cho Giáo Viên**<br>`TeacherAnnotationReviewPanel.tsx` | `/teacher/submissions/:id/annotations` | **Core Use Case (UC25, UC26, UC27)**: Backend đã có API gợi ý AI (`GET /submission-modules/{id}/grading/ai-suggestion`) và bảng `answer_annotations` với trạng thái `PENDING`, `ACCEPTED`, `REJECTED`. Frontend cần bảng điều khiển trực quan để giáo viên bấm Duyệt (Accept), Sửa (Edit) hoặc Bác bỏ (Reject) từng đoạn sửa lỗi của AI trước khi gửi điểm cho học sinh. | **P0 (Bắt buộc)** |
| **M3** | **Trang Làm Bài Tập Viết Lại Câu (Sentence Rewrite)**<br>`StudentAssignmentRewrite.tsx` | `/student/assignments/rewrite/:id` | Backend đã có `module_task_type.REWRITE` và Auto-grading engine so khớp đáp án điền từ/viết lại câu. Frontend hiện mới chỉ có Quiz trắc nghiệm và Essay viết dài, thiếu giao diện nhập câu viết lại và đối chiếu tức thì. | **P1 (Quan trọng)** |

### 3.2. Các Lỗ Hổng Kỹ Thuật Còn Thiếu Trong Các Trang Đã Kết Nối API

1. **Ghi Âm Thật Web Audio API & Tải Lên S3 Bằng Presigned URL (`StudentAssignmentSpeaking.tsx`)**:
   - Hiện tại trang Speaking chỉ có đồng hồ bấm giờ mô phỏng và chuỗi ghi âm giả lập.
   - **Cần hoàn thiện**: Tích hợp Web Audio API / `MediaRecorder` để ghi âm microphone thành file Blob (`audio/webm` hoặc `audio/wav`), gọi API `POST /api/v1/submission-modules/{id}/audio-upload-url` để lấy presigned PUT URL, và dùng `fetch(uploadUrl, { method: 'PUT', body: audioBlob })` đẩy file trực tiếp lên kho lưu trữ trước khi gọi submit.
2. **Trình Phát Audio Thật Cho Bài Nghe (`StudentAssignmentListening.tsx`)**:
   - Cần hoàn thiện trình phát HTML5 `<audio>` hỗ trợ tua, chỉnh tốc độ phát và lấy URL audio từ `mediaUrl` của Module.
3. **Hiển Thị Trực Quan Highlight Lỗi AI Đè Lên Văn Bản (Inline Annotation Overlay)**:
   - Trong `StudentSubmissionResult.tsx`, các lỗi sai về từ vựng, ngữ pháp cần được highlight trực quan đè lên chính xác vị trí ký tự (`startIndex`, `endIndex`) trả về từ AI Microservice thay vì chỉ liệt kê danh sách bên cạnh.
4. **Kiểm Thử Tự Động Giao Diện (Automated UI Tests)**:
   - Frontend hiện mới có bộ kiểm thử API service bằng Node test runner (`npm run test:api-services`).
   - Cần bổ sung kiểm thử Component React (Vitest + React Testing Library) và kiểm thử luồng người dùng E2E (Playwright).

---

## 4. Bảng Rà Soát Toàn Bộ 46 Trang Frontend Hiện Có (Cập nhật 16/10/2026)

| STT | Tên Tệp Page | Route URL | Vai trò | Trạng thái thực tế | Ghi chú tích hợp |
| :---: | :--- | :--- | :---: | :---: | :--- |
| 1 | `Login.tsx` | `/login` | Chung | ✅ Real API | Hoạt động tốt với Backend Auth JWT. |
| 2 | `ForgotPassword.tsx` | `/forgot-password` | Chung | ✅ Real API | Đã kết nối `authService.forgotPassword` & nhận OTP. |
| 3 | `ResetPassword.tsx` | `/reset-password` | Chung | ✅ Real API | Đã kết nối `authService.resetPassword`. |
| 4 | `NotFound.tsx` | `/404`, `*` | Chung | ✅ Real UI | Trang báo lỗi 404 chuẩn. |
| 5 | `Forbidden.tsx` | `/403`, `/unauthorized` | Chung | ✅ Real UI | Trang chặn quyền truy cập 403 chuẩn. |
| 6 | `Profile.tsx` | `/profile`, `/{role}/profile` | Chung | ✅ Real API | Tích hợp lấy và cập nhật thông tin qua `userService`. |
| 7 | `Settings.tsx` | `/settings`, `/{role}/settings` | Chung | ⚠️ Client State | Lưu cài đặt giao diện/ngôn ngữ client. |
| 8 | `Dashboard.tsx` | `/admin/dashboard` | Admin | ✅ Real API | Tích hợp `userService`, `classService`, `reportService.getOverview`. |
| 9 | `Accounts.tsx` | `/admin/accounts` | Admin | ✅ Real API | Tích hợp `useUsers` và `userService.listUsers`. |
| 10 | `Roles.tsx` | `/admin/roles` | Admin | 🟡 **Thừa** | Không cần quản lý vai trò động trong SRS. |
| 11 | `Classes.tsx` | `/admin/classes` | Admin | ✅ Real API | Tích hợp `classService.list`. |
| 12 | `AddClass.tsx` | `/admin/classes/create` | Admin | ✅ Real API | Tích hợp `classService.create` & `userService.listUsers`. |
| 13 | `ClassDetails.tsx` | `/admin/classes/:id` | Admin | ✅ Real API | Tích hợp `classService.getDetail`, `listMembers`, `assignmentService`. |
| 14 | `AdminClassArchive.tsx` | `/admin/classes/archive` | Admin | 🟡 **Thừa** | Tính năng lưu trữ lớp riêng vượt phạm vi SRS. |
| 15 | `Teachers.tsx` | `/admin/teachers` | Admin | ✅ Real API | Tích hợp `userService.listUsers({ role: 'TEACHER' })`. |
| 16 | `AddTeacher.tsx` | `/admin/teachers/create` | Admin | ✅ Real API | Tích hợp `userService.createUser` & `classService.list`. |
| 17 | `TeacherDetails.tsx` | `/admin/teachers/:id` | Admin | ✅ Real API | Tích hợp `userService.listUsers` & `classService.list`. |
| 18 | `Students.tsx` | `/admin/students` | Admin | ✅ Real API | Tích hợp `userService.listUsers({ role: 'STUDENT' })`. |
| 19 | `AddStudent.tsx` | `/admin/students/create` | Admin | ✅ Real API | Tích hợp `userService.createUser` & `classService.list`. |
| 20 | `StudentDetails.tsx` | `/admin/students/:id` | Admin | ✅ Real API | Tích hợp `userService`, `reportService`, `studentEvaluationService`. |
| 21 | `AdminReports.tsx` | `/admin/reports` | Admin | ✅ Real API | Tích hợp `reportService.getOverview`, `reportService.getClassesReport`. |
| 22 | `AdminGradingAuditLogs.tsx` | `/admin/audit/gradings` | Admin | ✅ Real API | Tích hợp `gradingService.listGradings`, `gradingChangeLogService`. |
| 23 | `AdminSettings.tsx` | `/admin/settings` | Admin | ⚠️ Client State | Cấu hình tham số hệ thống client. |
| 24 | `TeacherDashboard.tsx` | `/teacher/dashboard` | Teacher | ✅ Real API | Tích hợp `classService`, `assignmentService`, `submissionService`. |
| 25 | `TeacherClasses.tsx` | `/teacher/classes` | Teacher | ✅ Real API | Tích hợp `classService.list`, `assignmentService`, `submissionService`. |
| 26 | `TeacherClassProgress.tsx` | `/teacher/classes/:id` | Teacher | ✅ Real API | Tích hợp `classService`, `assignmentService`, `studentEvaluationService`. |
| 27 | `TeacherAssignments.tsx` | `/teacher/assignments` | Teacher | ✅ Real API | Tích hợp `classService`, `assignmentService` (publish, close). |
| 28 | `TeacherCreateAssignment.tsx` | `/teacher/assignments/create` | Teacher | ✅ Real API | Tích hợp tạo chuỗi Assignment -> Module -> Questions (`TASK-FE-20`). |
| 29 | `TeacherEditAssignment.tsx` | `/teacher/assignments/:id/edit` | Teacher | ⚠️ Cần hoàn thiện | Giao diện chỉnh sửa bài tập, cần nối thêm PUT API. |
| 30 | `TeacherAssignmentDetails.tsx` | `/teacher/assignments/:id` | Teacher | ✅ Real API | Tích hợp `classService`, `assignmentService`, `submissionService`. |
| 31 | `TeacherSubmissionDetails.tsx` | `/teacher/assignments/:id/submissions/:sId` | Teacher | ✅ Real API | Tích hợp `submissionService`, `gradingService.getAiSuggestion`, `updateFinalGrade`. |
| 32 | `TeacherExamBank.tsx` | `/teacher/exam-bank` | Teacher | 🟡 **Thừa** | Ngân hàng đề thi vượt phạm vi Core SRS. |
| 33 | `StudentDashboard.tsx` | `/student/dashboard` | Student | ✅ Real API | Tích hợp `classService`, `assignmentService`, `submissionService`, `reportService`. |
| 34 | `StudentClasses.tsx` | `/student/classes` | Student | ✅ Real API | Tích hợp `classService.list`. |
| 35 | `StudentClassDetails.tsx` | `/student/classes/:id` | Student | ✅ Real API | Tích hợp `classService.getDetail` & `studentEvaluationService`. |
| 36 | `StudentAssignments.tsx` | `/student/assignments` | Student | ✅ Real API | Tích hợp `assignmentService` & `submissionService`. |
| 37 | `StudentAssignmentOverview.tsx` | `/student/assignments/:id/overview` | Student | ✅ Real API | Hiển thị attempt number và max submissions. |
| 38 | `StudentAssignmentWriting.tsx` | `/student/assignments/:id` | Student | ✅ Real API | Tích hợp nộp essay và submission module. |
| 39 | `StudentAssignmentReading.tsx` | `/student/assignments/reading/:id` | Student | ✅ Real API | Tích hợp nộp đáp án trắc nghiệm bài đọc. |
| 40 | `StudentAssignmentListening.tsx`| `/student/assignments/listening/:id`| Student | ✅ Real API | Tích hợp nộp bài nghe (cần thêm audio player). |
| 41 | `StudentAssignmentSpeaking.tsx` | `/student/assignments/speaking/:id` | Student | ⚠️ Thiếu Audio S3 | Nộp submit thành công nhưng audio ghi âm đang mô phỏng. |
| 42 | `StudentSubmissionResult.tsx` | `/student/submissions/:id` | Student | ✅ Real API | Tích hợp hiển thị kết quả từ `gradingService`. |
| 43 | `StudentGrades.tsx` | `/student/grades` | Student | ✅ Real API | Tích hợp `submissionService`, `classService`, `reportService`. |
| 44 | `StudentAnalytics.tsx` | `/student/analytics` | Student | ✅ Real API | Tích hợp `reportService.getStudentProgress`, `submissionService`. |
| 45 | `StudentWorkspace.tsx` | `/student/workspace` | Student | 🟡 **Thừa** | Không gian nháp cá nhân ngoài phạm vi SRS. |
| 46 | `StudentFeedback.tsx` | `/student/feedback` | Student | 🟡 **Thừa** | Hòm thư trùng lặp với kết quả từng bài tập. |

---

## 5. Kế Hoạch Hành Động Khắc Phục (Action Plan)

### Đợt 1: Xây Dựng 2 Trang Trọng Yếu Còn Thiếu
- [ ] **Xây dựng `StudentAssignmentRunner.tsx` (P0)**: Bộ khung chạy bài thi đa kỹ năng (Multi-Module Runner) hỗ trợ làm tuần tự Nghe -> Đọc -> Viết -> Nói trong cùng một lượt thi.
- [ ] **Xây dựng `TeacherAnnotationReviewPanel.tsx` (P0)**: Bảng duyệt/sửa/bác bỏ gợi ý AI (`ACCEPTED` / `REJECTED`) trước khi gửi kết quả cho học sinh.

### Đợt 2: Hoàn Thiện Tương Tác Audio Thật & Inline Annotation
- [ ] Hiện thực hook ghi âm Web Audio thật và tải lên S3 bằng Presigned URL trong `StudentAssignmentSpeaking.tsx`.
- [ ] Tích hợp HTML5 audio player cho `StudentAssignmentListening.tsx`.
- [ ] Hiển thị highlight lỗi AI trực tiếp trên văn bản trong `StudentSubmissionResult.tsx`.

### Đợt 3: Kiểm Thử Tự Động & Tinh Gọn Điều Hướng
- [ ] Sửa redirect hardcode `/progress` và `/reports` trong `App.tsx`.
- [ ] Bổ sung kiểm thử Component React (Vitest + React Testing Library) và kiểm thử E2E (Playwright).
