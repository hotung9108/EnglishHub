# Mock Data Task 8 — Refresh Tokens và Student Evaluations

## Chạy seed

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

## Kết quả Check

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
