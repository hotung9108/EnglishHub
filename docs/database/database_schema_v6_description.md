# 📘 Mô Tả Thiết Kế Cơ Sở Dữ Liệu — Phiên Bản V6

**Hệ thống:** Website Quản lý Bài tập & Chấm chữa Bài tiếng Anh Thông minh (Group 4)[cite: 3]  
**Ngày cập nhật:** 12/09/2026[cite: 3]  
**Tổng số bảng:** 16 bảng[cite: 3]

---

## 📌 Lịch Sử Thay Đổi Chính (Changelog)

### **Phiên bản V6 (Mới nhất)**
* **`CLASS_MEMBERS`:** Bỏ hoàn toàn enum `class_member_type` (`PRIMARY` / `SUPPLEMENTARY`) và cột `member_type`[cite: 3]. Thành viên trong lớp không còn phân loại, chỉ còn lưu học viên thuộc lớp[cite: 3].

### **Phiên bản V5**
* **`CLASS_MEMBERS`:** Bỏ cột `status` (`enum class_member_status`) và `ended_at`[cite: 3]. Khi học viên rời lớp hoặc kết thúc lớp, hệ thống thực hiện **Xóa cứng (DELETE)** bản ghi thay vì đổi trạng thái[cite: 3].
* **`QUESTIONS`:** Thêm lại cột `correct_answer` (`text`, chứa chuỗi JSON) để tách đáp án đúng/danh sách lựa chọn ra khỏi `content` (chỉ chứa plain text đề bài)[cite: 3].
* **`SUBMISSION_MODULES`:** Loại bỏ cột `audio_play_count`[cite: 3].

### **Phiên bản V4**
* **Chuyển đổi Ràng buộc Nghiệp vụ:** Xóa bỏ toàn bộ `CHECK` constraints, partial unique indexes và triggers ở DB layer[cite: 3]; chuyển toàn bộ logic kiểm tra hợp lệ xuống **Service Layer**[cite: 3].
* **`ASSIGNMENTS`:** Xóa cột `teacher_id` để tránh dư thừa dữ liệu (truy vấn giáo viên thông qua `assignments.class_id` $\rightarrow$ `classes.teacher_id`)[cite: 3].
* **Gộp bảng:** Xóa 2 bảng `question_options` và `answer_results`, dồn thông tin vào dạng JSON lưu ở cột `content` / `correct_answer` của `questions` và `answers`[cite: 3].

---

## 📑 Danh Sách Các Bảng và Cấu Trúc Chi Tiết

### 1. `users` (Tài khoản người dùng)
Lưu trữ thông tin định danh và tài khoản chung cho tất cả các vai trò[cite: 3].

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` | PK, Auto Increment | ID người dùng[cite: 3] |
| `full_name` | `varchar(150)` | NOT NULL | Họ và tên[cite: 3] |
| `email` | `varchar(150)` | NOT NULL, UNIQUE | Email đăng nhập[cite: 3] |
| `phone` | `varchar(20)` | | Số điện thoại[cite: 3] |
| `avatar_url` | `varchar(255)` | | Đường dẫn ảnh đại diện[cite: 3] |
| `password_hash` | `varchar(255)` | NOT NULL | Mật khẩu mã hóa[cite: 3] |
| `role` | `enum user_role` | NOT NULL | Vai trò: `ADMIN`, `TEACHER`, `STUDENT`[cite: 3] |
| `status` | `enum user_status` | NOT NULL, DEFAULT `ACTIVE` | Trạng thái: `ACTIVE`, `LOCKED`[cite: 3] |
| `is_deleted` | `boolean` | NOT NULL, DEFAULT `false` | Đánh dấu xóa mềm[cite: 3] |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Thời gian tạo[cite: 3] |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Thời gian cập nhật[cite: 3] |

---

### 2. `teacher_profiles` (Hồ sơ Giáo viên)
Lưu thông tin bổ sung cho tài khoản Giáo viên[cite: 3].

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `user_id` | `bigint` | PK, FK $\rightarrow$ `users.id` | ID người dùng[cite: 3] |
| `specialization` | `varchar(150)` | | Chuyên môn / Chuyên ngành[cite: 3] |

---

### 3. `student_profiles` (Hồ sơ Học viên)
Lưu thông tin bổ sung cho tài khoản Học viên[cite: 3].

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `user_id` | `bigint` | PK, FK $\rightarrow$ `users.id` | ID người dùng[cite: 3] |
| `student_code` | `varchar(30)` | UNIQUE | Mã số học viên[cite: 3] |
| `date_of_birth` | `date` | | Ngày sinh[cite: 3] |
| `parent_phone` | `varchar(20)` | | Số điện thoại phụ huynh[cite: 3] |

---

### 4. `classes` (Lớp học)
Lưu thông tin các lớp học[cite: 3].

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` | PK, Auto Increment | ID lớp học[cite: 3] |
| `name` | `varchar(150)` | NOT NULL | Tên lớp[cite: 3] |
| `level` | `varchar(50)` | | Trình độ[cite: 3] |
| `description` | `text` | | Mô tả lớp học[cite: 3] |
| `start_date` | `date` | NOT NULL | Ngày bắt đầu[cite: 3] |
| `end_date` | `date` | | Ngày kết thúc[cite: 3] |
| `status` | `enum class_status` | NOT NULL, DEFAULT `ACTIVE` | Trạng thái: `ACTIVE`, `INACTIVE`, `COMPLETED`, `CANCELLED`[cite: 3] |
| `teacher_id` | `bigint` | FK $\rightarrow$ `teacher_profiles.user_id` | Giáo viên phụ trách[cite: 3] |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Thời gian tạo[cite: 3] |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Thời gian cập nhật[cite: 3] |

---

### 5. `class_members` (Danh sách Thành viên Lớp)
Lưu mối quan hệ giữa Học viên và Lớp học[cite: 3].

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` | PK, Auto Increment | ID bản ghi[cite: 3] |
| `class_id` | `bigint` | NOT NULL, FK $\rightarrow$ `classes.id` | ID lớp học[cite: 3] |
| `student_id` | `bigint` | NOT NULL, FK $\rightarrow$ `student_profiles.user_id` | ID học viên[cite: 3] |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Thời gian tham gia[cite: 3] |

> 📌 **Ghi chú V6:** Đã gỡ bỏ cột `member_type` và enum `class_member_type`[cite: 3]. Khi học viên nghỉ học hoặc rời lớp, hệ thống thực hiện XÓA CỨNG bản ghi[cite: 3]. Ràng buộc "1 học viên xuất hiện 1 lần trong 1 lớp" chuyển xuống Service Layer xử lý[cite: 3].

---

### 6. `assignments` (Bài tập)
Lưu thông tin tổng quan của một bài tập assigned cho một lớp[cite: 3].

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` | PK, Auto Increment | ID bài tập[cite: 3] |
| `class_id` | `bigint` | NOT NULL, FK $\rightarrow$ `classes.id` | ID lớp học tiếp nhận[cite: 3] |
| `title` | `varchar(200)` | NOT NULL | Tiêu đề bài tập[cite: 3] |
| `description` | `text` | | Mô tả / Hướng dẫn chung[cite: 3] |
| `open_at` | `timestamptz` | NOT NULL | Thời gian mở đề[cite: 3] |
| `close_at` | `timestamptz` | NOT NULL | Hạn nộp bài[cite: 3] |
| `max_submissions` | `int` | | Số lần nộp tối đa[cite: 3] |
| `status` | `enum assignment_status` | NOT NULL, DEFAULT `DRAFT` | Trạng thái: `DRAFT`, `PUBLISHED`, `CLOSED`[cite: 3] |
| `is_deleted` | `boolean` | NOT NULL, DEFAULT `false` | Đánh dấu xóa mềm[cite: 3] |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Thời gian tạo[cite: 3] |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Thời gian cập nhật[cite: 3] |

---

### 7. `modules` (Kỹ năng / Phần thi trong bài tập)
Một bài tập gồm nhiều module kỹ năng (Reading, Listening, Writing, Speaking)[cite: 3].

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` | PK, Auto Increment | ID module[cite: 3] |
| `assignment_id` | `bigint` | NOT NULL, FK $\rightarrow$ `assignments.id` (CASCADE) | ID bài tập[cite: 3] |
| `skill` | `enum module_skill` | NOT NULL | Kỹ năng: `READING`, `LISTENING`, `WRITING`, `SPEAKING`[cite: 3] |
| `task_type` | `enum module_task_type` | NOT NULL | Dạng bài: `QUIZ`, `REWRITE`, `RECORDING`, `ESSAY`[cite: 3] |
| `order_index` | `int` | NOT NULL | Thứ tự hiển thị[cite: 3] |
| `instructions` | `text` | | Hướng dẫn thực hiện[cite: 3] |
| `ai_instruction` | `text` | | Prompt/Chỉ dẫn riêng cho AI chấm bài[cite: 3] |
| `max_score` | `decimal(5,2)` | NOT NULL, DEFAULT `10` | Điểm tối đa của module[cite: 3] |
| `source_audio_storage_key` | `varchar(255)` | | Key file âm thanh gốc (dùng cho Listening)[cite: 3] |
| `source_audio_duration_seconds` | `int` | | Thời lượng audio gốc (giây)[cite: 3] |
| `source_audio_mime_type` | `varchar(50)` | | Định dạng file audio gốc[cite: 3] |
| `source_audio_upload_status` | `enum upload_status` | | Trạng thái upload file audio[cite: 3] |

---

### 8. `questions` (Câu hỏi)
Lưu thông tin các câu hỏi thuộc module (Quiz / Short answer)[cite: 3].

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` | PK, Auto Increment | ID câu hỏi[cite: 3] |
| `module_id` | `bigint` | NOT NULL, FK $\rightarrow$ `modules.id` (CASCADE) | ID module[cite: 3] |
| `content` | `text` | NOT NULL | Nội dung đề bài câu hỏi (Plain text)[cite: 3] |
| `correct_answer` | `text` | NOT NULL | Chuỗi JSON lưu đáp án/lựa chọn[cite: 3] |
| `question_type` | `enum question_type` | NOT NULL | Loại: `MULTIPLE_CHOICE`, `SHORT_ANSWER`[cite: 3] |
| `score` | `decimal(5,2)` | NOT NULL, DEFAULT `1` | Điểm của câu hỏi[cite: 3] |
| `order_index` | `int` | NOT NULL | Thứ tự trong module[cite: 3] |

> 📌 **Cấu trúc JSON trong `correct_answer`:**
> * `MULTIPLE_CHOICE`: `{"options": [{"id": 1, "content": "Option A", "is_correct": true}, {"id": 2, "content": "Option B", "is_correct": false}]}`[cite: 3]
> * `SHORT_ANSWER`: `{"correct_answer": "Sample answer text"}`[cite: 3]

---

### 9. `submissions` (Bài nộp của Học viên)
Lưu thông tin đợt nộp bài của học viên cho một `assignment`[cite: 3].

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` | PK, Auto Increment | ID lượt nộp bài[cite: 3] |
| `assignment_id` | `bigint` | NOT NULL, FK $\rightarrow$ `assignments.id` | ID bài tập[cite: 3] |
| `student_id` | `bigint` | NOT NULL, FK $\rightarrow$ `student_profiles.user_id` | ID học viên[cite: 3] |
| `attempt_number` | `int` | NOT NULL | Lần nộp thứ N[cite: 3] |
| `submitted_at` | `timestamptz` | | Thời điểm bấm nộp[cite: 3] |
| `status` | `enum submission_status` | NOT NULL, DEFAULT `IN_PROGRESS` | Trạng thái: `IN_PROGRESS`, `SUBMITTED`, `GRADED`[cite: 3] |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Thời gian bắt đầu làm bài[cite: 3] |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Thời gian cập nhật[cite: 3] |

---

### 10. `submission_modules` (Chi tiết lượt nộp theo Module)
Đánh dấu trạng thái làm bài của từng Module trong một Submissions[cite: 3].

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` | PK, Auto Increment | ID chi tiết module nộp[cite: 3] |
| `submission_id` | `bigint` | NOT NULL, FK $\rightarrow$ `submissions.id` (CASCADE) | ID lượt nộp bài[cite: 3] |
| `module_id` | `bigint` | NOT NULL, FK $\rightarrow$ `modules.id` | ID module tương ứng[cite: 3] |
| `status` | `enum submission_status` | NOT NULL, DEFAULT `IN_PROGRESS` | Trạng thái module nộp[cite: 3] |

---

### 11. `answers` (Câu trả lời)
Chứa câu trả lời của học viên cho từng câu hỏi hoặc từng bài làm essay/recording[cite: 3].

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` | PK, Auto Increment | ID câu trả lời[cite: 3] |
| `submission_module_id` | `bigint` | NOT NULL, FK $\rightarrow$ `submission_modules.id` (CASCADE) | ID module bài nộp[cite: 3] |
| `question_id` | `bigint` | FK $\rightarrow$ `questions.id` | ID câu hỏi (NULL nếu là Essay/Speaking)[cite: 3] |
| `content` | `text` | | Chuỗi JSON (Quiz) hoặc Text bài văn[cite: 3] |
| `audio_storage_key` | `varchar(255)` | | Key file ghi âm bài nói[cite: 3] |
| `audio_duration_seconds` | `int` | | Thời lượng ghi âm[cite: 3] |
| `audio_file_size_bytes` | `bigint` | | Dung lượng file âm thanh[cite: 3] |
| `audio_mime_type` | `varchar(50)` | | Loại MIME âm thanh[cite: 3] |
| `audio_upload_status` | `enum upload_status` | | Trạng thái upload âm thanh[cite: 3] |
| `doc_storage_key` | `varchar(255)` | | Key file tài liệu đính kèm[cite: 3] |
| `doc_mime_type` | `varchar(50)` | | Loại MIME tài liệu[cite: 3] |
| `doc_file_size_bytes` | `bigint` | | Dung lượng tài liệu[cite: 3] |
| `doc_upload_status` | `enum upload_status` | | Trạng thái upload tài liệu[cite: 3] |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Thời gian tạo[cite: 3] |

> 📌 **Cấu trúc JSON trong `content` khi `question_id` NOT NULL:**
> * Chọn đáp án: `{"selected_option_ids": [1]}`[cite: 3]
> * Sau khi hệ thống tự chấm (AUTO): `{"selected_option_ids": [1], "is_correct": true, "score": 1.0}`[cite: 3]

---

### 12. `answer_annotations` (Ghi chú / Nhận xét chi tiết)
Chứa các góp ý, chỉ lỗi từ AI hoặc Giáo viên[cite: 3].

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` | PK, Auto Increment | ID chú thích[cite: 3] |
| `answer_id` | `bigint` | NOT NULL, FK $\rightarrow$ `answers.id` (CASCADE) | ID câu trả lời[cite: 3] |
| `source` | `enum annotation_source` | NOT NULL | Nguồn tạo: `AI`, `TEACHER`[cite: 3] |
| `start_offset` | `int` | NOT NULL | Vị trí bắt đầu của lỗi[cite: 3] |
| `end_offset` | `int` | NOT NULL | Vị trí kết thúc của lỗi[cite: 3] |
| `error_type` | `varchar(50)` | | Phân loại lỗi[cite: 3] |
| `comment` | `text` | | Ghi chú/Nhận xét lỗi[cite: 3] |
| `suggested_fix` | `text` | | Gợi ý sửa lỗi[cite: 3] |
| `review_status` | `enum review_status` | NOT NULL, DEFAULT `PENDING` | Trạng thái: `PENDING`, `ACCEPTED`, `REJECTED`[cite: 3] |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Thời gian tạo[cite: 3] |

---

### 13. `gradings` (Chấm điểm Module)
Kết quả chấm điểm tổng thể của từng Module trong bài nộp[cite: 3].

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` | PK, Auto Increment | ID bản ghi chấm điểm[cite: 3] |
| `submission_module_id` | `bigint` | NOT NULL, UNIQUE, FK $\rightarrow$ `submission_modules.id` (CASCADE) | ID module bài nộp[cite: 3] |
| `method` | `enum grading_method` | NOT NULL | Phương thức: `AUTO`, `TEACHER_MANUAL`[cite: 3] |
| `status` | `enum grading_status` | NOT NULL, DEFAULT `PENDING` | Trạng thái: `PENDING`, `AI_GRADED`, `COMPLETED`, `FAILED`[cite: 3] |
| `ai_feedback` | `text` | | Đánh giá tổng thể từ AI[cite: 3] |
| `ai_transcript` | `jsonb` | | Phân tích/Bằng chứng từ AI[cite: 3] |
| `ai_instruction_snapshot` | `text` | | Bản lưu Prompt AI thời điểm chấm[cite: 3] |
| `final_score` | `decimal(5,2)` | | Điểm số cuối cùng[cite: 3] |
| `final_feedback` | `text` | | Nhận xét chung của Giáo viên[cite: 3] |
| `max_score_snapshot` | `decimal(5,2)` | | Thang điểm tối đa thời điểm chấm[cite: 3] |
| `reviewed_by` | `bigint` | FK $\rightarrow$ `teacher_profiles.user_id` | Giáo viên thực hiện duyệt/chấm[cite: 3] |
| `reviewed_at` | `timestamptz` | | Thời điểm duyệt[cite: 3] |
| `graded_at` | `timestamptz` | | Thời điểm chấm thành công[cite: 3] |

---

### 14. `refresh_tokens` (Quản lý Phiên Đăng nhập)
Lưu Token xác thực người dùng[cite: 3].

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` | PK, Auto Increment | ID token[cite: 3] |
| `user_id` | `bigint` | NOT NULL, FK $\rightarrow$ `users.id` | ID người dùng[cite: 3] |
| `token_hash` | `varchar(255)` | NOT NULL, UNIQUE | Chuỗi token đã được hash[cite: 3] |
| `expires_at` | `timestamptz` | NOT NULL | Thời gian hết hạn[cite: 3] |
| `revoked_at` | `timestamptz` | | Thời gian thu hồi token[cite: 3] |
| `user_agent` | `varchar(255)` | | Thông tin thiết bị/Trình duyệt[cite: 3] |
| `ip_address` | `varchar(45)` | | Địa chỉ IP[cite: 3] |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Thời gian khởi tạo[cite: 3] |

---

### 15. `student_evaluations` (Đánh giá Học viên)
Đánh giá định kỳ của giáo viên dành cho học viên theo từng lớp[cite: 3].

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` | PK, Auto Increment | ID đánh giá[cite: 3] |
| `student_id` | `bigint` | NOT NULL, FK $\rightarrow$ `student_profiles.user_id` | ID học viên được đánh giá[cite: 3] |
| `teacher_id` | `bigint` | NOT NULL, FK $\rightarrow$ `teacher_profiles.user_id` | ID giáo viên đánh giá[cite: 3] |
| `class_id` | `bigint` | NOT NULL, FK $\rightarrow$ `classes.id` | ID lớp học liên quan[cite: 3] |
| `content` | `text` | NOT NULL | Nội dung đánh giá nhận xét[cite: 3] |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Thời gian tạo[cite: 3] |

---

### 16. `grading_change_logs` (Lịch sử Sửa điểm)
Lưu nhật ký điều chỉnh điểm số của bài làm[cite: 3].

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` | PK, Auto Increment | ID lịch sử[cite: 3] |
| `grading_id` | `bigint` | NOT NULL, FK $\rightarrow$ `gradings.id` | ID bản ghi chấm điểm[cite: 3] |
| `changed_by` | `bigint` | NOT NULL, FK $\rightarrow$ `teacher_profiles.user_id` | Người thực hiện chỉnh sửa[cite: 3] |
| `old_score` | `decimal(5,2)` | | Điểm số cũ[cite: 3] |
| `new_score` | `decimal(5,2)` | | Điểm số mới[cite: 3] |
| `note` | `text` | | Lý do chỉnh sửa[cite: 3] |
| `changed_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Thời gian sửa[cite: 3] |

---

## 🛠 Danh Sách Enums Sử Dụng Trong DB

```sql
Enum user_role { ADMIN, TEACHER, STUDENT }
Enum user_status { ACTIVE, LOCKED }
Enum class_status { ACTIVE, INACTIVE, COMPLETED, CANCELLED }
Enum assignment_status { DRAFT, PUBLISHED, CLOSED }
Enum module_skill { READING, LISTENING, WRITING, SPEAKING }
Enum module_task_type { QUIZ, REWRITE, RECORDING, ESSAY }
Enum upload_status { UPLOADING, PROCESSING, READY, FAILED }
Enum question_type { MULTIPLE_CHOICE, SHORT_ANSWER }
Enum submission_status { IN_PROGRESS, SUBMITTED, GRADED }
Enum annotation_source { AI, TEACHER }
Enum review_status { PENDING, ACCEPTED, REJECTED }
Enum grading_method { AUTO, TEACHER_MANUAL }
Enum grading_status { PENDING, AI_GRADED, COMPLETED, FAILED }