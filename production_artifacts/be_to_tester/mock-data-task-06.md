# Mock Data Task 6 — Gradings và Answer Annotations

## Chạy seed

```bash
./gradlew bootRun --args='--spring.profiles.active=dev,seed'
```

Task 6 chạy sau Task 1–5 nhờ `@Profile("seed")` và `@Order(6)`. Seeder chỉ dùng native query cho:

```sql
TRUNCATE answer_annotations, gradings RESTART IDENTITY CASCADE;
```

Các bảng còn lại được đọc bằng Repository; `gradings` và `answer_annotations` được ghi bằng `saveAll`.

`final_score` của grading `AUTO` được đọc lại từ `answers.content` và cộng field `score` trong JSON. `SPEAKING.ai_transcript` được tạo và parse lại trước khi lưu; entity map các enum PostgreSQL bằng `@JdbcTypeCode(SqlTypes.NAMED_ENUM)` và transcript bằng JSONB.

Theo chốt tạm thời của PM, các submission mẫu có `submitted_at` tương lai vẫn được giữ nguyên; vì vậy 20 grading `COMPLETED` có `graded_at > NOW()`. Tất cả các dòng vẫn bảo đảm `graded_at > submitted_at`.

## Kết quả Check

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
