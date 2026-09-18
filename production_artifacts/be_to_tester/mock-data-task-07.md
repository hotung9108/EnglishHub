# Mock Data Task 7 — Grading Change Logs

## Chạy seed

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

## Kết quả Check

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
