# EnglishHub Data Mock Guide

Tài liệu và code seeder được chia sẻ qua Git; dữ liệu trong database không tự
đi theo Git. Mỗi thành viên muốn có cùng dataset cần chạy seeder trên database
local của mình.
Mock data chỉ dùng cho development/testing local, không chạy trên staging,
production hoặc database dùng chung.

## 1. Phạm vi

- Schema dùng đúng hai migration hiện tại: `V1__init_schema.sql` và
  `V2__update_schema_to_v6.sql`.
- Toàn bộ mock data viết bằng Java/Spring Data JPA.
- Seeder nằm trong `com.english_hub.backend.seed` và chạy theo một profile
  chung là `seed`, không dùng `--seed-task`.
- Thứ tự chạy được điều khiển bằng `@Order(1)` đến `@Order(9)`.
- `docs/Datamock/` chỉ là tài liệu tham chiếu cũ, không cần đưa lên Git.

## 2. Chuẩn bị database local

Từ thư mục gốc repository:

```bash
docker compose -f database/docker-compose.dev.yml up -d
```

Thiết lập mặc định:

```text
Host: localhost
Port: 5432
Database: appdb
User: devuser
Password: devpassword
```

Có thể ghi đè bằng các biến `DB_PORT`, `DB_NAME`, `DB_USER` và
`DB_PASSWORD`. Chỉ chạy một mode database tại một thời điểm; root
`docker-compose.dev.yml` là mode full-stack riêng và dùng container/network
khác.

## 3. Chạy toàn bộ mock data

Từ thư mục `backend/`:

```bash
./gradlew bootRun --args='--spring.profiles.active=dev,seed'
```

Flyway chạy migration trước, sau đó các runner thực hiện theo thứ tự:

| Order | Runner | Dữ liệu |
| ---: | --- | --- |
| 1 | `MockDataSeeder` | users, teacher_profiles, student_profiles |
| 2 | `ClassMockDataSeeder` | classes, class_members |
| 3 | `AssignmentMockDataSeeder` | assignments, modules, questions |
| 4 | `SubmissionMockDataSeeder` | submissions, submission_modules |
| 5 | `AnswerMockDataSeeder` | answers |
| 6 | `GradingMockDataSeeder` | gradings, answer_annotations |
| 7 | `GradingChangeLogMockDataSeeder` | grading_change_logs |
| 8 | `MiscMockDataSeeder` | refresh_tokens, student_evaluations |
| 9 | `MockDataValidationRunner` | chỉ SELECT và báo cáo validation |

Mỗi lần chạy sẽ reset các bảng mock liên quan bằng `TRUNCATE ... RESTART
IDENTITY`; Task 1 có `CASCADE` nên có thể xoá toàn bộ dữ liệu phụ thuộc để
seed lại từ đầu. Vì vậy tuyệt đối không trỏ lệnh này vào database dùng chung.

## 4. Kết quả mẫu hiện tại

Sau một lần seed thành công, số dòng mẫu là:

| Bảng | Số dòng |
| --- | ---: |
| users | 91 |
| teacher_profiles | 8 |
| student_profiles | 80 |
| classes | 6 |
| class_members | 92 |
| assignments | 17 |
| modules | 68 |
| questions | 264 |
| submissions | 217 |
| submission_modules | 868 |
| answers | 3400 |
| answer_annotations | 798 |
| gradings | 476 |
| refresh_tokens | 172 |
| student_evaluations | 97 |
| grading_change_logs | 20 |

Một số quy ước dữ liệu đã được duyệt:

- Có 3 admin, 8 teacher, 80 student; đúng 4 student ở trạng thái `LOCKED`.
- Có 24 student chưa thuộc lớp có teacher và được xem là đang chờ xếp lớp,
  nên chưa có student evaluation.
- Log sửa điểm dùng độ lệch 0.5–1.0 theo quyết định tạm thời của PM.
- Một số mốc thời gian mẫu có thể ở tương lai theo ngoại lệ đã duyệt cho mock
  data; đây không phải dữ liệu production.

## 5. Validation sau khi seed

Runner Task 9 tự chạy cuối command và kiểm tra:

1. FK mồ côi.
2. Khoảng thời gian assignment.
3. `submitted_at` của submission không còn `IN_PROGRESS`.
4. JSON answer.
5. Đúng một nguồn answer.
6. Giới hạn `final_score`.
7. Latest grading change log khớp điểm hiện tại.
8. Row count của 16 bảng nghiệp vụ.
9. Submission module `GRADED` phải có grading `COMPLETED`.

Report được in ra console và ghi tại:

```text
production_artifacts/be_to_tester/mock-data-task-09-validation-report.txt
```

Khi có check `FAIL`, runner vẫn chạy hết các mục rồi mới báo lỗi; không tự sửa
dữ liệu hoặc các seeder Task 1–8.

## 6. Kiểm tra code trước khi handoff

Từ thư mục `backend/`:

```bash
./gradlew test
```

Khi không cần chạy nữa, dừng backend bằng `Ctrl+C`. Có thể dừng PostgreSQL
local bằng:

```bash
docker compose -f database/docker-compose.dev.yml down
```

Không dùng `down -v` trừ khi thực sự muốn xoá volume database local.

## 7. Lưu ý khi commit

- Không commit `docs/Datamock/` nếu chỉ dùng làm tài liệu tham chiếu local.
- Không commit các file report/runtime tạm nếu team không cần handoff chúng.
- Không bật profile `seed` trong CI/CD hoặc môi trường dùng chung.
- `DATAMOCK_GUIDE.md` là runbook dùng chung cho team; các file mock entity,
  repository và seeder nằm trong `backend/src/main/java` để ứng dụng có thể
  dùng lại sau này.
