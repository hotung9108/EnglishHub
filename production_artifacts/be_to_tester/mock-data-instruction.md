# Mock Data Instructions — EnglishHub Backend

## Contents

1. Task 1 — Mock Users and Profiles
2. Task 2 — Mock Classes and Class Members
3. Task 3 — Mock Assignments, Modules, and Questions
4. Task 4 — Submissions
5. Task 5 — Answers
6. Task 6 — Gradings and Answer Annotations
7. Task 7 — Grading Change Logs
8. Task 8 — Refresh Tokens and Student Evaluations
9. Task 9 — Validation instructions
10. Task 9 — Validation report output

## Task 1 — Mock Users and Profiles

### Run

From `backend/`:

```bash
./gradlew bootRun --args='--spring.profiles.active=dev,seed'
```

The `seed` profile is required. Each run truncates the seed tables and their
dependent rows with `RESTART IDENTITY CASCADE`, then recreates the data.

### Expected result

- `users`: 3 `ADMIN`, 8 `TEACHER`, 80 `STUDENT`.
- Exactly 4 users are `LOCKED`, and every locked user is a `STUDENT`.
- `teacher_profiles`: 8 rows, each linked to a `TEACHER`.
- `student_profiles`: 80 rows, each linked to a `STUDENT`.
- `student_code` values are unique and use the `SV000001` format.
- Email addresses are unique; admins use `@utc-polyglot.edu.vn`, teachers and
  students use `@gmail.com`.
- `date_of_birth` and `parent_phone` each have 12 null rows, selected
  independently.
- All generated student birth dates represent ages 15–25 on the run date.
- The common plaintext password is `Password123!` and is stored as BCrypt.

### Re-run check

Run the command twice. The second run must complete without a duplicate-key or
foreign-key error, and the runtime log must again show IDs beginning at 1.

The `docs/Datamock/` folder is reference-only and is intentionally excluded
from the implementation commit.

---

## Task 2 — Mock Classes and Class Members

### Run

From `backend/`:

```bash
./gradlew bootRun --args='--spring.profiles.active=dev,seed'
```

The shared `seed` profile runs Task 1 first (`@Order(1)`) and Task 2 second
(`@Order(2)`). Task 2 reads the teacher and student profiles created by Task 1.

### Expected result

- `classes`: 6 rows — 4 `ACTIVE`, 1 `COMPLETED`, and 1 `CANCELLED`.
- Exactly 1 class has `teacher_id IS NULL`; every other teacher ID references a
  row in `teacher_profiles`.
- Every non-cancelled class has 15–20 members.
- The cancelled class has 1 member.
- Every student ID references a row in `student_profiles`.
- There are no duplicate `(class_id, student_id)` pairs.
- The completed class has `end_date < CURRENT_DATE`.

### Re-run check

Run the command twice. Task 2 truncates only `class_members` and `classes` with
`RESTART IDENTITY CASCADE`; it does not truncate `users` or either profile
table. Class IDs should start at 1 again on the second run.

The `docs/Datamock/` folder is reference-only and is intentionally excluded
from the implementation commit.

---

## Task 3 — Mock Assignments, Modules, and Questions

### Run

From `backend/`:

```bash
./gradlew bootRun --args='--spring.profiles.active=dev,seed'
```

The shared `seed` profile runs Task 1, Task 2, and then Task 3 in `@Order`
sequence. Task 3 uses the class IDs persisted by Task 2.

### Expected result

- `assignments`: 2–4 rows for each non-cancelled class; the cancelled class has
  0 rows.
- Assignment status includes a small number of `DRAFT` rows only for active
  classes, with the remaining rows `PUBLISHED` or `CLOSED`.
- Every assignment has `open_at < close_at` and `is_deleted = FALSE`.
- Every assignment has four modules in order: Reading, Listening, Writing,
  and Speaking.
- Listening modules have an `audio/listening/{uuid}.mp3` key, a duration from
  60–300 seconds, `audio/mpeg`, and upload status `READY`.
- Reading and Listening modules have 5–10 questions. Writing and Speaking
  modules have no questions.
- Every `correct_answer` is valid JSON text. Multiple-choice JSON has exactly
  four options and exactly one `is_correct: true` option.
- Question order is unique within each module.

### Suggested SQL checks

```sql
SELECT status, COUNT(*)
FROM assignments
GROUP BY status
ORDER BY status;

SELECT COUNT(*) AS invalid_assignment_windows
FROM assignments
WHERE open_at >= close_at;

SELECT a.id, COUNT(m.id) AS module_count,
       COUNT(*) FILTER (WHERE m.skill = 'READING') AS reading_count,
       COUNT(*) FILTER (WHERE m.skill = 'LISTENING') AS listening_count,
       COUNT(*) FILTER (WHERE m.skill = 'WRITING') AS writing_count,
       COUNT(*) FILTER (WHERE m.skill = 'SPEAKING') AS speaking_count
FROM assignments a
LEFT JOIN modules m ON m.assignment_id = a.id
WHERE a.status IN ('PUBLISHED', 'CLOSED')
GROUP BY a.id
ORDER BY a.id;

SELECT module_id, COUNT(*) AS duplicate_order_rows
FROM questions
GROUP BY module_id, order_index
HAVING COUNT(*) > 1;

-- PostgreSQL raises an error if any correct_answer is not valid JSON.
SELECT id, correct_answer::jsonb
FROM questions;

SELECT COUNT(*) AS invalid_multiple_choice_rows
FROM questions
WHERE question_type = 'MULTIPLE_CHOICE'
  AND (
    SELECT COUNT(*)
    FROM jsonb_array_elements(correct_answer::jsonb -> 'options') AS option
    WHERE (option ->> 'is_correct')::boolean
  ) <> 1;
```

The `docs/Datamock/` folder is reference-only and is intentionally excluded
from the implementation commit.

---

## Mock Data Task 4 — Submissions

### Chạy seed

```bash
./gradlew bootRun --args='--spring.profiles.active=dev,seed'
```

Task 4 chạy sau Task 1–3 nhờ `@Profile("seed")` và `@Order(4)`. Seeder chỉ dùng native query cho:

```sql
TRUNCATE submission_modules, submissions RESTART IDENTITY CASCADE;
```

Các bản ghi còn lại được tạo bằng Spring Data JPA `saveAll`.

### Kiểm tra

```sql
-- Không trùng attempt
SELECT assignment_id, student_id, attempt_number, COUNT(*)
FROM submissions
GROUP BY assignment_id, student_id, attempt_number
HAVING COUNT(*) > 1;

-- Submission đã nộp phải có submitted_at
SELECT id
FROM submissions
WHERE status <> 'IN_PROGRESS'
  AND submitted_at IS NULL;

-- submitted_at phải nằm trong thời gian assignment
SELECT s.id
FROM submissions s
JOIN assignments a ON a.id = s.assignment_id
WHERE s.submitted_at IS NOT NULL
  AND (s.submitted_at < a.open_at OR s.submitted_at > a.close_at);

-- Submission đã nộp không được có module con IN_PROGRESS
SELECT s.id, sm.id
FROM submissions s
JOIN submission_modules sm ON sm.submission_id = s.id
WHERE s.status IN ('SUBMITTED', 'GRADED')
  AND sm.status = 'IN_PROGRESS';

-- Mỗi submission có đúng 4 module con
SELECT submission_id, COUNT(*)
FROM submission_modules
GROUP BY submission_id
HAVING COUNT(*) <> 4;

-- Submission chỉ thuộc học viên trong lớp của assignment
SELECT s.id
FROM submissions s
JOIN assignments a ON a.id = s.assignment_id
LEFT JOIN class_members cm
  ON cm.class_id = a.class_id
 AND cm.student_id = s.student_id
WHERE cm.id IS NULL;

-- DRAFT không được có submission
SELECT s.id
FROM submissions s
JOIN assignments a ON a.id = s.assignment_id
WHERE a.status = 'DRAFT';
```

Các query trên đều phải trả về 0 dòng. `docs/Datamock/` chỉ là tài liệu tham chiếu, không đưa thêm file vào đó.

---

## Mock Data Task 5 — Answers

### Chạy seed

```bash
./gradlew bootRun --args='--spring.profiles.active=dev,seed'
```

Task 5 chạy sau Task 1–4 nhờ `@Profile("seed")` và `@Order(5)`. Seeder chỉ truncate bảng `answers`; các bảng `submission_modules` và `questions` được đọc lại bằng repository.

Lưu ý tạm thời: schema hiện tại giới hạn `doc_mime_type` ở `VARCHAR(50)`, nên mock dùng `application/octet-stream` cho file `.docx`. MIME chuẩn `.docx` sẽ được cập nhật sau khi team thống nhất schema.

### Kiểm tra bắt buộc

```sql
-- JSON của answer có question_id phải parse được; PostgreSQL sẽ báo lỗi nếu content không phải JSON
SELECT id, content::jsonb
FROM answers
WHERE question_id IS NOT NULL;

-- Đúng một trong ba nguồn content/audio/doc
SELECT id
FROM answers
WHERE ((content IS NOT NULL)::int
     + (audio_storage_key IS NOT NULL)::int
     + (doc_storage_key IS NOT NULL)::int) <> 1;

-- GRADED phải có is_correct và score trong JSON
SELECT a.id
FROM answers a
JOIN submission_modules sm ON sm.id = a.submission_module_id
WHERE a.question_id IS NOT NULL
  AND sm.status = 'GRADED'
  AND (a.content::jsonb -> 'is_correct' IS NULL
       OR a.content::jsonb -> 'score' IS NULL);

-- SUBMITTED không được có is_correct/score
SELECT a.id
FROM answers a
JOIN submission_modules sm ON sm.id = a.submission_module_id
WHERE a.question_id IS NOT NULL
  AND sm.status = 'SUBMITTED'
  AND (a.content::jsonb ? 'is_correct'
       OR a.content::jsonb ? 'score');

-- Answer câu hỏi chỉ thuộc Reading/Listening
SELECT a.id
FROM answers a
JOIN submission_modules sm ON sm.id = a.submission_module_id
JOIN modules m ON m.id = sm.module_id
WHERE a.question_id IS NOT NULL
  AND m.skill::text NOT IN ('READING', 'LISTENING');

-- Writing/Speaking answer không trỏ question
SELECT a.id
FROM answers a
JOIN submission_modules sm ON sm.id = a.submission_module_id
JOIN modules m ON m.id = sm.module_id
WHERE m.skill::text IN ('WRITING', 'SPEAKING')
  AND a.question_id IS NOT NULL;
```

Các query phải trả về 0 dòng, riêng query JSON trả về danh sách answer hợp lệ. Đọc ngẫu nhiên 5–10 dòng Writing bằng mắt để xác nhận nội dung là đoạn văn thật.

---

## Mock Data Task 6 — Gradings và Answer Annotations

> Kết quả bên dưới là baseline trước khi thêm fixture `PENDING` Writing/Speaking cho #49 trong
> `GradingMockDataSeeder`; chưa chạy lại để cập nhật count/phân bố sau thay đổi này.

### Chạy seed

```bash
./gradlew bootRun --args='--spring.profiles.active=dev,seed'
```

Task 6 chạy sau Task 1–5 nhờ `@Profile("seed")` và `@Order(6)`. Seeder chỉ dùng native query cho:

```sql
TRUNCATE answer_annotations, gradings RESTART IDENTITY CASCADE;
```

Các dữ liệu đầu vào được đọc bằng Repository; grading và annotation được ghi bằng Spring Data JPA.
Seeder cũng bổ sung một attempt `SUBMITTED` đầy đủ (1 submission, 4 submission modules và các answer
tương ứng) với hai grading Writing/Speaking ở `PENDING`, được lưu bằng Repository để #49 có fixture
hợp lệ. Không có raw SQL insert.

`final_score` của grading `AUTO` được đọc lại từ `answers.content` và cộng field `score` trong JSON. `SPEAKING.ai_transcript` được tạo và parse lại trước khi lưu; entity map các enum PostgreSQL bằng `@JdbcTypeCode(SqlTypes.NAMED_ENUM)` và transcript bằng JSONB.

Theo chốt tạm thời của PM, các submission mẫu có `submitted_at` tương lai vẫn được giữ nguyên; vì vậy 20 grading `COMPLETED` có `graded_at > NOW()`. Tất cả các dòng vẫn bảo đảm `graded_at > submitted_at`.

### Kết quả Check

| Kiểm tra | Kết quả |
| --- | ---: |
| AUTO gradings | 90 |
| AUTO score mismatch với `answers.content` JSON | 0 |
| `final_score > max_score_snapshot` | 0 |
| `AI_GRADED` có field final/review không được phép | 0 |
| `COMPLETED` thiếu score/reviewer/timestamps | 0 |
| Grading trên `IN_PROGRESS` | 0 |
| Annotation AI `PENDING` ở grading `COMPLETED` | 0 |
| Annotation AI không `PENDING` ở grading `AI_GRADED` | 0 |
| Transcript JSONB không hợp lệ | 0 |
| Manual grading có annotation ngoài khoảng 2–5 | 0 |
| Offset content/file/audio không hợp lệ | 0 |
| Annotation trên Reading/Listening | 0 |
| Snapshot `ai_instruction` không khớp | 0 |

Phân bố grading:

```text
READING   GRADED    AUTO            COMPLETED  45
LISTENING GRADED    AUTO            COMPLETED  45
WRITING   SUBMITTED TEACHER_MANUAL AI_GRADED  148
WRITING   GRADED    TEACHER_MANUAL COMPLETED  45
SPEAKING  SUBMITTED TEACHER_MANUAL AI_GRADED  148
SPEAKING  GRADED    TEACHER_MANUAL COMPLETED  45
```

Sau khi rerun, ID reset đúng:

```text
gradings:            476 rows, IDs 1–476
answer_annotations:  798 rows, IDs 1–798
```

---

## Mock Data Task 7 — Grading Change Logs

### Chạy seed

```bash
./gradlew bootRun --args='--spring.profiles.active=dev,seed'
```

Task 7 chạy sau Task 1–6 nhờ `@Profile("seed")` và `@Order(7)`. Seeder chỉ dùng native query cho:

```sql
TRUNCATE grading_change_logs RESTART IDENTITY;
```

Các grading `COMPLETED` được đọc bằng `GradingRepository`, xáo trộn bằng seed cố định và chọn động 10% số lượng thực tế. Hiện có 180 grading `COMPLETED`, chọn 18 grading; 2 grading trong nhóm được tạo 2 log, các grading còn lại có 1 log.

`old_score` ban đầu lệch `final_score` hiện tại từ 0.5 đến 1.0 điểm. Với grading có 2 log, log đầu dùng điểm trung gian và log cuối có `new_score` bằng đúng `gradings.final_score` hiện tại. Mỗi log vẫn không lệch quá 1 điểm.

Theo chốt tạm thời của PM từ Task 6, các submission mẫu tương lai được giữ nguyên. Vì vậy 1 log có `changed_at > NOW()`; log này vẫn có `changed_at > graded_at`.

### Kết quả Check

| Kiểm tra | Kết quả |
| --- | ---: |
| Grading có log | 18 |
| Tổng số log | 20 |
| Latest `new_score` mismatch với `gradings.final_score` | 0 |
| `changed_by` mismatch với `reviewed_by` | 0 |
| `changed_at <= graded_at` | 0 |
| Log trên grading không phải `COMPLETED` | 0 |
| Initial score delta ngoài 0.5–1.0 | 0 |
| Max delta giữa hai bước | 1.00 |
| Log tương lai theo ngoại lệ đã duyệt | 1 |

Sau khi rerun, ID reset đúng: `grading_change_logs` có 20 dòng với ID `1–20`.

---

## Mock Data Task 8 — Refresh Tokens và Student Evaluations

### Chạy seed

```bash
./gradlew bootRun --args='--spring.profiles.active=dev,seed'
```

Task 8 chạy sau Task 1–7 nhờ `@Profile("seed")` và `@Order(8)`. Seeder chỉ dùng native query cho:

```sql
TRUNCATE refresh_tokens, student_evaluations RESTART IDENTITY;
```

Các bảng còn lại được đọc bằng Repository và ghi bằng `saveAll`.

`token_hash` được sinh từ 32 bytes `SecureRandom`, chuyển thành hex 64 ký tự và kiểm tra thêm bằng `Set` runtime. Dữ liệu có 1–3 token/user, phân bổ 60% active, 20% revoked và 20% expired.

`student_evaluations` chỉ được tạo khi học viên thực sự có trong `class_members` và lớp có `teacher_id`. Học viên chưa có lớp được xem là đang chờ xếp lớp nên không có evaluation; không sửa hoặc rerun Task 2.

### Kết quả Check

| Kiểm tra | Kết quả |
| --- | ---: |
| Duplicate `token_hash` | 0 |
| `revoked_at >= expires_at` | 0 |
| Evaluation có class không thuộc học viên | 0 |
| `teacher_id` lệch `classes.teacher_id` | 0 |
| Token active / revoked / expired | 104 / 34 / 34 |
| User ngoài 1–3 token | 0 |
| Học viên có lớp hợp lệ ngoài 1–3 evaluation | 0 |
| Token hash/IP sai format | 0 |

Tổng dữ liệu:

```text
refresh_tokens:       172 rows, IDs 1–172
student_evaluations:   97 rows, IDs 1–97
```

Trong 80 học viên, 56 học viên có lớp được phân evaluation; 24 học viên chưa có lớp đang chờ xếp lớp.

---

## Mock Data Task 9 — Validation

### Chạy validation

Từ thư mục `backend/`:

```bash
./gradlew bootRun --args='--spring.profiles.active=dev,seed'
```

Runner `MockDataValidationRunner` chạy cuối cùng bằng `@Profile("seed")` và
`@Order(9)`. Runner chỉ thực hiện các câu `SELECT`; không insert, update,
delete hoặc truncate dữ liệu.

Các kiểm tra gồm:

1. FK mồ côi trên toàn bộ quan hệ của 16 bảng.
2. Khoảng thời gian assignment.
3. `submitted_at` của submission không còn `IN_PROGRESS`.
4. Parse toàn bộ JSON answer có `question_id`.
5. Đúng một nguồn answer trong `content`, `audio_storage_key`, `doc_storage_key`.
6. `final_score` không vượt `max_score_snapshot`.
7. `new_score` của latest change log khớp grading hiện tại.
8. Tổng số dòng của 16 bảng.
9. Submission module `GRADED` phải có grading `COMPLETED`.

Mục 7 lấy latest log bằng:

```sql
ROW_NUMBER() OVER (PARTITION BY grading_id ORDER BY changed_at DESC, id DESC)
```

Kết quả được in ra console; bản report được giữ ở mục “Task 9 — Validation report output” bên dưới.

### Kết quả Check

Toàn bộ 9 mục đều `PASS`, mỗi mục có `0` violation. Bảng summary có đủ 16
bảng. File report đầy đủ được gộp ở mục “Task 9 — Validation report output” bên dưới.

---

## Task 9 — Validation report output

Source: `mock-data-task-09-validation-report.txt`.

```text
================ Task 9 Validation Report ================
Generated at: 2026-09-24T20:26:34.965246659+07:00
Scope: read-only SELECT validation; no database mutation.
Latest log rule: ROW_NUMBER() OVER (PARTITION BY grading_id ORDER BY changed_at DESC, id DESC).

[1] No orphan foreign keys
PASS - violations: 0

[2] Assignments have open_at before close_at
PASS - violations: 0

[3] Non-IN_PROGRESS submissions have submitted_at
PASS - violations: 0

[4] Question answers contain valid JSON
PASS - violations: 0

[5] Each answer has exactly one content source
PASS - violations: 0

[6] Grading final_score does not exceed max_score_snapshot
PASS - violations: 0

[7] Latest grading change log matches final_score
PASS - violations: 0

[8] All 16 table row counts are available
PASS - violations: 0
  TABLE SUMMARY
  table_name | row_count
  users | 91
  teacher_profiles | 8
  student_profiles | 80
  classes | 6
  class_members | 92
  assignments | 17
  modules | 68
  questions | 264
  submissions | 217
  submission_modules | 868
  answers | 3400
  answer_annotations | 798
  gradings | 476
  refresh_tokens | 172
  student_evaluations | 97
  grading_change_logs | 20

[9] GRADED submission modules have COMPLETED grading
PASS - violations: 0

OVERALL: PASS (failed checks: 0)
```
