# Hướng Dẫn Kiểm Thử: Phân Hệ Giáo Viên (Teacher Portal Real API Test Guide)

> **Mã công việc**: `[FE-05]`, `[FE-10]`  
> **Người thực hiện**: `@fe-primary` (Git user: `Maloque18705`)  
> **Đối tượng bàn giao**: `@tester` (Git user: `Zawn-Tsu`)  
> **Ngày bàn giao**: 09/10/2026  
> **Trạng thái**: Sẵn sàng kiểm thử (Ready for QA)  

---

## 1. Mục Tiêu & Phạm Vi Kiểm Thử
Xác nhận toàn bộ các trang thuộc phân hệ **Giáo viên** (Teacher Portal) đã hoàn tất việc nối API thực tế, loại bỏ 100% dữ liệu mock/hardcoded fixtures, xử lý đầy đủ các trạng thái UI:
- **Loading state**: Spinner / skeleton loading khi tải dữ liệu.
- **Error state with retry**: Hiển thị thông báo lỗi rõ ràng và nút "Thử lại" / "Tải lại".
- **Empty state**: Giao diện trống thân thiện kèm nút hành động (Call To Action).

### Các trang trong phạm vi:
1. **Teacher Dashboard** (`/teacher/dashboard` - `TeacherDashboard.tsx`):
   - KPI thống kê lớp học, học viên, bài tập đang hoạt động, hàng đợi cần chấm điểm.
   - Hàng đợi chấm bài cần duyệt (`Pending Grading Submissions`).
   - Lọc nhanh theo 4 kỹ năng (Tất cả, Writing, Speaking, Reading, Listening).
   - Thống kê tiến độ các lớp học giáo viên phụ trách.
2. **Quản lý bài tập** (`/teacher/assignments` - `TeacherAssignments.tsx`):
   - Selector chọn lớp học động tải từ `classService.list()`.
   - Danh sách bài tập phân loại theo kỹ năng, hạn chót, tỷ lệ nộp bài, số bài chờ chấm.
   - Modal phân loại kỹ năng khi bấm "Giao bài tập mới".
3. **Soạn bài tập mới** (`/teacher/assignments/create` - `TeacherCreateAssignment.tsx`):
   - Tải danh sách lớp học động, tạo bài tập thực tế (`assignmentService.createAssignment()`), tạo module (`moduleService.createModule()`), xuất bản bài tập.
4. **Chỉnh sửa bài tập** (`/teacher/assignments/:id/edit` - `TeacherEditAssignment.tsx`):
   - Tải chi tiết bài tập & module từ backend, cập nhật tiêu đề, hạn nộp, hướng dẫn bài làm.
5. **Chi tiết bài tập & Danh sách học viên** (`/teacher/assignments/:id` - `TeacherAssignmentDetails.tsx`):
   - Tải danh sách học viên trong lớp từ `classService.listMembers()`.
   - Đối soát trạng thái nộp bài và kết quả chấm điểm thực tế từ `submissionService.listSubmissions()`.
   - Bộ lọc trạng thái: Tất cả, Đã nộp, Chưa nộp; Đã chấm, Chờ chấm.
6. **Studio chấm bài & AI Grading** (`/teacher/assignments/:id/submissions/:studentId` - `TeacherSubmissionDetails.tsx`):
   - Tải thông tin học viên, bài nộp, file đính kèm/nội dung bài làm.
   - Tải kết quả chấm điểm từ `gradingService.getBySubmissionModuleId()`.
   - Kết nối AI gợi ý chấm chữa từ `gradingService.getAiSuggestion()` và yêu cầu phân tích lại AI qua `gradingService.requestAiAnalysis()`.
   - Lưu bản nháp hoặc chốt điểm qua `gradingService.submitGrade()`.
7. **Quản lý danh sách lớp** (`/teacher/classes` - `TeacherClasses.tsx`):
   - Tải danh sách lớp thực tế của giáo viên từ `classService.list()`.
   - Thống kê sĩ số học viên, số lượng bài tập đang mở, tỷ lệ nộp bài trung bình.
   - Lọc theo kỳ học (Tất cả, Đang học, Đã kết thúc) và tìm kiếm theo tên/mã lớp.
8. **Sổ điểm & Tiến độ chi tiết lớp học** (`/teacher/classes/:id` & `/teacher/classes/:id/progress` - `TeacherClassProgress.tsx`):
   - Tab 1: Sổ điểm học viên (Gradebook) - Điểm danh, điểm trung bình, trạng thái học tập, gửi nhận xét trực tiếp cho học viên (`studentEvaluationService.create()`), xuất file Excel/CSV.
   - Tab 2: Danh sách bài tập của lớp (turnout nộp bài, trạng thái hạn nộp).
   - Tab 3: Phân tích 4 kỹ năng (Writing, Speaking, Reading, Listening) và danh sách cảnh báo học viên cần kèm cặp.
   - Tab 4: Lộ trình buổi học (Syllabus roadmap).
9. **Kho đề thi mẫu & Giao nhanh** (`/teacher/exam-bank` - `TeacherExamBank.tsx`, `QuickAssignModal.tsx`):
   - Kho đề 4 kỹ năng chuẩn Cambridge IELTS.
   - Modal giao nhanh tự động tải danh sách lớp từ `classService.list()`, khi xác nhận sẽ gọi `assignmentService.createAssignment()` + `moduleService.createModule()` để tạo bài tập thực tế trong cơ sở dữ liệu.

---

## 2. Danh Sách Endpoint Backend Đã Tích Hợp

| STT | Endpoint | Method | Dịch vụ Frontend | Mục đích sử dụng |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `/api/v1/classes` | `GET` | `classService.list` | Lấy danh sách lớp học của giáo viên |
| 2 | `/api/v1/classes/{id}` | `GET` | `classService.getDetail` | Lấy chi tiết thông tin lớp học |
| 3 | `/api/v1/classes/{id}/members` | `GET` | `classService.listMembers` | Lấy danh sách học viên trong lớp |
| 4 | `/api/v1/classes/{classId}/assignments` | `GET` | `assignmentService.listAssignments` | Danh sách bài tập của lớp |
| 5 | `/api/v1/classes/{classId}/assignments` | `POST` | `assignmentService.createAssignment` | Tạo bài tập mới cho lớp |
| 6 | `/api/v1/assignments/{id}` | `GET` | `assignmentService.getAssignment` | Lấy chi tiết đề bài tập |
| 7 | `/api/v1/assignments/{id}` | `PUT` | `assignmentService.updateAssignment` | Cập nhật thông tin bài tập |
| 8 | `/api/v1/assignments/{id}/status` | `PATCH` | `assignmentService.updateAssignmentStatus` | Cập nhật trạng thái bài tập (PUBLISHED, CLOSED) |
| 9 | `/api/v1/assignments/{id}/modules` | `GET` | `moduleService.listModules` | Lấy danh sách modules của bài tập |
| 10 | `/api/v1/assignments/{id}/modules` | `POST` | `moduleService.createModule` | Tạo module kỹ năng cho bài tập |
| 11 | `/api/v1/modules/{id}` | `GET` | `moduleService.getModule` | Lấy chi tiết đề module kỹ năng |
| 12 | `/api/v1/modules/{id}` | `PUT` | `moduleService.updateModule` | Cập nhật thông tin module |
| 13 | `/api/v1/submissions` | `GET` | `submissionService.listSubmissions` | Danh sách bài nộp của học viên |
| 14 | `/api/v1/submissions/{id}` | `GET` | `submissionService.getSubmission` | Lấy chi tiết lượt làm bài nộp |
| 15 | `/api/v1/submission-modules/{id}` | `GET` | `submissionService.getSubmissionModuleDetail` | Chi tiết nội dung làm bài của module |
| 16 | `/api/v1/submission-modules/{id}/grading` | `GET` | `gradingService.getBySubmissionModuleId` | Lấy kết quả chấm điểm của module |
| 17 | `/api/v1/submission-modules/{id}/grading/ai-suggestion` | `GET` | `gradingService.getAiSuggestion` | Lấy gợi ý chấm chữa và nhận xét của AI |
| 18 | `/api/v1/submission-modules/{id}/grading/ai-analyze` | `POST` | `gradingService.requestAiAnalysis` | Yêu cầu AI chấm và phân tích lại bài làm |
| 19 | `/api/v1/gradings/{id}` | `PUT` | `gradingService.submitGrade` | Lưu điểm số và phản hồi của giáo viên |
| 20 | `/api/v1/students/{id}/evaluations` | `POST` | `studentEvaluationService.create` | Tạo nhận xét/đánh giá học viên từ sổ điểm |

---

## 3. Kịch Bản Kiểm Thử Chi Tiết (Test Cases)

### Kịch bản 1: Luồng End-to-End Tạo bài tập -> Nộp bài -> Chấm điểm -> Sổ điểm (TC-TCH-E2E-01)
1. **Bước 1 (Giáo viên tạo bài tập)**:
   - Đăng nhập tài khoản Giáo viên (`teacher@example.com` / `Teacher@123`).
   - Vào `/teacher/assignments`, bấm **"Giao bài tập mới"**.
   - Chọn kỹ năng **Writing Task 1 & 2**.
   - Điền tiêu đề: `IELTS Writing Task 2: Artificial Intelligence Impacts`.
   - Chọn lớp học nhận bài từ dropdown (lấy từ API).
   - Chọn hạn chót nộp bài, điền đề bài và yêu cầu.
   - Bấm **"Xuất bản bài tập"**.
   - **Kỳ vọng**: Hệ thống tạo thành công bài tập trong DB, chuyển về trang quản lý bài tập với toast thông báo thành công.
2. **Bước 2 (Học viên nộp bài)**:
   - Đăng nhập tài khoản Học viên trong lớp được giao.
   - Vào `/student/assignments`, chọn bài tập vừa tạo.
   - Nhập bài luận Writing và bấm **"Nộp bài chấm điểm"**.
   - **Kỳ vọng**: Bài nộp được ghi nhận vào hệ thống với trạng thái `SUBMITTED`.
3. **Bước 3 (Giáo viên chấm bài & AI grading)**:
   - Quay lại tài khoản Giáo viên, vào `/teacher/dashboard` hoặc `/teacher/assignments/:id`.
   - Thấy học viên vừa nộp hiển thị ở danh sách **"Chờ chấm"**.
   - Bấm **"Chấm bài"** để vào Studio `/teacher/assignments/:id/submissions/:studentId`.
   - Hệ thống hiển thị bài viết của học viên, gợi ý điểm và nhận xét của AI.
   - Thử bấm **"Phân tích lại với AI"**: Spinner quay và kết quả chẩn đoán cập nhật.
   - Nhập điểm (ví dụ: `7.5`), sửa nhận xét, bấm **"Gửi kết quả"**.
   - **Kỳ vọng**: Điểm được lưu vào backend, trạng thái chuyển thành `GRADED`.
4. **Bước 4 (Xem sổ điểm lớp học)**:
   - Vào `/teacher/classes/:classId/progress` (Tab Sổ điểm & Học viên).
   - **Kỳ vọng**: Cột điểm trung bình và danh sách bài tập của học viên hiển thị điểm số vừa chấm chính xác.

---

### Kịch bản 2: Giao nhanh đề từ Kho Đề Thi Mẫu (TC-TCH-EXAMBANK-02)
1. Truy cập `/teacher/exam-bank`.
2. Lọc đề thi theo kỹ năng (Writing / Speaking / Reading / Listening).
3. Bấm **"Giao cho lớp"** tại một đề bất kỳ.
4. Modal mở ra: kiểm tra danh sách lớp trong dropdown được load từ API.
5. Chọn lớp, đặt hạn nộp, bấm **"Xác nhận giao bài"**.
6. **Kỳ vọng**: Modal hiển thị trạng thái đang xử lý (`Deploying...`), sau đó toast thành công hiển thị. Bài tập mới xuất hiện trong `/teacher/assignments` của lớp đó.

---

### Kịch bản 3: Xử lý trạng thái Loading / Error / Empty (TC-TCH-STATES-03)
1. **Empty State**:
   - Chọn một lớp học chưa có bài tập nào: Trang hiển thị icon thư mục trống kèm nút **"Giao bài tập mới ngay"**.
   - Tại trang danh sách lớp `/teacher/classes`, nếu tìm kiếm từ khóa không khớp: hiển thị thông báo "Không tìm thấy lớp học phù hợp".
2. **Error State & Retry**:
   - Tắt kết nối mạng hoặc chặn request API: Hệ thống hiển thị banner lỗi màu đỏ và nút **"Thử lại"**.
   - Bật lại mạng và bấm **"Thử lại"**: Dữ liệu tải lại bình thường.

---

## 4. Chi Tiết Rà Soát & Xóa Bỏ Dữ Liệu Mock (Mock Data Purge)
Toàn bộ các giá trị giả lập, hằng số hardcode, công thức tính toán nhân tạo đã được dọn sạch hoàn toàn:
- **`TeacherClassProgress.tsx`**:
  - Xóa bỏ fallback band điểm giả (`7.0`, `7.5`, `7.2`); hiển thị `0` hoặc `'—'` khi học viên chưa có bài làm được chấm.
  - Loại bỏ công thức chuyên cần nhân tạo `95 - (index % 5) * 5`; tính toán tỷ lệ chuyên cần/nộp bài thực tế từ số bài tập đã nộp so với tổng bài tập lớp.
  - Loại bỏ nhãn ngày giả (`'Hôm nay'`) và nhận xét tĩnh (`'Tham gia bài học tích cực...'`); tính toán ngày nộp bài gần nhất thực tế và thông tin nộp bài.
  - Xóa bỏ số liệu KPI cứng (`|| 85`, `'7.2'`, `onTimeRate = 92.5`); tính toán tỷ lệ hoàn thành, điểm TB, tỷ lệ đúng hạn từ dữ liệu submissions thực tế.
  - 4-Skill Analytics: Xóa bỏ các nhận xét Cambridge tĩnh (strengths, weaknesses, AI recommendation); sinh động dựa trên kết quả trung bình thực tế hoặc hiển thị thông báo rỗng khi lớp chưa có bài nộp được chấm.
  - Syllabus Lessons: Xóa bỏ `materialsCount: 3` hardcode.
- **`TeacherClasses.tsx`**:
  - Xóa bỏ điểm TB mặc định `7.2`; thay bằng `0` và hiển thị `'—'` khi lớp chưa có điểm.
  - Xóa bỏ phòng học và lịch cứng; sử dụng lịch và mô tả động từ lớp học.
- **`TeacherAssignments.tsx`**:
  - Xóa bỏ fallback sĩ số `20` học viên khi lỗi mạng hoặc chưa tải xong; thay bằng `0` và chặn lỗi chia cho 0 trong tính phần trăm nộp bài.
- **`TeacherEditAssignment.tsx`**:
  - Khởi tạo `turnoutStats` từ `{ total: 0, submitted: 0 }` thay vì `{ total: 24, submitted: 0 }`.
- **`TeacherSubmissionDetails.tsx`**:
  - Khởi tạo ô nhập điểm chính thức từ `''` thay vì mặc định `7.5`.
  - Tự động điền điểm gợi ý từ AI chỉ khi ô điểm đang trống.
- **`TeacherExamBank.tsx`**:
  - Tính toán động tổng số lượt giao bài (`totalDeploys`) và điểm đánh giá (`avgRating`) từ danh sách templates thay vì số liệu cứng `420+` và `4.9 / 5.0`.
- **`TeacherDashboard.tsx`**:
  - Xóa bỏ fallback band `7.0`, tỷ lệ nộp bài tĩnh `90, 88, 95, 94%`, tiến độ giả lập `65%`.
  - Tính toán động tỷ lệ nộp bài theo từng kỹ năng từ số submissions/assignments thực tế.
  - Hiển thị `'—'` khi kỹ năng chưa có dữ liệu điểm.

---

## 5. Báo Cáo Chất Lượng Mã Nguồn (Quality Gate)
- **Unit Test**: 73/73 tests passed (`pass 73, fail 0`).
- **TypeScript & Production Build**: `npm run build` (`tsc -b && vite build`) hoàn thành thành công, 0 lỗi biên dịch type hoặc bundle.
- **Linting & Code Quality**: `npm run lint` (`eslint .`) không có bất kỳ warning hoặc error nào; tuân thủ quy tắc React 19 / React Compiler.
- **Mock Data**: 0 hardcoded arrays / static fallback scores còn tồn tại trong phân hệ Giáo viên.
