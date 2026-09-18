# Mock Data Task 9 — Validation

## Chạy validation

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

Kết quả được in ra console và lưu tại:
`production_artifacts/be_to_tester/mock-data-task-09-validation-report.txt`.

## Kết quả Check

Toàn bộ 9 mục đều `PASS`, mỗi mục có `0` violation. Bảng summary có đủ 16
bảng. File report đầy đủ được lưu trong `mock-data-task-09-validation-report.txt`.
