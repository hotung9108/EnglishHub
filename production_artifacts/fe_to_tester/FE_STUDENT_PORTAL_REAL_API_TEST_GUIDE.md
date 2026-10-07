# Hướng Dẫn Kiểm Thử: Phân Hệ Học Viên (Student Portal Real API Test Guide)

> **Mã công việc**: `[FE-07]`, `[FE-08]`, `[FE-12]`, `[FE-13]`  
> **Người thực hiện**: `@fe-primary`  
> **Đối tượng bàn giao**: `@tester`  
> **Ngày bàn giao**: 07/10/2026  
> **Trạng thái**: Sẵn sàng kiểm thử (Ready for QA)  

---

## 1. Mục Tiêu Kiểm Thử
Xác nhận toàn bộ phân hệ Học viên (Student Portal) hoạt động trên nền dữ liệu và API Backend thực tế:
- Không còn bất kỳ màn hình nào hiển thị `"Coming Soon"` hay placeholder tĩnh.
- Xử lý đầy đủ 3 trạng thái: Đang tải (Skeleton Loading), Lỗi có nút Thử lại (Error with Retry), Dữ liệu rỗng (Empty State).
- Luồng End-to-End hoạt động thông suốt: **Chọn bài tập → Xem tổng quan (Overview) → Làm bài (Writing/Reading/Listening/Speaking) → Nộp bài (Submit) → Xem kết quả chấm & Annotations (Result)**.
- Theo dõi học tập: **Bảng điểm (Grades), Phân tích năng lực 4 kỹ năng (Analytics), Lớp học (Classes), Hòm thư nhận xét (Feedback), Không gian tự học (Workspace)**.

---

## 2. Các Endpoint Backend Đã Kết Nối

| STT | Phân hệ / Nghiệp vụ | Endpoint API | Phương thức | Dịch vụ Frontend |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Danh sách bài tập theo lớp | `/api/v1/classes/{classId}/assignments` | `GET` | `assignmentService.listAssignments` |
| 2 | Chi tiết đề bài tập | `/api/v1/assignments/{id}` | `GET` | `assignmentService.getAssignment` |
| 3 | Khởi tạo lượt làm bài mới | `/api/v1/assignments/{id}/submissions` | `POST` | `submissionService.startAttempt` |
| 4 | Danh sách lượt nộp bài | `/api/v1/submissions` | `GET` | `submissionService.listSubmissions` |
| 5 | Chi tiết bài nộp & modules | `/api/v1/submissions/{id}` | `GET` | `submissionService.getSubmission` |
| 6 | Nộp đáp án từng module | `/api/v1/submission-modules/{id}/submit` | `POST` | `submissionService.submitModule` |
| 7 | Chốt hoàn tất nộp bài thi | `/api/v1/submissions/{id}/submit` | `POST` | `submissionService.submitSubmission` |
| 8 | Lấy URL tải file ghi âm audio | `/api/v1/submission-modules/{id}/audio-upload-url` | `POST` | `submissionService.getAudioUploadUrl` |
| 9 | Lấy URL tải tài liệu đính kèm | `/api/v1/submission-modules/{id}/document-upload-url` | `POST` | `submissionService.getDocumentUploadUrl` |
| 10 | Chi tiết điểm & phản hồi chấm | `/api/v1/gradings/{id}` | `GET` | `gradingService.getById` |
| 11 | Gợi ý & Annotations từ AI | `/api/v1/submission-modules/{id}/ai-suggestion` | `GET` | `gradingService.getAiSuggestion` |
| 12 | Tiến độ & Phân tích 4 kỹ năng | `/api/v1/reports/students/{id}/progress` | `GET` | `reportService.getStudentProgress` |
| 13 | Đánh giá định kỳ của GV | `/api/v1/students/{id}/evaluations` | `GET` | `studentEvaluationService.list` |
| 14 | Danh sách lớp học đã ghi danh | `/api/v1/classes` | `GET` | `classService.list` |
| 15 | Chi tiết lớp học | `/api/v1/classes/{id}` | `GET` | `classService.getDetail` |

---

## 3. Các Kịch Bản Kiểm Thử Chi Tiết (Test Cases)

### Kịch bản 1: Luồng End-to-End Làm & Nộp bài Writing (TC-STD-01)
1. **Truy cập**: Đăng nhập tài khoản Học viên (`student@example.com` / `Student@123`).
2. **Chọn bài**: Vào `/student/assignments`, chọn bài tập Writing Task 2.
3. **Màn hình Overview**: Hệ thống mở `/student/assignments/:id/overview`:
   - Hiển thị số lượt nộp tối đa, số lượt còn lại, lịch sử các lần thi trước (`Attempt #1`, `Attempt #2`).
   - Bấm **"Bắt đầu làm bài"** hoặc **"Làm lại bài (Lượt X)"**.
4. **Màn hình Làm bài Writing**: Hệ thống chuyển đến `/student/assignments/:id`:
   - Đề bài và hướng dẫn module được load từ backend.
   - Nhập nội dung bài luận vào textarea: bộ đếm từ (Word counter) tăng theo thời gian thực.
   - Nháp được tự động lưu vào `localStorage`.
   - Bấm **"Nộp bài chấm điểm"**: modal xác nhận hiển thị.
5. **Nộp bài**:
   - Gọi `submissionService.submitModule` gửi nội dung bài viết.
   - Gọi `submissionService.submitSubmission` chốt trạng thái `SUBMITTED`.
6. **Xem kết quả**:
   - Hệ thống tự động chuyển tiếp đến `/student/assignments/:id/result`.
   - Hiển thị thông báo trạng thái bài nộp, điểm rubric, phản hồi từ giáo viên và trợ lý AI.

### Kịch bản 2: Luồng Làm bài Nói (Speaking Assignment) (TC-STD-02)
1. **Truy cập**: Mở bài tập Speaking tại `/student/assignments/speaking/:id`.
2. **Giao diện**:
   - Audio waveform, bộ đếm thời gian đếm ngược chuẩn IELTS Part 2 (02:00).
   - Nút **"Bắt đầu ghi âm"** kích hoạt microphone và timer.
   - Nút **"Dừng ghi âm"** và nút nghe lại bản thu (Audio playback).
   - Vùng ghi chú dàn ý (Outline notes).
3. **Nộp bài**: Bấm nộp bài, hệ thống tải file ghi âm lên storage và chuyển sang màn hình xem kết quả.

### Kịch bản 3: Luồng Làm bài Đọc & Nghe (Reading / Listening Quiz) (TC-STD-03)
1. **Truy cập**: `/student/assignments/reading/:id` hoặc `/student/assignments/listening/:id`.
2. **Nghiệp vụ**:
   - Đọc đoạn văn (Reading passage) chia 2 cột với bảng câu hỏi.
   - Trình phát audio kèm thanh tiến độ và tốc độ phát (Listening).
   - Chọn đáp án cho các câu hỏi trắc nghiệm (Multiple Choice).
   - Bấm **"Nộp bài"**: hệ thống chấm điểm tự động đối với các module trắc nghiệm.

### Kịch bản 4: Kiểm tra Bảng Điểm & Quy đổi IELTS Band (TC-STD-04)
1. **Truy cập**: `/student/grades`.
2. **Kiểm tra**:
   - Card KPI: Cumulative Overall Band (VD: Band 7.5), số bài đã có điểm, số bài đang chấm, tiến độ so với đầu kỳ.
   - Bảng danh sách bài tập: Tên bài, lớp, kỹ năng, ngày nộp, trọng số, điểm thô, quy đổi IELTS.
   - Bộ lọc: Lọc theo kỹ năng (Writing/Speaking/Reading/Listening), lọc theo Lớp học, ô tìm kiếm bài tập.
   - Nút **"Xuất Bảng Điểm (PDF)"**: gọi lệnh in `window.print()`.

### Kịch bản 5: Phân tích Năng lực 4 Kỹ năng (TC-STD-05)
1. **Truy cập**: `/student/analytics`.
2. **Kiểm tra**:
   - Hero banner: % chặng đường đến mục tiêu Band 7.5+, Overall hiện tại, Target, Percentile.
   - 4 Khối kỹ năng: Listening, Reading, Writing, Speaking hiển thị thanh tiến độ %, badge trạng thái (Vững chắc / Đang tiến bộ / Cần tập trung).
   - Trung tâm chẩn đoán AI: Phân tích điểm mạnh nổi bật nhất, lỗ hổng lớn nhất cần xử lý.
   - Nút hành động: **"Luyện tập ngay"** chuyển tiếp đến bài tập rèn luyện tương ứng.

### Kịch bản 6: Danh sách & Chi tiết Lớp học (TC-STD-06)
1. **Truy cập**: `/student/classes`.
   - Danh sách thẻ khóa học (active/completed) kèm giảng viên phụ trách, số lượng bài tập.
   - Bấm vào lớp học dẫn đến `/student/classes/:id`.
2. **Trang chi tiết lớp**:
   - Thông tin giảng viên, mã lớp.
   - Hộp thống kê: Chưa làm, Đang chờ chấm, Đã có điểm.
   - Danh sách bài tập của lớp với nút chuyển tiếp trực tiếp vào làm bài hoặc xem kết quả.

### Kịch bản 7: Hộp thư Feedback & Lời phê (TC-STD-07)
1. **Truy cập**: `/student/feedback`.
2. **Kiểm tra**:
   - Tab phân loại: Tất cả, Từ Giảng viên, Từ Trợ lý AI.
   - Hiển thị nhận xét định kỳ từ `studentEvaluationService` (`[BE-20]`) và nhận xét từng bài tập.
   - Khối điểm mạnh nổi bật (Key Strengths) và Gợi ý khắc phục (Targeted Improvement).

### Kịch bản 8: Không gian Tự học Workspace (TC-STD-08)
1. **Truy cập**: `/student/workspace`.
2. **Kiểm tra**:
   - **Tab Bản nháp**: Liệt kê các bài thi đang dở dang (`IN_PROGRESS`) và nháp đã lưu trong trình duyệt. Bấm "Tiếp tục làm bài" để mở đúng trang làm bài.
   - **Tab Sổ tay từ vựng & Ghi chú**: Thêm ghi chú mới (Vocabulary, Speaking, Grammar, General), sao chép (Copy), xóa ghi chú. Dữ liệu được lưu vĩnh viễn trong `localStorage`.
   - **Tab Thư viện tài liệu**: 4 bộ tài liệu luyện thi mẫu chuẩn IELTS.

---

## 4. Kết Quả Kiểm Tra Tự Động (Automated Checks)
- **Unit Tests**: `npm test` -> **71/71 tests PASS (100%)**.
- **Type Check & Bundle Build**: `npm run build` (`tsc -b && vite build`) -> **Thành công trong 1.37s, 0 lỗi, 0 cảnh báo type**.
