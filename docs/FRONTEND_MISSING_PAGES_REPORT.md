# Báo Cáo Rà Soát Frontend & Danh Sách Các Trang Còn Thiếu (Frontend Gap Analysis)

> **Dự án**: EnglishHub — Hệ thống Quản lý & Chấm chữa bài tập Tiếng Anh Thông minh  
> **Ngày rà soát**: 20/09/2026  
> **Người thực hiện**: Hệ thống Phân tích Antigravity Agent  
> **Công nghệ**: React 19, TypeScript, Vite, React Router v6  
> **Cơ sở đối chiếu**: Toàn bộ mã nguồn Frontend + Toàn bộ CSDL Backend (PostgreSQL Schema V1 & V2, 17 bảng nghiệp vụ, JPA Entities, Seeders)

---

## 1. Tổng Quan Hiện Trạng Frontend

Hiện tại thư mục `frontend/src/pages/` đang có **25 tệp component trang**. Hệ thống đã triển khai khung cơ bản cho 3 phân hệ người dùng (Admin, Teacher, Student) cùng cơ chế xác thực giả lập (`AuthContext`, `ProtectedRoute`).

Tuy nhiên, qua rà soát chi tiết mã nguồn:
1. **Routing (`App.tsx`)**: Còn nhiều route trỏ vào component giả lập (`Dashboard` tái sử dụng, thẻ `<div>Coming Soon</div>`).
2. **Menu điều hướng (`Sidebar.tsx`)**: Nhiều nút menu có đường dẫn nhưng **hoàn toàn chưa được khai báo route và chưa có file page**.
3. **Luồng nghiệp vụ cốt lõi 4 kỹ năng**: Thiếu hẳn phân hệ làm bài **Speaking** (Ghi âm & Đánh giá phát âm AI), và thiếu màn hình **Xem kết quả / Feedback chi tiết cho Học viên**.
4. **Trang tiện ích & Xử lý lỗi**: Chưa có trang 404 (Not Found), 403 (Forbidden), Quên mật khẩu, và Hồ sơ/Cài đặt dùng chung cho Giảng viên & Học viên.

---

## 2. Bảng Thống Kê Chi Tiết Từng Phân Hệ (Phân Tích Ban Đầu)

### 2.1. Phân Hệ Học Viên (Student Portal) - 🚨 Mức Độ Ưu Tiên Cao Nhất

| STT | Tên trang đề xuất | Đường dẫn URL đề xuất | Trạng thái hiện tại | Lý do & Mô tả chức năng cần có | Mức độ ưu tiên |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Làm bài Nói (Speaking Assignment)**<br>`StudentAssignmentSpeaking.tsx` | `/student/assignments/speaking/:id` | ❌ **Chưa có** | **Core Feature của dự án**. Hiện đã có Listening, Reading, Writing nhưng thiếu Speaking. Cần UI: Thu âm trực tiếp (Microphone), đếm ngược thời gian chuẩn IELTS Speaking Part 1/2/3, Audio waveform, tải file ghi âm nộp bài và tích hợp AI đánh giá phát âm/ngữ điệu. | **P0 (Bắt buộc)** |
| 2 | **Xem kết quả bài nộp & Feedback chi tiết**<br>`StudentSubmissionResult.tsx` | `/student/assignments/:id/result`<br>hoặc `/student/submissions/:id` | ❌ **Chưa có** | Trong `StudentAssignments.tsx` có nút *"Xem Feedback & Bài chữa"* (`btnFeedback`) nhưng không có trang đích. Cần hiển thị: Điểm tổng, điểm 4 tiêu chí rubrics, bài làm được AI/GV highlight sửa lỗi (annotations) và lời phê. | **P0 (Bắt buộc)** |
| 3 | **Dashboard Học viên thực thụ**<br>`StudentDashboard.tsx` | `/student/dashboard` | ⚠️ **Đang là placeholder** (`<div>Student Dashboard (Coming Soon)</div>`) | Cần giao diện dashboard thực thụ: Số bài tập đến hạn gần nhất, lịch học tuần này, biểu đồ mục tiêu điểm số cá nhân, bài tập AI đề xuất rèn luyện thêm. | **P1 (Quan trọng)** |
| 4 | **Bảng điểm & Trạng thái học tập**<br>`StudentGrades.tsx` | `/student/grades` | ❌ **Chưa có** (Có trong Sidebar nhưng chưa có route/page) | Hiển thị bảng điểm tổng hợp tất cả các bài tập, bài thi định kỳ theo từng lớp học, tiến độ hoàn thành điều kiện qua môn/đạt chứng chỉ. | **P1 (Quan trọng)** |
| 5 | **Phân tích năng lực 4 Kỹ năng**<br>`StudentAnalytics.tsx` | `/student/analytics` | ❌ **Chưa có** (Có trong Sidebar nhưng chưa có route/page) | Biểu đồ Radar/Cột phân tích độ thuần thục 4 kỹ năng (Listening, Speaking, Reading, Writing), phát hiện điểm yếu (ví dụ: phát âm /s/ - /z/, ngữ pháp thì quá khứ) từ AI analytics. | **P1 (Quan trọng)** |
| 6 | **Không gian làm bài tập trung**<br>`StudentWorkspace.tsx` | `/student/workspace` | ❌ **Chưa có** (Có trong Sidebar nhưng chưa có route/page) | Nơi tổng hợp các bài tập đang làm dở (drafts), tài liệu ôn tập nhanh và ghi chú cá nhân của học viên. | **P2 (Trung bình)** |
| 7 | **Hộp thư Feedback & Lời phê**<br>`StudentFeedback.tsx` | `/student/feedback` | ❌ **Chưa có** (Có trong Sidebar nhưng chưa có route/page) | Tổng hợp danh sách tất cả phản hồi, lưu ý chỉnh sửa từ giáo viên và AI của toàn bộ các bài đã nộp. | **P2 (Trung bình)** |

---

### 2.2. Phân Hệ Giáo Viên (Teacher Portal)

| STT | Tên trang đề xuất | Đường dẫn URL đề xuất | Trạng thái hiện tại | Lý do & Mô tả chức năng cần có | Mức độ ưu tiên |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Dashboard Giáo viên**<br>`TeacherDashboard.tsx` | `/teacher/dashboard` | ❌ **Chưa có** (Hiện đang redirect thẳng vào `/teacher/classes`) | Trang tổng quan: Danh sách bài tập đang chờ chấm gấp (Pending Gradings), tỷ lệ học viên nộp bài đúng hạn, lịch dạy hôm nay, thông báo lớp học. | **P1 (Quan trọng)** |
| 2 | **Chi tiết & Quản lý lớp học (GV)**<br>`TeacherClassDetails.tsx` | `/teacher/classes/:id` | ⚠️ **Chưa hoàn thiện** (Nút click đang trỏ thẳng sang `/progress`) | Hiện tại click vào lớp học chỉ xem được tiến độ (`TeacherClassProgress`), thiếu trang trung tâm quản lý lớp: danh sách học viên, tài liệu môn học, thông báo chung, bài tập được gán riêng cho lớp. | **P1 (Quan trọng)** |
| 3 | **Chỉnh sửa bài tập đã giao**<br>`TeacherEditAssignment.tsx` | `/teacher/assignments/:id/edit` | ❌ **Chưa có** (Mới chỉ có `TeacherCreateAssignment.tsx`) | Cho phép giáo viên sửa đề bài, gia hạn deadline, thay đổi tài liệu đính kèm hoặc cấu hình lại tiêu chí chấm điểm AI. | **P1 (Quan trọng)** |
| 4 | **Kho đề thi & Bài tập mẫu**<br>`TeacherTemplateBank.tsx` | `/teacher/assignments/templates` | ❌ **Chưa có** (Có nút `btnTemplateBank` trên giao diện nhưng chưa có link) | Ngân hàng đề mẫu theo chuẩn IELTS/TOEIC để giáo viên import nhanh vào lớp thay vì phải tạo mới từ đầu. | **P2 (Trung bình)** |
| 5 | **Tổng quan tiến độ các lớp**<br>`TeacherProgressOverview.tsx` | `/teacher/progress` | ❌ **Sai lệch route** (Sidebar link `/progress` nhưng route chỉ có `classes/:id/progress`) | Cần một trang xem tổng thể tiến độ của tất cả các lớp mà giảng viên phụ trách trước khi đi sâu vào từng lớp. | **P2 (Trung bình)** |

---

### 2.3. Phân Hệ Quản Trị Viên (Admin Portal)

| STT | Tên trang đề xuất | Đường dẫn URL đề xuất | Trạng thái hiện tại | Lý do & Mô tả chức năng cần có | Mức độ ưu tiên |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Hồ sơ chi tiết Học viên**<br>`StudentDetails.tsx` | `/admin/students/:id` | ❌ **Chưa có** (Đã có `TeacherDetails.tsx` nhưng thiếu `StudentDetails`) | Trong `Students.tsx`, các nút *Sửa* và *Lịch sử* chưa có hành động. Cần trang xem hồ sơ chi tiết, lớp đã tham gia, lịch sử đóng học phí/kết quả học tập. | **P1 (Quan trọng)** |
| 2 | **Báo cáo & Thống kê chuyên sâu**<br>`AdminReports.tsx` | `/admin/reports` | ⚠️ **Đang map giả** vào `<Dashboard />` (Lệch cả link `/reports` ở Sidebar) | Cần trang báo cáo riêng biệt: Báo cáo hiệu chuẩn AI (`ai_calibration_report` trong database), tỷ lệ giáo viên sửa điểm AI, doanh thu, thống kê chất lượng đầu ra. | **P1 (Quan trọng)** |
| 3 | **Cài đặt hệ thống toàn cục**<br>`AdminSettings.tsx` | `/admin/settings` | ⚠️ **Đang map giả** vào `<Dashboard />` (Lệch cả link `/settings` ở Sidebar) | Cấu hình tham số hệ thống: Cấu hình API Key AI (OpenAI/Anthropic/Whisper), ngưỡng tự động duyệt điểm, cấu hình Mail thông báo, chính sách bảo mật. | **P1 (Quan trọng)** |
| 4 | **Nhật ký chỉnh sửa điểm & Kiểm toán**<br>`AdminAuditLogs.tsx` | `/admin/logs` | ❌ **Chưa có** | Quản lý bảng `grading_change_logs` (theo dõi việc sửa điểm giữa AI và Giáo viên nhằm đảm bảo tính minh bạch và chống gian lận). | **P2 (Trung bình)** |

---

### 2.4. Phân Hệ Xác Thực, Trang Dùng Chung & Điều Hướng Lỗi

| STT | Tên trang đề xuất | Đường dẫn URL đề xuất | Trạng thái hiện tại | Lý do & Mô tả chức năng cần có | Mức độ ưu tiên |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Hồ sơ cá nhân Giáo viên & Học viên**<br>`Profile.tsx` (dùng chung hoặc theo vai trò) | `/teacher/profile`<br>`/student/profile` | ❌ **Chưa phân bổ** (`Profile.tsx` chỉ có ở `/admin/accounts/profile`) | Giáo viên và Học viên không có trang cá nhân để xem thông tin, đổi avatar hoặc đổi mật khẩu tài khoản của mình. | **P1 (Quan trọng)** |
| 2 | **Cài đặt tài khoản cá nhân**<br>`Settings.tsx` | `/teacher/settings`<br>`/student/settings` | ❌ **Chưa có** (Click `/settings` ở chân Sidebar sẽ lỗi 404) | Cài đặt thông báo (email, push), ngôn ngữ ưu tiên, giao diện sáng/tối. | **P2 (Trung bình)** |
| 3 | **Quên / Đặt lại mật khẩu**<br>`ForgotPassword.tsx` | `/forgot-password` | ❌ **Chưa có** | Trên trang `Login.tsx` có link *"Quên mật khẩu?"* nhưng chưa có màn hình nhập email để nhận mã OTP/link reset mật khẩu. | **P1 (Quan trọng)** |
| 4 | **Trang lỗi 404 (Not Found)**<br>`NotFound.tsx` | `*` (Bắt tất cả URL không hợp lệ) | ❌ **Chưa có** (Hiện redirect về `/login` hoặc hiển thị trang trắng) | Thông báo người dùng trang không tồn tại kèm nút quay lại Trang chủ phù hợp với vai trò hiện tại. | **P1 (Quan trọng)** |
| 5 | **Trang lỗi 403 (Không có quyền truy cập)**<br>`Unauthorized.tsx` | `/403` hoặc hiển thị khi chặn quyền | ❌ **Chưa có** (Hiện tự động đá về `/` -> `/login`) | Khi học viên cố tình truy cập link `/admin/*` hoặc `/teacher/*`, cần hiển thị màn hình báo lỗi phân quyền rõ ràng thay vì đá văng phiên đăng nhập. | **P2 (Trung bình)** |

---

## 3. Các Trang & Module Bổ Sung Phát Hiện Qua Rà Soát Toàn Bộ Database Backend

> **Cơ sở rà soát**: `V1__init_schema.sql`, `V2__update_schema_to_v6.sql`, các thực thể JPA trong `com.english_hub.backend.*`, và 9 Seeder dữ liệu thực tế (`GradingMockDataSeeder`, `AnswerMockDataSeeder`, `AssignmentMockDataSeeder`, `MiscMockDataSeeder`, v.v.).

Dưới đây là các màn hình nghiệp vụ **bắt buộc phải có theo mô hình thực thể CSDL** nhưng hiện tại Frontend chưa được thiết kế:

### 3.1. Các Trang Bổ Sung Dành Cho Học Viên (Dựa Trên CSDL)

| STT | Tên trang / Component đề xuất | Đường dẫn URL | Căn cứ bảng / Cột CSDL | Nghiệp vụ chi tiết theo CSDL | Ưu tiên |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S1** | **Tổng quan bài tập & Lịch sử làm bài (Attempts)**<br>`StudentAssignmentOverview.tsx` | `/student/assignments/:id/overview` | `assignments.max_submissions`<br>`submissions.attempt_number`<br>`assignments.open_at`, `close_at` | Màn hình chuẩn bị trước khi vào thi: Hiển thị thời gian mở/đóng đề, số lần nộp cho phép (`max_submissions`), số lượt còn lại, danh sách điểm số các lần làm trước (`Attempt #1: 6.5`, `Attempt #2: 7.5`), và nút "Bắt đầu làm lần X". Hiện tại FE nhảy thẳng vào bài làm và không có khái niệm attempt! | **P0** |
| **S2** | **Bộ chạy bài thi Đa Kỹ Năng (Multi-Module Exam Runner)**<br>`StudentAssignmentRunner.tsx` | `/student/assignments/:id/take` | `modules.order_index`<br>`modules.skill`<br>`modules.instructions` | Trong CSDL, một `assignment` gồm nhiều `modules` tuần tự (VD: Module 1 Listening Quiz -> Module 2 Reading Quiz -> Module 3 Writing Essay -> Module 4 Speaking Recording). Hiện tại Frontend hardcode 3 trang riêng biệt, không có khung điều hướng chuyển tiếp giữa các module của một bài thi tổng hợp. | **P0** |
| **S3** | **Làm bài Viết lại câu (Sentence Rewrite Task)**<br>`StudentAssignmentRewrite.tsx` | `/student/assignments/rewrite/:id` | `module_task_type.REWRITE`<br>`questions.content`<br>`answers.content` | CSDL quy định 4 loại task: `QUIZ`, `REWRITE`, `RECORDING`, `ESSAY`. FE hiện chỉ có Essay dài và Quiz trắc nghiệm. Cần màn hình cho học viên làm bài tập biến đổi câu, viết lại câu theo cấu trúc ngữ pháp có so khớp gợi ý. | **P1** |
| **S4** | **Nhận xét & Đánh giá định kỳ của Giảng viên**<br>`StudentClassEvaluations.tsx` | `/student/classes/:id/evaluations` | Bảng `student_evaluations`<br>(`student_id`, `teacher_id`, `class_id`, `content`) | Học viên xem các nhận xét định kỳ (giữa kỳ, cuối kỳ, thái độ học tập, điểm tiến bộ) được giảng viên phụ trách lớp ghi nhận. | **P1** |
| **S5** | **Xem chi tiết bản ghi âm & Heatmap phát âm AI**<br>`StudentSpeakingDetailView.tsx` | `/student/assignments/:id/speaking-review` | `gradings.ai_transcript` (JSONB)<br>`answers.audio_storage_key`<br>`answer_annotations` | CSDL lưu `ai_transcript` dạng JSONB chứa mốc thời gian và điểm số từng từ. Cần giao diện trình phát audio đồng bộ highlight text (Karaoke-style) hiển thị các từ bị phát âm sai (/s/, /ed/, trọng âm sai) để học viên tự sửa lỗi. | **P1** |

---

### 3.2. Các Trang Bổ Sung Dành Cho Giáo Viên (Dựa Trên CSDL)

| STT | Tên trang / Component đề xuất | Đường dẫn URL | Căn cứ bảng / Cột CSDL | Nghiệp vụ chi tiết theo CSDL | Ưu tiên |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **T1** | **Quản lý Đánh giá Học viên theo Lớp**<br>`TeacherClassEvaluations.tsx` | `/teacher/classes/:id/evaluations` | Bảng `student_evaluations`<br>(`student_id`, `teacher_id`, `class_id`, `content`, `created_at`) | Giao diện dạng bảng để giảng viên viết nhận xét định kỳ, đánh giá thái độ và năng lực cho từng học viên trong lớp theo từng đợt học (hỗ trợ lưu nháp và xuất file PDF gửi phụ huynh). | **P1** |
| **T2** | **Cấu hình Câu hỏi & Prompt AI theo Module**<br>`TeacherAssignmentModulesBuilder.tsx` | `/teacher/assignments/:id/modules` | `modules.ai_instruction`<br>`modules.source_audio_storage_key`<br>`questions.correct_answer` | Giảng viên tải lên file audio nghe mẫu (`source_audio_storage_key`), nhập rubric chấm AI (`ai_instruction`), soạn đáp án câu hỏi (`correct_answer` dạng JSONB) cho từng module của bài tập. | **P1** |
| **T3** | **Báo cáo Phát hiện Đạo văn (Plagiarism Report)**<br>`TeacherPlagiarismReport.tsx` (hoặc Modal) | `/teacher/submissions/:id/plagiarism` | `gradings.is_plagiarism_flagged`<br>`gradings.plagiarism_score` | CSDL có cột `is_plagiarism_flagged` và `plagiarism_score`. Cần màn hình hiển thị tỷ lệ trùng lặp, highlight đoạn văn sao chép và các bài nộp bị trùng trong cùng lớp/khóa học. | **P1** |
| **T4** | **Lịch sử sửa điểm & Nhật ký can thiệp (Change Log)**<br>`TeacherGradingChangeLogView.tsx` | `/teacher/gradings/:id/changelog` | Bảng `grading_change_logs`<br>(`old_score`, `new_score`, `note`, `changed_at`) | Xem dòng thời gian thay đổi điểm: AI chấm bao nhiêu (`AI_GRADED`), giảng viên điều chỉnh thành bao nhiêu (`TEACHER_MANUAL`), kèm lý do điều chỉnh (`note`) theo đúng thiết kế CSDL. | **P2** |
| **T5** | **Bảng điều khiển Duyệt sửa lỗi AI (Annotation Review)**<br>`TeacherAnnotationReviewPanel.tsx` | `/teacher/submissions/:id/review-annotations` | `answer_annotations.review_status`<br>(`PENDING`, `ACCEPTED`, `REJECTED`) | CSDL thiết kế rõ cơ chế `review_status` cho từng lỗi AI gạch chân. Cần UI cho phép giáo viên bấm "Chấp nhận" (Accept) hoặc "Bác bỏ" (Reject) từng gợi ý sửa lỗi của AI trước khi gửi cho học sinh. | **P1** |
| **T6** | **Quản lý trạng thái đóng/mở bài tập thủ công**<br>`TeacherAssignmentControlModal.tsx` | Hành động trên `/teacher/assignments` | `assignments.status` (`DRAFT`, `PUBLISHED`, `CLOSED`)<br>`assignments.is_manually_closed` | Cho phép giáo viên bật/tắt thủ công việc nhận bài nộp (`is_manually_closed`), chuyển đổi trạng thái bản nháp sang công khai và gia hạn nộp bài muộn. | **P2** |

---

### 3.3. Các Trang Bổ Sung Dành Cho Quản Trị Viên (Dựa Trên CSDL)

| STT | Tên trang / Component đề xuất | Đường dẫn URL | Căn cứ bảng / Cột CSDL | Nghiệp vụ chi tiết theo CSDL | Ưu tiên |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A1** | **Báo cáo Hiệu chuẩn Chấm điểm AI (AI Calibration)**<br>`AdminAiCalibrationReport.tsx` | `/admin/reports/ai-calibration` | View `ai_calibration_report`<br>(`gradings` JOIN `submission_modules` JOIN `modules`) | Báo cáo bắt buộc theo tài liệu thiết kế CSDL: So sánh độ lệch giữa điểm gợi ý của AI và điểm chốt thực tế của Giáo viên để đánh giá độ chính xác của mô hình AI, tỷ lệ giáo viên phải sửa điểm theo từng kỹ năng. | **P1** |
| **A2** | **Nhật ký Kiểm toán Sửa điểm toàn hệ thống**<br>`AdminGradingAuditLogs.tsx` | `/admin/audit/gradings` | Bảng `grading_change_logs`<br>(`grading_id`, `changed_by`, `old_score`, `new_score`, `note`) | Giám sát chống gian lận thi cử: Theo dõi mọi lượt nâng/hạ điểm của giảng viên trên toàn trung tâm kèm lý do giải trình. | **P1** |
| **A3** | **Hồ sơ chi tiết Học viên đầy đủ trường CSDL**<br>`StudentDetails.tsx` (Mở rộng) | `/admin/students/:id` | Bảng `student_profiles`<br>(`student_code`, `date_of_birth`, `parent_phone`) | Hiển thị đầy đủ: Mã định danh (`student_code`), Ngày sinh, SĐT phụ huynh (`parent_phone`), lịch sử ghi danh lớp (`class_members`), danh sách bài nộp và bảng đánh giá định kỳ. | **P1** |
| **A4** | **Lưu trữ & Khôi phục Lớp học (Class Archive)**<br>`AdminClassArchive.tsx` | `/admin/classes/archive` | `classes.status`<br>(`COMPLETED`, `CANCELLED`) | Quản lý các lớp đã kết thúc hoặc bị hủy, phục vụ tra cứu học liệu cũ và kết quả cấp chứng chỉ. | **P2** |

---

### 3.4. Phân Hệ Bảo Mật & Quản Lý Phiên Đăng Nhập Dùng Chung

| STT | Tên trang đề xuất | Đường dẫn URL | Căn cứ bảng / Cột CSDL | Nghiệp vụ chi tiết theo CSDL | Ưu tiên |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **C1** | **Quản lý Thiết bị & Phiên Đăng Nhập (Active Sessions)**<br>`UserSessionsSecurity.tsx` | `/settings/sessions`<br>(hoặc tab trong Profile) | Bảng `refresh_tokens`<br>(`token_hash`, `expires_at`, `revoked_at`, `user_agent`, `ip_address`) | Cho phép người dùng (Admin, Teacher, Student) xem danh sách các thiết bị đang đăng nhập tài khoản của mình (Chrome Windows, iPhone Safari, IP, thời gian), và nút bấm "Đăng xuất khỏi thiết bị này" (`revoked_at`). | **P2** |

---

## 4. Tổng Hợp Các Lỗi Lệch Route Giữa Sidebar & App.tsx Cần Sửa Ngay

Bên cạnh việc thiếu file, hệ thống đang tồn tại sự bất đồng bộ giữa đường dẫn ở `Sidebar.tsx` và `App.tsx`:

1. **Menu Báo cáo Admin**:
   - `Sidebar.tsx`: `path: '/reports'`
   - `App.tsx`: lồng trong `/admin`, tương đương `/admin/reports`
   - *Hậu quả*: Nhấn vào menu không hiển thị active state và có thể bị lỗi routing.
2. **Menu Cài đặt Footer**:
   - `Sidebar.tsx`: `path: '/settings'`
   - `App.tsx`: chỉ có `/admin/settings`, Teacher và Student ấn vào sẽ bị redirect văng ra.
3. **Menu Tiến độ Teacher**:
   - `Sidebar.tsx`: `path: '/progress'`
   - `App.tsx`: chỉ có `/teacher/classes/:id/progress` (yêu cầu phải có `id` lớp cụ thể).
4. **Các menu Student trong Sidebar**:
   - `/student/workspace`, `/student/grades`, `/student/analytics`, `/student/feedback` đều đã được hiển thị trên thanh điều hướng nhưng **100% chưa có route đăng ký trong `App.tsx`**.
5. **Nút Back trong các trang làm bài học viên**:
   - Trong `StudentAssignmentReading.tsx` và `StudentAssignmentListening.tsx`, nút *"Quay lại danh sách bài tập"* chưa được gắn sự kiện `onClick={() => navigate('/student/assignments')}`.

---

## 5. Kế Hoạch Đề Xuất Thực Hiện Cho Frontend Dev (`@fe-primary`, `@fe-secondary`)

### Giai đoạn 1: Bổ sung các trang trọng yếu cho luồng Học viên & Sửa Router (Sprint 1)
- [ ] Tạo trang **`StudentAssignmentSpeaking.tsx`** và đăng ký route `/student/assignments/speaking/:id` (Ghi âm, waveform, timer, nộp file MP3).
- [ ] Tạo trang **`StudentSubmissionResult.tsx`** để học viên xem được bài chấm điểm, annotations highlight và nhận xét AI/GV.
- [ ] Tạo trang **`StudentAssignmentOverview.tsx`** (Quản lý lượt thi `attempt_number` và `max_submissions`).
- [ ] Thay thế thẻ div `Student Dashboard (Coming Soon)` bằng component **`StudentDashboard.tsx`**.
- [ ] Tạo component **`NotFound.tsx`** và bổ sung route `path="*"` vào `App.tsx`.
- [ ] Sửa lại các đường dẫn lệch chuẩn giữa `Sidebar.tsx` và `App.tsx` (`/reports`, `/settings`, `/progress`).

### Giai đoạn 2: Hoàn thiện hệ sinh thái học tập, Bài thi Đa kỹ năng & Đánh giá (Sprint 2)
- [ ] Xây dựng khung chạy bài thi tổng hợp **`StudentAssignmentRunner.tsx`** (hỗ trợ chuyển module tuần tự 4 kỹ năng).
- [ ] Xây dựng trang làm bài tập viết lại câu **`StudentAssignmentRewrite.tsx`** (`module_task_type.REWRITE`).
- [ ] Xây dựng **`StudentGrades.tsx`** (`/student/grades`) và **`StudentAnalytics.tsx`** (`/student/analytics`).
- [ ] Xây dựng trang nhận xét định kỳ **`TeacherClassEvaluations.tsx`** & **`StudentClassEvaluations.tsx`** (dựa trên bảng `student_evaluations`).
- [ ] Xây dựng **`StudentDetails.tsx`** (`/admin/students/:id`) với đầy đủ trường SĐT phụ huynh, ngày sinh, mã học viên.
- [ ] Xây dựng **`TeacherDashboard.tsx`** (`/teacher/dashboard`) và cập nhật redirect mặc định của giáo viên.
- [ ] Hoàn thiện liên kết trang chi tiết lớp học của giáo viên **`TeacherClassDetails.tsx`**.

### Giai đoạn 3: Bổ sung Báo cáo hệ thống, Kiểm toán AI & Tiện ích Quản trị (Sprint 3)
- [ ] Xây dựng **`AdminAiCalibrationReport.tsx`** (`/admin/reports/ai-calibration` dựa trên view `ai_calibration_report`).
- [ ] Xây dựng **`AdminGradingAuditLogs.tsx`** (`/admin/audit/gradings` dựa trên bảng `grading_change_logs`).
- [ ] Xây dựng **`AdminReports.tsx`** và **`AdminSettings.tsx`** độc lập (tách khỏi Dashboard).
- [ ] Xây dựng module phát hiện đạo văn **`TeacherPlagiarismReport.tsx`** (`is_plagiarism_flagged`, `plagiarism_score`).
- [ ] Xây dựng bảng điều khiển duyệt sửa lỗi AI **`TeacherAnnotationReviewPanel.tsx`** (`review_status.ACCEPTED/REJECTED`).
- [ ] Phân quyền lại trang **`Profile.tsx`** cho phép cả 3 vai trò truy cập cập nhật thông tin cá nhân.
- [ ] Xây dựng **`UserSessionsSecurity.tsx`** quản lý phiên đăng nhập (`refresh_tokens`).
- [ ] Xây dựng **`ForgotPassword.tsx`**.
- [ ] Xây dựng **`TeacherTemplateBank.tsx`**.
