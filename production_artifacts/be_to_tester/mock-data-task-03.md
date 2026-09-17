# Task 3 — Mock Assignments, Modules, and Questions

## Run

From `backend/`:

```bash
./gradlew bootRun --args='--spring.profiles.active=dev,seed'
```

The shared `seed` profile runs Task 1, Task 2, and then Task 3 in `@Order`
sequence. Task 3 uses the class IDs persisted by Task 2.

## Expected result

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

## Suggested SQL checks

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
