# Báo Cáo Rà Soát Frontend, Danh Sách Trang Còn Thiếu & Các Thành Phần Dư Thừa (Frontend Gap & Redundancy Analysis)

> **Dự án**: EnglishHub — Hệ thống Quản lý & Chấm chữa bài tập Tiếng Anh Thông minh  
> **Ngày cập nhật**: 08/10/2026  
> **Người thực hiện**: Hệ thống Phân tích Antigravity Agent  
> **Công nghệ**: React 19, TypeScript, Vite, React Router v7, Axios Core Client  
> **Cơ sở đối chiếu**: Toàn bộ mã nguồn Frontend (46 pages) + Core SRS (`docs/core/01.SRS.md`) + Backend Spring Boot V6 + FastAPI AI Microservice (`ai-service`)

---

## 1. Tổng Quan Hiện Trạng Frontend

Qua các đợt phát triển gần nhất (`TASK-FE-08`, `TASK-FE-AXIOS-INTEGRATION`, `TASK-FE-TEACHER-DASHBOARD`, `TASK-FE-EXAM-BANK`, v.v.), thư mục `frontend/src/pages/` đã tăng từ 25 lên **46 tệp component trang**, phủ kín hầu hết các màn hình giao diện của 3 phân hệ (Admin, Teacher, Student).

Hệ thống đã đạt được những bước tiến quan trọng:
1. **Xác thực thật (Real Auth)**: Đã xóa cơ chế `MOCK_ACCOUNTS` trong `Login.tsx`. `AuthContext` đã kết nối với `POST /api/v1/auth/login`, quản lý JWT Access Token và Refresh Token qua `tokenStorage`, có Axios Interceptor tự động gắn Bearer Token và điều hướng khi hết hạn.
2. **Phân hệ Học viên đã kết nối API**: `StudentAssignments`, `StudentAssignmentWriting`, `StudentAssignmentSpeaking`, `StudentAssignmentReading`, `StudentAssignmentListening`, `StudentAssignmentOverview`, `StudentSubmissionResult` đã gọi các dịch vụ `assignmentService`, `moduleService`, `submissionService`, `gradingService`.
3. **Các trang tiện ích đã hoàn thành**: Đã có `NotFound.tsx` (404), `Forbidden.tsx` (403), `ForgotPassword.tsx`, `ResetPassword.tsx`, `Profile.tsx`, `Settings.tsx`.

Tuy nhiên, khi đối chiếu nghiêm ngặt với **Core SRS** và **Kiến trúc hệ thống**, dự án tồn tại cả **hai vấn đề lớn**:
- ⚠️ **Nhiều tính năng & trang bị xây THỪA** so với phạm vi tài liệu Core SRS.
- ❌ **Một số luồng kỹ thuật cốt lõi vẫn CÒN THIẾU** (nhiều trang dù có file UI nhưng vẫn chạy dữ liệu Mock nội bộ, thiếu luồng Web Audio tải file thật lên S3, thiếu Multi-module runner, thiếu bảng duyệt gợi ý AI cho giảng viên).

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
   - Route `/reports` redirect cứng về `/admin/reports` dù người dùng là giáo viên (trong khi giáo viên cũng có báo cáo tiến độ lớp).
2. **Trùng lặp đường dẫn (Duplicate Route Aliases)**:
   - Hai route cho cùng chức năng sửa bài: `/teacher/assignments/:id/edit` và `/teacher/assignments/edit/:id`.
   - Hai route cho cùng chức năng xem kết quả: `/student/assignments/:id/result` và `/student/submissions/:id`.
   - Hai route cho thông tin cá nhân Admin: `/admin/accounts/profile` và `/admin/profile`.
3. **Mã kiểm tra tính hợp lệ tiếng Việt quá mức (Over-engineered Fullname Validation)**:
   - Module `nameValidation.ts` với 7 bộ unit test phức tạp chỉ để kiểm tra họ tên người dùng, trong khi backend đã có chuẩn kiểm tra validation đơn giản.

---

## 3. ❌ MỤC CÁC TRANG & THÀNH PHẦN KỸ THUẬT CÒN THIẾU (Remaining Missing Gaps)

Mặc dù số lượng file `.tsx` đã tăng lên 46, việc kiểm tra mã nguồn cho thấy **nhiều trang chỉ là vỏ giao diện (UI Shell) với dữ liệu Mock tĩnh**, và **các luồng xử lý kỹ thuật quan trọng vẫn chưa được hiện thực**:

### 3.1. Các Trang Giao Diện Còn Thiếu Hoàn Toàn

| STT | Trang đề xuất | Đường dẫn URL | Lý do & Nghiệp vụ cốt lõi theo Core SRS | Mức độ ưu tiên |
| :---: | :--- | :--- | :--- | :---: |
| **M1** | **Bộ Chạy Bài Thi Đa Kỹ Năng Tuần Tự**<br>`StudentAssignmentRunner.tsx` | `/student/assignments/:id/take` | **Core Architecture Gap**: Theo thiết kế DB và Core SRS, một đề thi (Assignment) có thể bao gồm nhiều module kỹ năng tuần tự (VD: Module 1 Listening Quiz -> Module 2 Reading -> Module 3 Writing Essay -> Module 4 Speaking). Hiện tại Frontend chia tách thành 4 trang rời rạc, **thiếu khung điều hướng chuyển tiếp giữa các module** trong một phiên làm bài liên tục. | **P0 (Bắt buộc)** |
| **M2** | **Bảng Điều Khiển Duyệt Gợi Ý Sửa Lỗi AI Cho Giáo Viên**<br>`TeacherAnnotationReviewPanel.tsx` | `/teacher/submissions/:id/annotations` | **Core Use Case (UC25, UC26, UC27)**: Backend đã có API gợi ý AI (`GET /submission-modules/{id}/grading/ai-suggestion`) và bảng `answer_annotations` với trạng thái `PENDING`, `ACCEPTED`, `REJECTED`. Frontend **hoàn toàn chưa có giao diện** để giáo viên bấm Duyệt (Accept), Sửa (Edit) hoặc Bác bỏ (Reject) từng đoạn sửa lỗi của AI trước khi gửi điểm cho học sinh. | **P0 (Bắt buộc)** |
| **M3** | **Trang Làm Bài Tập Viết Lại Câu (Sentence Rewrite)**<br>`StudentAssignmentRewrite.tsx` | `/student/assignments/rewrite/:id` | Backend đã có `module_task_type.REWRITE` và Auto-grading engine so khớp đáp án điền từ/viết lại câu. Frontend hiện mới chỉ có Quiz trắc nghiệm và Essay viết dài, thiếu giao diện nhập câu viết lại và đối chiếu tức thì. | **P1 (Quan trọng)** |

### 3.2. Các Trang Có File Nhưng Vẫn Dùng Mock Data 100% (Chưa Kết Nối API Backend Thật)

| Phân hệ | Tên trang / File | Hiện trạng trong Code | Endpoints Backend cần tích hợp ngay |
| :--- | :--- | :--- | :--- |
| **Teacher** | `TeacherAssignments.tsx` | Dùng mảng hardcode `assignments: AssignmentItem[] = useMemo(...)` với 3 bài tập mẫu tĩnh. | `GET /api/v1/classes/{classId}/assignments`, `POST /api/v1/assignments/{id}/publish`, `POST /api/v1/assignments/{id}/close` |
| **Teacher** | `TeacherCreateAssignment.tsx` & `TeacherEditAssignment.tsx` | Lưu state vào bộ nhớ React và localStorage, không gửi dữ liệu về server. | `POST /api/v1/assignments`, `PUT /api/v1/assignments/{id}`, `POST /api/v1/assignments/{id}/modules` |
| **Teacher** | `TeacherSubmissionDetails.tsx` | Toàn bộ giao diện điểm số, lời phê, bài làm của học sinh (David Pham) là HTML tĩnh. | `GET /api/v1/submissions/{id}`, `GET /api/v1/submission-modules/{id}/grading/ai-suggestion`, `POST /api/v1/gradings/{id}/submit` |
| **Admin** | `Students.tsx` & `StudentDetails.tsx` | Mảng dữ liệu `studentsData: StudentDirectoryItem[]` tĩnh với học viên Alice Johnson, David Pham. | `GET /api/v1/students`, `POST /api/v1/students`, `GET /api/v1/students/{id}` |
| **Admin** | `Teachers.tsx` & `TeacherDetails.tsx` | Dữ liệu giáo viên hardcode trong file. | `GET /api/v1/teachers`, `POST /api/v1/teachers`, `GET /api/v1/teachers/{id}` |
| **Admin** | `Classes.tsx` & `ClassDetails.tsx` | Mảng dữ liệu các lớp `ENG-IELTS-6.5A`, `ENG-TOEIC-750` hardcode. | `GET /api/v1/classes`, `POST /api/v1/classes`, `GET /api/v1/classes/{id}/members` |
| **Admin** | `Accounts.tsx` | Danh sách tài khoản người dùng hiển thị tĩnh từ mảng code. | `GET /api/v1/users`, `PUT /api/v1/users/{id}/status` |
| **Admin** | `AdminReports.tsx` & `AdminGradingAuditLogs.tsx` | Báo cáo biểu đồ và bảng audit logs hiển thị dữ liệu mẫu. | `GET /api/v1/reports/*`, `GET /api/v1/grading-change-logs` |

### 3.3. Các Lỗ Hổng Kỹ Thuật Còn Thiếu Trong Các Trang Đã Kết Nối API

1. **Thiếu Luồng Ghi Âm Thật & Tải Lên S3 Bằng Presigned URL (`StudentAssignmentSpeaking.tsx`)**:
   - Hiện tại trang Speaking chỉ có đồng hồ bấm giờ giả (`setInterval`) và nút bật/tắt ghi âm ảo.
   - **Còn thiếu**: Tích hợp Web Audio API / `MediaRecorder` để ghi âm microphone thành file Blob (`audio/webm` hoặc `audio/wav`), gọi API `POST /api/v1/submission-modules/{id}/audio-upload-url` để lấy presigned PUT URL, và dùng `fetch(uploadUrl, { method: 'PUT', body: audioBlob })` đẩy file trực tiếp lên kho lưu trữ.
2. **Thiếu Tải Lên Tệp Tài Liệu Viết (`StudentAssignmentWriting.tsx`)**:
   - Hiện mới chỉ có ô nhập văn bản trực tiếp (textarea). Chưa hỗ trợ tải lên file luận bài viết dạng `.docx` hoặc `.pdf` qua presigned URL `document-upload-url`.
3. **Thiếu Hiển Thị Trực Quan Các Đoạn Highlight Sửa Lỗi AI (Interactive Annotations Display)**:
   - Trong `StudentSubmissionResult.tsx`, các lỗi sai về từ vựng, ngữ pháp chưa được highlight trực tiếp đè lên văn bản gốc theo chỉ mục ký tự (`startIndex`, `endIndex`) trả về từ AI Microservice.
4. **Thiếu Kiểm Thử Tự Động Giao Diện (Automated UI Tests)**:
   - Frontend hiện mới có bộ kiểm thử cho các file API service qua `tsx --test`.
   - **Hoàn toàn chưa có**: Kiểm thử Component React (Vitest + React Testing Library) và Kiểm thử luồng người dùng End-to-End (Playwright hoặc Cypress).

---

## 4. Bảng Rà Soát Toàn Bộ 46 Trang Frontend Hiện Có

Dưới đây là bảng phân loại trạng thái chi tiết của tất cả 46 trang hiện có trong `frontend/src/pages/`:

| STT | Tên Tệp Page | Route URL | Vai trò | Trạng thái hiện tại | Đánh giá |
| :---: | :--- | :--- | :---: | :---: | :--- |
| 1 | `Login.tsx` | `/login` | Chung | ✅ Real API | Hoạt động tốt với Backend Auth. |
| 2 | `ForgotPassword.tsx` | `/forgot-password` | Chung | ⚠️ UI Done | Form nhập email nhận OTP/reset link. |
| 3 | `ResetPassword.tsx` | `/reset-password` | Chung | ⚠️ UI Done | Form đặt lại mật khẩu mới. |
| 4 | `NotFound.tsx` | `/404`, `*` | Chung | ✅ Real UI | Trang báo lỗi 404 chuẩn. |
| 5 | `Forbidden.tsx` | `/403`, `/unauthorized` | Chung | ✅ Real UI | Trang chặn quyền truy cập 403. |
| 6 | `Profile.tsx` | `/profile`, `/{role}/profile` | Chung | ✅ Real API | Tích hợp lấy thông tin qua `userService`. |
| 7 | `Settings.tsx` | `/settings`, `/{role}/settings` | Chung | ⚠️ Semi-Mock | Lưu cài đặt giao diện/ngôn ngữ client. |
| 8 | `Dashboard.tsx` | `/admin/dashboard` | Admin | ⚠️ Mock Data | KPI và đồ thị tổng quan dùng số liệu mẫu. |
| 9 | `Accounts.tsx` | `/admin/accounts` | Admin | ⚠️ Mock Data | Chưa kết nối `userService.list`. |
| 10 | `Roles.tsx` | `/admin/roles` | Admin | 🟡 **Thừa** | Không cần quản lý vai trò động trong SRS. |
| 11 | `Classes.tsx` | `/admin/classes` | Admin | ⚠️ Mock Data | Danh sách lớp chưa gọi `classService.list`. |
| 12 | `AddClass.tsx` | `/admin/classes/create` | Admin | ⚠️ Mock Data | Form tạo lớp chưa gọi `classService.create`. |
| 13 | `ClassDetails.tsx` | `/admin/classes/:id` | Admin | ⚠️ Mock Data | Chưa gọi `classService.getDetail`. |
| 14 | `AdminClassArchive.tsx` | `/admin/classes/archive` | Admin | 🟡 **Thừa** | Tính năng lưu trữ lớp vượt phạm vi SRS. |
| 15 | `Teachers.tsx` | `/admin/teachers` | Admin | ⚠️ Mock Data | Chưa gọi API danh sách giáo viên. |
| 16 | `AddTeacher.tsx` | `/admin/teachers/create` | Admin | ⚠️ Mock Data | Chưa gọi API tạo giáo viên. |
| 17 | `TeacherDetails.tsx` | `/admin/teachers/:id` | Admin | ⚠️ Mock Data | Chưa gọi API chi tiết giáo viên. |
| 18 | `Students.tsx` | `/admin/students` | Admin | ⚠️ Mock Data | Chưa gọi API danh sách học viên. |
| 19 | `AddStudent.tsx` | `/admin/students/create` | Admin | ⚠️ Mock Data | Chưa gọi API tạo học viên. |
| 20 | `StudentDetails.tsx` | `/admin/students/:id` | Admin | ⚠️ Mock Data | Chưa gọi API chi tiết học viên. |
| 21 | `AdminReports.tsx` | `/admin/reports` | Admin | ⚠️ Mock Data | Chưa nối `reportService`. |
| 22 | `AdminGradingAuditLogs.tsx` | `/admin/audit/gradings` | Admin | ⚠️ Mock Data | Chưa nối `gradingChangeLogService`. |
| 23 | `AdminSettings.tsx` | `/admin/settings` | Admin | ⚠️ Mock Data | Cấu hình hệ thống mẫu. |
| 24 | `TeacherDashboard.tsx` | `/teacher/dashboard` | Teacher | ⚠️ Mock Data | Dashboard giáo viên dùng số liệu mẫu. |
| 25 | `TeacherClasses.tsx` | `/teacher/classes` | Teacher | ⚠️ Mock Data | Chưa lọc danh sách lớp theo Teacher ID. |
| 26 | `TeacherClassProgress.tsx` | `/teacher/classes/:id` | Teacher | ⚠️ Mock Data | Giao diện 4 tab rất đẹp nhưng dữ liệu mẫu. |
| 27 | `TeacherAssignments.tsx` | `/teacher/assignments` | Teacher | ⚠️ Mock Data | Mảng bài tập tĩnh, nút đóng/mở chưa gọi API. |
| 28 | `TeacherCreateAssignment.tsx` | `/teacher/assignments/create` | Teacher | ⚠️ Mock Data | Chưa gửi payload tạo bài lên server. |
| 29 | `TeacherEditAssignment.tsx` | `/teacher/assignments/:id/edit` | Teacher | ⚠️ Mock Data | Chưa gọi API cập nhật bài tập. |
| 30 | `TeacherAssignmentDetails.tsx` | `/teacher/assignments/:id` | Teacher | ⚠️ Mock Data | Chưa gọi API danh sách bài nộp của lớp. |
| 31 | `TeacherSubmissionDetails.tsx` | `/teacher/assignments/:id/submissions/:sId` | Teacher | ⚠️ Mock Data | **Điểm nghẽn**: Chưa nối màn chấm điểm & AI. |
| 32 | `TeacherExamBank.tsx` | `/teacher/exam-bank` | Teacher | 🟡 **Thừa** | Ngân hàng đề thi vượt phạm vi Core SRS. |
| 33 | `StudentDashboard.tsx` | `/student/dashboard` | Student | ⚠️ Semi-Mock | Dashboard học viên, cần gọi API tiến độ thật. |
| 34 | `StudentClasses.tsx` | `/student/classes` | Student | ✅ Real API | Đã gọi `classService.list`. |
| 35 | `StudentClassDetails.tsx` | `/student/classes/:id` | Student | ✅ Real API | Đã gọi `classService.getDetail` & evaluations. |
| 36 | `StudentAssignments.tsx` | `/student/assignments` | Student | ✅ Real API | Đã gọi `assignmentService` & `submissionService`. |
| 37 | `StudentAssignmentOverview.tsx` | `/student/assignments/:id/overview` | Student | ✅ Real API | Hiển thị attempt number và max submissions. |
| 38 | `StudentAssignmentWriting.tsx` | `/student/assignments/:id` | Student | ✅ Real API | Đã gọi nộp module và hoàn tất submission. |
| 39 | `StudentAssignmentReading.tsx` | `/student/assignments/reading/:id` | Student | ✅ Real API | Đã nộp mảng câu trả lời trắc nghiệm. |
| 40 | `StudentAssignmentListening.tsx`| `/student/assignments/listening/:id`| Student | ✅ Real API | Đã nộp đáp án bài nghe. |
| 41 | `StudentAssignmentSpeaking.tsx` | `/student/assignments/speaking/:id` | Student | ⚠️ Thiếu Audio S3 | Nộp submit thành công nhưng audio là giả lập. |
| 42 | `StudentSubmissionResult.tsx` | `/student/submissions/:id` | Student | ✅ Real API | Đã lấy dữ liệu từ `gradingService`. |
| 43 | `StudentGrades.tsx` | `/student/grades` | Student | ⚠️ Mock Data | Bảng điểm tổng hợp đang hiển thị tĩnh. |
| 44 | `StudentAnalytics.tsx` | `/student/analytics` | Student | ⚠️ Mock Data | Chưa gọi `reportService.getStudentProgress`. |
| 45 | `StudentWorkspace.tsx` | `/student/workspace` | Student | 🟡 **Thừa** | Không gian nháp cá nhân ngoài phạm vi SRS. |
| 46 | `StudentFeedback.tsx` | `/student/feedback` | Student | 🟡 **Thừa** | Hòm thư trùng lặp với kết quả từng bài tập. |

---

## 5. Kế Hoạch Hành Động Khắc Phục & Tinh Gọn (Action Plan)

### Đợt 1: Dọn Dẹp Thành Phần Thừa & Chuẩn Hóa Routing (Sprint Cleanup)
- [ ] **Tinh gọn menu Sidebar**: Ẩn các mục thừa (`TeacherExamBank`, `StudentWorkspace`, `StudentFeedback`, `AdminClassArchive`, `Roles`) khỏi Sidebar chính.
- [ ] **Sửa lỗi Router trong `App.tsx`**:
  - Bỏ redirect hardcode `/progress` về `ENG-IELTS-6.5A`. Thay bằng điều hướng động tới lớp đầu tiên của giáo viên hoặc trang danh sách lớp `/teacher/classes`.
  - Hợp nhất các route trùng lặp: Giữ chuẩn `/teacher/assignments/:id/edit`, `/student/submissions/:id`, `/profile`.

### Đợt 2: Xây Dựng 2 Trang Trọng Yếu Còn Thiếu (Sprint Core Missing)
- [ ] **Xây dựng `StudentAssignmentRunner.tsx` (P0)**: Bộ khung chạy bài thi đa kỹ năng (Multi-Module Runner) hỗ trợ làm tuần tự Nghe -> Đọc -> Viết -> Nói trong cùng một lượt thi.
- [ ] **Xây dựng `TeacherAnnotationReviewPanel.tsx` (P0)**: Bảng duyệt/sửa/bác bỏ gợi ý AI (`ACCEPTED` / `REJECTED`) trước khi gửi kết quả cho học sinh.

### Đợt 3: Thay Thế Dữ Liệu Mock Bằng Real API Cho Phân Hệ Giáo Viên & Quản Trị
- [ ] Kết nối `TeacherSubmissionDetails.tsx` với `gradingService.getAiSuggestion` và `gradingService.submitGrading`.
- [ ] Kết nối `TeacherAssignments.tsx` và `TeacherCreateAssignment.tsx` với `assignmentService`.
- [ ] Kết nối các trang Admin (`Students`, `Teachers`, `Classes`, `Accounts`) với `userService` và `classService`.
- [ ] Hiện thực hook ghi âm Web Audio thật và tải lên S3 bằng Presigned URL trong `StudentAssignmentSpeaking.tsx`.
