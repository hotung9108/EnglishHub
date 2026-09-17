# Mock Data Task 4 — Submissions

## Chạy seed

```bash
./gradlew bootRun --args='--spring.profiles.active=dev,seed'
```

Task 4 chạy sau Task 1–3 nhờ `@Profile("seed")` và `@Order(4)`. Seeder chỉ dùng native query cho:

```sql
TRUNCATE submission_modules, submissions RESTART IDENTITY CASCADE;
```

Các bản ghi còn lại được tạo bằng Spring Data JPA `saveAll`.

## Kiểm tra

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
