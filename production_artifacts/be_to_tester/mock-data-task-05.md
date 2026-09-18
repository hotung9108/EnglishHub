# Mock Data Task 5 — Answers

## Chạy seed

```bash
./gradlew bootRun --args='--spring.profiles.active=dev,seed'
```

Task 5 chạy sau Task 1–4 nhờ `@Profile("seed")` và `@Order(5)`. Seeder chỉ truncate bảng `answers`; các bảng `submission_modules` và `questions` được đọc lại bằng repository.

Lưu ý tạm thời: schema hiện tại giới hạn `doc_mime_type` ở `VARCHAR(50)`, nên mock dùng `application/octet-stream` cho file `.docx`. MIME chuẩn `.docx` sẽ được cập nhật sau khi team thống nhất schema.

## Kiểm tra bắt buộc

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
