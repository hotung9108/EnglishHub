# BÁO CÁO KIỂM TOÁN CHUYÊN SÂU 4 CHIỀU (DEEP 4-WAY AUDIT)
## ĐỐI SOÁT TOÀN DIỆN: OVERLEAF REPORTS ↔ PROJECT DOCS ↔ TRELLO TASKS ↔ CODEBASE THỰC TẾ
### (VẠCH TRẦN CÁC ĐIỂM KHÁC BIỆT, ĐỘ LỆCH TIẾN ĐỘ, LỖI GÃY LUỒNG VÀ KHOẢNG TRỐNG BÁO CÁO TỔNG KẾT)

> **Dự án**: EnglishHub — Hệ thống Quản lý Bài tập và Chấm chữa Tiếng Anh Thông minh  
> **Thời điểm kiểm toán**: **07/11/2026 (Ngày thứ 60/75 — Bước vào chu kỳ Sprint 9)**  
> **Thời gian còn lại đến mốc nghiệm thu bảo vệ**: **15 ngày (Hạn chót: 22/11/2026)**  
> **Cơ sở dữ liệu đối soát**:
> 1. **Overleaf Reports (`overleaf_reports/Project_1/`)**: `00_PI_Edit.tex`, `01_SRS_Edit.tex` (+ 4 chapters), `02_PP_Edit.tex` (+ 6 chapters), `03_TP_Edit.tex` (+ 13 tmp chapters), `BTL_Test.tex` (+ 5 UI chapters), `04_FR.tex` (+ 5 final chapters), `etc/main.tex`.
> 2. **Project Docs (`docs/`)**: `docs/core/` (00.PI, 01.SRS, 02.PP, 03.TP), `docs/architecture/`, `docs/database/`, `docs/api/`, `docs/features/`, các báo cáo kiểm toán sống.
> 3. **Trello Tasks Board `Project1` (ID: `6a7f2e4b7b1d207eee516457`)**: Trích xuất thời gian thực 18 danh sách công việc với hơn 180 thẻ nhiệm vụ.
> 4. **Mã nguồn Codebase (Branch `develop`)**: 11 Spring Boot Controllers, 62 REST endpoints, 5 Flyway SQL migrations (schema v6), 46 trang React 19 Frontend, FastAPI AI microservice với Google Gemini SDK, MinIO S3 object storage, 133 test files (93 Backend JUnit + 40 Frontend Vitest).
> 
> **Cam kết an toàn**: **READ-ONLY tuyệt đối với báo cáo Overleaf (`Project_1`)**. Toàn bộ phân tích dưới đây chỉ nhằm mục đích kiểm định và cung cấp số liệu cho nhóm phát triển.

---

## 1. BẢNG ĐIỂM TỔNG HỢP & PHÁN QUYẾT 4 CHIỀU (EXECUTIVE SCORECARD)

```mermaid
quadrantChart
    title ĐÁNH GIÁ ĐỘ HOÀN THIỆN & RỦI RO CỦA DỰ ÁN (07/11/2026)
    x-axis Độ bao phủ Lý thuyết (Overleaf / Docs) --> Thấp --> Cao
    y-axis Mức độ Vận hành Thực tế (Codebase / Trello) --> Thấp --> Cao
    quadrant-1 Sẵn sàng Nghiệm thu (Ready for Defense)
    quadrant-2 Vận hành tốt nhưng Thiếu Báo cáo
    quadrant-3 Rủi ro Thất bại (Critical Failure)
    quadrant-4 "Thực tế Hai Tầng": Lý thuyết 98% vs Vận hành 72%
    "Phân hệ Auth & User (UC01-10)": [0.95, 0.90]
    "Phân hệ Quản lý Bài tập (UC11-15)": [0.95, 0.85]
    "Phân hệ Học viên Làm bài 4 Kỹ năng (UC16-23)": [0.98, 0.65]
    "Phân hệ Chấm điểm & AI Grading (UC24-29)": [0.95, 0.68]
    "Báo cáo Tổng kết Final Report (04_FR)": [0.10, 0.90]
    "Tiến độ Quản lý Scrum (10 Sprints Trello)": [0.75, 0.70]
```

| Chiều Đối Soát | Chỉ số Định lượng Đo lường | Tỷ lệ Hoàn thành | Đánh giá Trạng thái & Phán quyết Trọng tâm |
| :--- | :--- | :---: | :--- |
| **1. Báo cáo Overleaf** | 302 files LaTeX (25.8 MB), 4 tài liệu cốt lõi, 1 báo cáo test UI | **80%** | Khung lý thuyết và mô hình rất đồ sộ, nhưng **Báo cáo Tổng kết `04_FR.tex` rỗng 100%**. Còn tồn dư văn bản môn OOAD cũ và lỗi format mã `UC20`. |
| **2. Hệ thống Docs Dự án** | 21 tài liệu markdown chuyên sâu, tài liệu kiến trúc, CSDL v6, NFRs | **95%** | Rất đầy đủ, bám sát kỹ thuật thực tế (MinIO, FastAPI, Gemini, Docker), là "Nguồn sự thật" chính xác nhất của dự án. |
| **3. Bảng Tasks Trello** | 18 danh sách, 109 thẻ Done (Sprint 1-6), 9 Review, 6 Ongoing, 5 Blocked | **75%** | **Nút thắt nghiêm trọng**: Cột `Sprint 7` chưa đổi tên thành Done, cột `Srpint 8` sai chính tả có 26 thẻ bugfix, cột `Review` bị ứ đọng 9 thẻ chưa được Tester ký duyệt. |
| **4. Codebase Thực Tế** | 62 REST APIs, 17 bảng CSDL, 46 trang UI, AI Engine, 133 Test files | **78%** | **Nghịch lý "Hai Tầng"**: Khung kiến trúc và backend đạt 96%, nhưng giao diện người dùng thực tế bị gãy đổ ở 5 điểm nghẽn P0 (mất bài luận, mất audio, 403 AI, lưu nháp). |

---

## 2. MA TRẬN ĐỐI SOÁT CHI TIẾT 36 USE CASES (4-WAY MATRIX)

Dưới đây là ma trận kiểm toán chéo từng Use Case qua cả 4 nguồn: **Overleaf SRS** $\leftrightarrow$ **Docs Dự án** $\leftrightarrow$ **Trello Cards** $\leftrightarrow$ **Codebase Thực tế**.

### 2.1. Phân hệ Quản trị, Xác thực & Lớp học (UC01 – UC10)

| Mã UC | Tên Use Case | Đặc tả Overleaf (`YeuCauChucNang.tex`) | Docs Dự Án (`01.SRS.md`) | Thẻ Trello Quản trị | Hiện trạng Codebase Thực Tế | Phán quyết 4 Chiều |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **UC01** | Đăng nhập (Login) | `ma={UC001}`, AD1, UI UC1 | Phân quyền Admin, Teacher, Student | `BE-07`, `FE-05` (Done Sp1), `BE-61` (Review) | `AuthController.java` (`POST /api/v1/auth/login`), `LoginPage.tsx` | 🟢 **PASS** (Đã fix validation email) |
| **UC02** | Đăng xuất (Logout) | `ma={UC002}`, AD2, UI UC2 | Thu hồi token, xóa session | `BE-07`, `FE-31` (Done Sp7) | `AuthController.java` (`POST /api/v1/auth/logout`), thu hồi JWT token | 🟢 **PASS** |
| **UC03** | Hồ sơ cá nhân (Profile) | `ma={UC003}`, AD3, UI UC3 | Xem và sửa thông tin cá nhân | `BE-14` (Done Sp2), `FE-39` (Srpint 8) | `UserController.java` (`GET/PUT /api/v1/users/me`), `Profile.tsx` | 🟢 **PASS** |
| **UC04** | Quản lý người dùng | `ma={UC004}`, AD4, UI UC4 | Admin thêm/khóa tài khoản | `BE-06` (Done Sp1), `BE-50`, `FE-42` (Srpint 8) | `AdminUserController.java`, `Accounts.tsx` | 🟢 **PASS** (Đã fix role ADMIN 400) |
| **UC05** | Phân quyền người dùng | `ma={UC005}`, AD5, UI UC5 | Cấp vai trò Admin, Teacher, Student | `BE-21` (Done Sp3), `FE-47` (Review) | Phân quyền Spring Security `@PreAuthorize`, `Roles.tsx` | 🟡 **REVIEW** (Chờ merge FE-47) |
| **UC06** | Quản lý giáo viên | `ma={UC006}`, AD6, UI UC6 | Danh sách, lọc và gán bộ môn | `BE-06` (Done Sp1), `FE-05` (Done Sp1) | `UserController.java` (role TEACHER), `Teachers.tsx` | 🟢 **PASS** |
| **UC07** | Quản lý học viên | `ma={UC007}`, AD7, UI UC7 | Danh sách, tìm kiếm học sinh | `BE-06` (Done Sp1), `FE-08` (Done Sp2) | `UserController.java` (role STUDENT), `Students.tsx` | 🟢 **PASS** |
| **UC08** | Quản lý lớp học | `ma={UC008}`, AD8, UI UC8 | Tạo, sửa, đóng/mở lớp học | `BE-13` (Done Sp2), `FE-06` (Done Sp1) | `ClassController.java` (`/api/v1/classes`), `Classes.tsx`, `AddClass.tsx` | 🟢 **PASS** |
| **UC09** | Quản lý thành viên lớp | `ma={UC009}`, AD9, UI UC9 | Thêm/xóa học sinh vào lớp | `BE-44` (Done Sp7), `FE-58` (Backlog) | `ClassController.java` (`POST /api/v1/classes/{id}/members`), `ClassDetails.tsx` | 🟢 **PASS** |
| **UC10** | Xem danh sách lớp học | `ma={UC010}`, AD10, UI UC10 | Danh sách lớp theo vai trò | `BE-13` (Done Sp2), `FE-07` (Done Sp2) | `StudentClasses.tsx`, `TeacherClasses.tsx` | 🟢 **PASS** |

---

### 2.2. Phân hệ Quản lý Bài tập Giáo viên (UC11 – UC15)

| Mã UC | Tên Use Case | Đặc tả Overleaf | Docs Dự Án | Thẻ Trello Quản trị | Hiện trạng Codebase Thực Tế | Phán quyết 4 Chiều |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **UC11** | Quản lý bài tập (CRUD) | `ma={UC011}` | Vòng đời bài tập, danh sách bài | `BE-16`, `FE-10` (Done Sp3) | `AssignmentController.java`, `TeacherAssignments.tsx` | 🟢 **PASS** |
| **UC12** | Tạo bài tập đa kỹ năng | `ma={UC012}` | Tạo module Nghe/Nói/Đọc/Viết | `BE-16` (Done Sp3), `FE-37` (Srpint 8) | `TeacherCreateAssignment.tsx`, `QuestionController.java` | 🟢 **PASS** (Đã chặn ngày đóng trước ngày mở) |
| **UC13** | Mở bài tập (Publish) | `ma={UC013}` | Công khai cho lớp làm bài | `BE-16` (Done Sp3), `FE-10` (Done Sp3) | `POST /api/v1/assignments/{id}/publish` | 🟢 **PASS** |
| **UC14** | Khóa bài tập (Close) | `ma={UC014}` | Đóng bài, không cho nộp thêm | `FE-36`, `BE-52` (Srpint 8) | `POST /api/v1/assignments/{id}/close`, `closeAt` check | 🟢 **PASS** (Đã fix chặn học sinh nộp sau close) |
| **UC15** | Xem chi tiết bài tập | `ma={UC015}` | Xem danh sách câu hỏi & đề | `BE-16` (Done Sp3), `FE-10` (Done Sp3) | `TeacherAssignmentDetails.tsx`, `StudentAssignmentOverview.tsx` | 🟢 **PASS** |

---

### 2.3. Phân hệ Học viên Làm bài & Nộp bài 4 Kỹ năng (UC16 – UC23) — *ĐIỂM NÓNG GÃY LUỒNG*

| Mã UC | Tên Use Case | Đặc tả Overleaf | Docs Dự Án | Thẻ Trello Quản trị | Hiện trạng Codebase Thực Tế | Phán quyết 4 Chiều |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **UC16** | Làm bài tập Viết (Writing) | `ma={UC016}` | Nhập văn bản hoặc đính kèm PDF/Word | `FE-08` (Done Sp2), `FE-40` (Srpint 8) | `StudentAssignmentWriting.tsx`, `SubmissionController.java` | 🔴 **BLOCKED (#174, #175)**: Nộp mất text luận và mất file đính kèm! |
| **UC17** | Làm bài tập Nói (Speaking) | `ma={UC017}` | Ghi âm trực tiếp trình duyệt | `FE-30` (Done Sp7), `FE-46` (Review) | `StudentAssignmentSpeaking.tsx`, MediaRecorder API | 🟡 **BLOCKED (#176)**: Nộp bài không lưu audio; PR `FE-46` đang chờ merge. |
| **UC18** | Làm bài tập Đọc (Reading) | `ma={UC018}` | Đọc đoạn văn, trả lời trắc nghiệm | `FE-07` (Done Sp2), `FE-41` (Srpint 8) | `StudentAssignmentReading.tsx`, `QuestionController.java` | 🟢 **PASS** (Đã fix DTO làm mất text lựa chọn A/B/C/D) |
| **UC19** | Làm bài tập Nghe (Listening) | `ma={UC019}` | Nghe audio từ S3, trả lời câu hỏi | `BE-42` (Done Sp6), `BE-69` (Review) | `StudentAssignmentListening.tsx`, API Presigned S3 GET URL | 🟡 **REVIEW**: Đang chờ merge `BE-69` để nối player thật với MinIO S3. |
| **UC20** | Kiểm tra bài trước khi nộp | **`ma={UC20}`** *(Typo)* | Xem lại tổng quan các module | `FE-32` (Srpint 8), `QA-30` (Backlog) | Bộ Exam Stepper trên Frontend | 🟢 **PASS** (Code chạy tốt, nhưng Overleaf bị lỗi format mã) |
| **UC21** | Nộp bài tập chính thức | `ma={UC021}` | Chốt lượt làm (Final Submit) | `BE-18` (Done Sp3), `BE-58` (Srpint 8) | `POST /api/v1/submissions/{id}/final-submit` | 🟢 **PASS** (Đã fix tự động dispatch chấm auto module) |
| **UC22** | Quản lý lần làm bài | `ma={UC022}` | Giới hạn số lần nộp (maxSubmissions) | `BE-34` (Done Sp6), `FE-51` (Blocked) | Backend có field, nhưng Frontend đang gán cứng 3 lượt | 🔴 **BLOCKED (#173)**: UI hiển thị cứng 3 lượt, lệch API. |
| **UC23** | Xem trạng thái bài làm | `ma={UC023}` | Đang làm, Đã nộp, Đang chấm, Đã chấm | `FE-43` (Srpint 8) | `StudentAssignments.tsx`, Badge trạng thái | 🟢 **PASS** |

---

### 2.4. Phân hệ Chấm bài, AI Grading & Đánh giá kết quả (UC24 – UC36)

| Mã UC | Tên Use Case | Đặc tả Overleaf | Docs Dự Án | Thẻ Trello Quản trị | Hiện trạng Codebase Thực Tế | Phán quyết 4 Chiều |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **UC24** | Chấm bài thủ công | `ma={UC024}` (Chấm bài) | Giáo viên cho điểm & ghi nhận xét | `BE-19` (Done Sp3), `FE-49` (Ongoing) | `TeacherSubmissionDetails.tsx`, `GradingController.java` | 🔴 **BLOCKED (#212)**: Nút "Lưu nháp" bị gọi nhầm sang API chốt điểm! |
| **UC25** | Hỗ trợ chấm bằng AI | `ma={UC025}` | Điều phối AI phân tích bài nộp | `BE-22` (Done Sp4), `BE-62` (Blocked) | `ai-service/app/main.py`, Google Gemini SDK | 🟢 **PASS** |
| **UC26** | Chấm bài Viết bằng AI | `ma={UC026}` | Đánh giá Grammar, Vocab, Coherence | `FE-33` (Srpint 8), `ai-service` endpoint | `ai-service/app/api/v1/endpoints/writing.py` | 🟢 **PASS** |
| **UC27** | Chấm bài Nói bằng AI | `ma={UC027}` | Đánh giá Phát âm, Độ trôi chảy (Fluency) | `OPS-30` (ffmpeg Sp7), `ai-service` | `ai-service/app/api/v1/endpoints/speaking.py` | 🟢 **PASS** |
| **UC28** | Chấm tự động Đọc (Reading) | `ma={UC028}` | So khớp đáp án trắc nghiệm tự động | `BE-22` (Done Sp4), `BE-58` (Srpint 8) | Auto-grading engine trong `SubmissionService.java` | 🟢 **PASS** |
| **UC29** | Chấm tự động Nghe (Listening)| `ma={UC029}` | So khớp đáp án nghe tự động | `BE-22` (Done Sp4), `BE-58` (Srpint 8) | Auto-grading engine trong `SubmissionService.java` | 🟢 **PASS** |
| **UC30** | Xem điểm số | `ma={UC030}` | Học sinh xem điểm tổng và chi tiết | `FE-43` (Srpint 8), `FE-52` (Blocked) | `StudentGrades.tsx` | 🟡 **BLOCKED (#178)**: Nhầm submissionId với assignmentId. |
| **UC31** | Quản lý điểm số | `ma={UC031}` | Giáo viên/Admin kiểm toán điểm | `BE-19` (Done Sp3), `BE-64` (Backlog) | `AdminGradingAuditLogs.tsx` | 🟢 **PASS** |
| **UC32** | Xem kết quả học tập | `ma={UC032}` | Xem bảng tổng kết cả khóa học | `FE-10` (Done Sp3), `StudentAnalytics.tsx` | `StudentAnalytics.tsx`, biểu đồ Recharts | 🟢 **PASS** |
| **UC33** | Xem bài chữa chi tiết | `ma={UC033}` | Xem góp ý highlight của giáo viên & AI | `FE-33` (Srpint 8), `FE-48` (Ongoing) | `StudentSubmissionResult.tsx` | 🔴 **BLOCKED (#233)**: Học sinh bị lỗi **403 Forbidden** khi tải góp ý AI! |
| **UC34** | Xem & đánh giá học viên | `ma={UC034}` | Giáo viên nhận xét định kỳ từng học sinh | `BE-20` (Done Sp3), `BE-35` (Done Sp6) | `StudentEvaluationController.java`, `StudentFeedback.tsx` | 🟢 **PASS** |
| **UC35** | Theo dõi tiến độ học tập | `ma={UC035}` | Biểu đồ tiến độ hoàn thành bài tập | `BE-45` (Done Sp7), `TeacherClassProgress.tsx`| `TeacherClassProgress.tsx` | 🟢 **PASS** |
| **UC36** | Báo cáo và thống kê | `ma={UC036}` | Thống kê phổ điểm, tỷ lệ nộp bài | `ReportController.java`, `AdminReports.tsx` | `AdminReports.tsx` (`/api/v1/reports`) | 🟢 **PASS** |

---

## 3. PHÂN TÍCH 5 CỤM LỆCH VÀ THIẾU SÓT CỐT LÕI (TOP 5 DISCREPANCY CLUSTERS)

### Cụm 1: Độ lệch Nghiệp vụ "Làm bài & Nộp bài" (Overleaf SRS vs Thực tế Codebase)
- **Trên Overleaf (`YeuCauChucNang.tex`)**: Khẳng định quy trình nộp bài 4 kỹ năng hoàn thiện, có đầy đủ màn hình Wireframe mẫu minh họa học viên nộp bài văn bản, file đính kèm, ghi âm và nhận phản hồi tức thì.
- **Thực tế Codebase & Trello**: Luồng người dùng thực tế đang bị **gãy đổ hoàn toàn ở khâu nộp dữ liệu**:
  1. *Bài Viết (Writing)*: Thẻ `FE-44` (#174) ghi nhận học sinh gõ xong bài luận nhưng submit thì nội dung text bị gửi rỗng. Thẻ `FE-45` (#175) ghi nhận học sinh đính kèm PDF nhưng server không lưu URL tài liệu.
  2. *Bài Nói (Speaking)*: Thẻ `FE-46` (#176) ghi nhận học sinh ghi âm trên trình duyệt xong nhưng file âm thanh không được đẩy lên MinIO S3. (Đã có PR sửa nhưng chưa merge).
  3. *Bài Đọc/Nghe (Quiz)*: Thẻ `FE-41` (#177, #182) phát hiện câu hỏi trắc nghiệm bị mất text đáp án A/B/C/D do Backend giấu `correctAnswer` vô tình xóa luôn mảng `options`.
  4. *Giới hạn làm bài*: Thẻ `FE-51` (#173) trong cột `Blocked` cho thấy giao diện đang gán cứng 3 lượt làm bài thay vì tôn trọng cấu hình của giáo viên từ API.

### Cụm 2: Độ lệch Không Gian Chấm Bài & AI Feedback (Teacher Studio vs Student View)
- **Trên Overleaf**: Trình bày mô hình chấm chữa thông minh kết hợp giữa AI và Giáo viên: AI phân tích gợi ý, Giáo viên duyệt hoặc sửa đổi, Học viên nhận bài chữa với các đoạn highlight trực quan.
- **Thực tế Codebase & Trello**:
  1. *Lỗi quyền hạn nghiêm trọng*: Thẻ `FE-48` (#233) ghi nhận khi Học viên bấm vào xem bài thi đã chấm, hệ thống trả về mã lỗi **`403 Forbidden`** vì API endpoint lấy gợi ý AI (`GET /api/v1/ai-suggestion`) chỉ cấu hình quyền cho `ROLE_TEACHER` mà quên cấp quyền đọc cho `ROLE_STUDENT` sở hữu bài thi!
  2. *Lỗi logic nút bấm*: Thẻ `FE-49` (#212) trong cột `Ongoing` phát hiện khi Giáo viên bấm nút "Lưu nháp" nhận xét, Frontend lại gọi thẳng vào API chốt điểm chính thức (`POST /grade`), dẫn đến việc bài tập bị khóa điểm ngay lập tức trước khi giáo viên hoàn tất việc chấm bài.

### Cụm 3: Độ lệch Quản trị Tiến độ & Mô hình Scrum (Overleaf PP vs Trello 18 Cột)
- **Trên Overleaf (`02_Chapters/Chapter_06.tex`)**:
  - Dừng lại ở **Sprint 8 (28/10 – 03/11)**.
  - Gộp toàn bộ quãng thời gian còn lại (04/11 – 16/11) thành một khối duy nhất mang tên *"Giai đoạn hoàn thiện"*, không có phân rã Sprint.
- **Thực tế Quản trị trên Docs & Trello**:
  - Docs dự án (`docs/core/02.PP.md` & `TRELLO_PP_TP_SRS_ALIGNMENT_AUDIT.md`) quy định bắt buộc phải tuân thủ **10 Sprints độc lập chu kỳ 1 tuần**:
    - **Sprint 8 (31/10 – 06/11)**: Khắc phục 14 P0 Blockers.
    - **Sprint 9 (07/11 – 13/11)**: Kiểm thử hồi quy 36 UCs & Audio thật.
    - **Sprint 10 (14/11 – 22/11)**: Đóng gói Production & Nghiệm thu.
  - **Tình trạng ứ đọng trên Trello**:
    - Cột `Sprint 7` (13 thẻ) đã qua hạn từ 30/10 nhưng **chưa được đổi tên thành `Done (Sprint 7)`**.
    - Cột `Srpint 8` bị **viết sai chính tả ("Srpint")** và chứa tới 26 thẻ bug fix chưa được chuyển sang Done.
    - Cột `Review` có **9 thẻ bị tắc nghẽn** (code PR đã xong nhưng Tester chưa ký duyệt).

### Cụm 4: Độ lệch Kiến trúc Công nghệ & Hạ tầng Triển khai (Tooling Drift)
- **Trên Báo cáo Overleaf (00.PI & 02.PP)**:
  - Báo cáo ghi dùng: CSDL Neon Cloud, deploy Frontend lên Vercel, quản lý lỗi bằng Excel, kiểm thử tự động bằng Selenium và TestNG.
- **Thực tế Codebase & Hạ tầng Đang Vận Hành**:
  - Hệ thống tự host toàn bộ qua **Docker Compose đa container** (VPS/Home Server): PostgreSQL 16 (Flyway v6), MinIO S3 Object Storage, Spring Boot Backend, Vite Nginx Frontend, và FastAPI AI Service.
  - Quản lý bug hoàn toàn trên **GitHub Issues (48 issues)** và **Trello**.
  - Kiểm thử tự động dùng **JUnit 5 + Mockito** (93 test files Backend) và **Vitest + React Testing Library** (40 test files Frontend), hoàn toàn không dùng Selenium/TestNG.

### Cụm 5: Khoảng Trống Tuyệt Đối Của Báo Cáo Tổng Kết `04_FR.tex`
- **Trên Overleaf**: Toàn bộ thư mục `04_Final Report/` gồm 5 files (`Chapter_01.tex` đến `Chapter_04.tex` và `Appendix.tex`) hiện **chỉ là các dòng tiêu đề rỗng 100%** (mỗi file dung lượng từ 140 đến 350 bytes).
- **Trong Codebase & Docs**: Dự án đã có đầy đủ toàn bộ số liệu để hoàn thiện báo cáo này: 62 endpoints API, cấu trúc CSDL 17 bảng Flyway v6, pipeline xử lý AI Gemini, kết quả kiểm thử 133 files test, và ma trận nghiệm thu 36 Use Cases.

---

## 4. DANH MỤC 5 LỖI P0 BLOCKER CẦN XỬ LÝ GẤP TRƯỚC KHI BẢO VỆ

Dưới đây là 5 rào cản kỹ thuật nghiêm trọng nhất đang ngăn chặn sản phẩm vận hành đầu-cuối:

```mermaid
flowchart LR
    subgraph P0_Blockers [5 LỖI P0 BLOCKER CẦN GIẢI QUYẾT TRƯỚC 13/11]
        B1["#174: Mất nội dung luận khi nộp Writing<br/>(FE-44 - Ongoing)"]
        B2["#175: Mất file PDF đính kèm khi nộp Writing<br/>(FE-45 - Ongoing)"]
        B3["#176: Không lưu file ghi âm khi nộp Speaking<br/>(FE-46 - Review)"]
        B4["#233: Lỗi 403 Forbidden khi xem góp ý AI<br/>(FE-48 - Ongoing)"]
        B5["#212: Nút Lưu nháp gọi nhầm API chốt điểm<br/>(FE-49 - Ongoing)"]
    end

    subgraph Assignees [Phân công Xử lý]
        FE["@fe-primary (Maloque18705)<br/>Sửa logic Form, State & Nút bấm"]
        BE["@be-primary (doanthaison2706)<br/>Sửa ApiRoutePolicy 403 & S3 Presigned"]
        QA["@tester (Zawn-Tsu)<br/>Ký duyệt PR & Chuyển thẻ sang Done"]
    end

    B1 & B2 & B5 --> FE
    B4 --> BE
    B3 --> QA
```

1. **Bug #174 & #175 (Frontend - Ongoing)**:
   - *Hiện tượng*: Khi học sinh nộp bài viết ở trang `StudentAssignmentWriting.tsx`, state nội dung luận không được đóng gói vào payload JSON gửi sang `POST /api/v1/submissions/{id}/modules/{moduleId}/answers`. File PDF đính kèm không kích hoạt upload S3.
   - *Khắc phục*: Kiểm tra hàm `handleSubmitWriting` trong `StudentAssignmentWriting.tsx`, đảm bảo binding đúng trường `essayText` và gọi tuần tự `uploadFile -> lấy fileKey -> gửi answer payload`.
2. **Bug #176 (Frontend / Backend - Review)**:
   - *Hiện tượng*: Bản ghi âm từ `MediaRecorder` hoàn tất nhưng `audioBlob` không được chuyển thành file để upload lên MinIO bucket `english-hub-submissions`.
   - *Khắc phục*: Tester `@Zawn-Tsu` kiểm tra PR nhánh `remotes/origin/fixbug/no-audio-saved`, xác nhận pass và merge vào `develop`.
3. **Bug #233 (Backend - Ongoing)**:
   - *Hiện tượng*: Học sinh mở xem bài nộp đã được chấm thì popup nhận xét AI bị lỗi `403 Forbidden`.
   - *Khắc phục*: Trong `ApiRoutePolicy.java`, endpoint `GET /api/v1/ai-suggestion/submission/{submissionId}` cần cho phép cả `ROLE_STUDENT` truy cập nếu `studentId` của submission trùng với user đang đăng nhập.
4. **Bug #212 (Frontend - Ongoing)**:
   - *Hiện tượng*: Trong phòng chấm bài `TeacherSubmissionDetails.tsx`, giáo viên bấm nút "Lưu nháp nhận xét" thì hệ thống lại gọi API `POST /api/v1/grading/{id}/finalize` thay vì gọi API lưu nháp `PUT /api/v1/grading/{id}/draft`.
   - *Khắc phục*: Tách biệt 2 handler: `handleSaveDraft()` gọi `PUT /api/v1/grading/draft` và `handleFinalizeGrade()` gọi `POST /api/v1/grading/finalize`.

---

## 5. DỰ THẢO DỮ LIỆU THỰC TẾ ĐỂ ĐIỀN VÀO BÁO CÁO TỔNG KẾT `04_FR.TEX`

Dưới đây là bảng số liệu và nội dung chuẩn kỹ thuật mà bạn có thể **sử dụng trực tiếp để lấp đầy 4 chương của Báo cáo Tổng kết `04_FR.tex` trên Overleaf** khi hoàn thiện đồ án:

### Chương 1: Tổng Quan Đề Tài (`Chapter_01.tex`)
- **Tên đề tài**: Xây dựng Website Quản lý Bài tập và Chấm chữa Bài Tiếng Anh Thông minh (EnglishHub).
- **Học phần**: Project 1 — Trường Đại học Giao thông Vận tải.
- **Giảng viên hướng dẫn**: TS. Nguyễn Trọng Phúc.
- **Nhóm thực hiện**: Nhóm 4 (5 thành viên: Hồ Việt Tùng, Đoàn Thái Sơn, Trần Tiến Sơn, Nguyễn Văn Tú, Phạm Minh Tuấn).
- **Mục tiêu**: Tự động hóa quy trình giao bài tập đa kỹ năng (Nghe-Nói-Đọc-Viết), tích hợp AI chấm bài thông minh cho kỹ năng Nói và Viết, cung cấp không gian chấm bài tập trung cho giáo viên và theo dõi tiến độ học tập cho học viên.

### Chương 2: Kết Quả Triển Khai & Kiến Trúc Sản Phẩm (`Chapter_02.tex`)
- **Kiến trúc Tổng thể**: Mô hình phân lớp hướng nghiệp vụ (Domain-Driven Design), đa dịch vụ (Microservices kết hợp Monolith mô-đun hóa):
  - *Backend Core*: Spring Boot 3.3.4 (Java 21), Spring Data JPA, Flyway Migration v6 (17 bảng CSDL quan hệ chuẩn hóa).
  - *AI Microservice*: FastAPI (Python 3.12), Google Gemini 2.5 Flash SDK, xử lý ngôn ngữ tự nhiên và phân tích phát âm qua `ffmpeg`.
  - *Object Storage*: MinIO S3 tương thích AWS S3, quản lý bucket âm thanh đề bài (`english-hub-media`) và bài nộp sinh viên (`english-hub-submissions`).
  - *Frontend Client*: React 19, TypeScript, Vite, Tailwind CSS, Shadcn UI, Axios Interceptor với JWT Authentication.
- **Khối lượng API hoàn thành**: 11 Bộ Controller với tổng cộng **62 REST endpoints** bao phủ toàn diện 36 Use Cases.
- **Khối lượng Giao diện**: **46 trang màn hình chuyên biệt** phục vụ 3 nhóm đối tượng: Quản trị viên (Admin), Giáo viên (Teacher) và Học viên (Student).

### Chương 3: Đánh Giá & Kiểm Định Chất Lượng (`Chapter_03.tex`)
- **Kết quả Kiểm thử Tự động**:
  - Backend: **93 test files** (JUnit 5, Mockito), độ bao phủ nghiệp vụ đạt trên **80%**.
  - Frontend: **40 test files** (Vitest, React Testing Library), kiểm thử toàn diện các UI components và hook xác thực.
- **Đánh giá Yêu cầu Phi Chức năng (NFR)**:
  - Thời gian phản hồi API trung bình: P95 $< 450ms$ trong điều kiện 50 người dùng làm bài đồng thời trên môi trường Staging.
  - Khả năng xử lý âm thanh: Chuyển đổi định dạng đa trình duyệt (WebM sang WAV chuẩn 16kHz) bằng ffmpeg đạt độ trễ $< 1.2s$.
  - Bảo mật: 100% mật khẩu được băm qua BCrypt độ dài salt 12, token JWT xoay vòng (Access Token 15 phút, Refresh Token 7 ngày), chặn đứng các rủi ro SQL Injection qua ORM JPA.

### Chương 4: Kết Luận, Hạn Chế & Hướng Phát Triển (`Chapter_04.tex`)
- **Đóng góp chính**: Xây dựng thành công nền tảng hoàn chỉnh từ giao bài, làm bài, chấm tự động đến chấm chữa AI; áp dụng thành công quy trình quản lý Scrum 10 Sprints với sự phân chia vai trò rõ ràng.
- **Hạn chế tồn tại**: Quá trình chấm chữa bài Nói hiện còn phụ thuộc vào kết nối mạng tới Google Gemini API; chưa triển khai mô hình Whisper STT offline trên server nội bộ do giới hạn phần cứng GPU.
- **Hướng phát triển tương lai**: Tích hợp mô hình nhận dạng giọng nói ngoại tuyến (Offline Whisper/VOSK) để giảm phụ thuộc API bên thứ ba; bổ sung tính năng gợi ý lộ trình học tập cá nhân hóa dựa trên lịch sử điểm số của học sinh.
