# EnglishHub Seed Accounts

Tổng hợp các tài khoản mẫu (seed/mock) có trong dự án, phục vụ phát triển và kiểm thử.
Tài liệu này chỉ liệt kê thông tin đã có sẵn trong code/config, không tự tạo dữ liệu.

## 1. Tài khoản mock ở Frontend

Nguồn: [README.md](../../README.md#L152-L156), `frontend/src/pages/Settings.tsx` (nút chuyển role nhanh).

| Vai trò | Email đăng nhập | Mật khẩu | Ghi chú |
| :--- | :--- | :--- | :--- |
| Quản trị viên (Admin) | `admin@eh.com` | `password123` | Toàn quyền quản trị hệ thống |
| Giáo viên (Teacher) | `teacher@eh.com` | `password123` | Tạo bài tập, cấu hình module, chấm bài |
| Học sinh (Student) | `student@eh.com` | `password123` | Làm bài, nộp bài trắc nghiệm và file ghi âm |

> Đây là tài khoản mock dùng cho frontend khi chưa nối backend thật.

## 2. Tài khoản seed thật của Backend

Nguồn: `backend/src/main/java/com/english_hub/core/infrastructure/seed/MockDataSeeder.java`.

- Profile: `seed` (chạy kèm `dev`: `./gradlew bootRun --args='--spring.profiles.active=dev,seed'`).
- Mật khẩu chung: `Password123!` (lưu dạng BCrypt).
- Số lượng sinh ra: **3 admin / 8 teacher / 80 student**.
- Email **sinh ngẫu nhiên từ pool tên** (deterministic với `RANDOM_SEED = 42L`):
  - Admin: đuôi `@utc-polyglot.edu.vn`
  - Teacher & Student: đuôi `@gmail.com`
- Vì sinh ngẫu nhiên nên **không có email cố định** — cần chạy seeder để lấy email thực tế.

## 3. Tài khoản test config

Nguồn: `test/config/dev.json`, `test/config/staging.json`, `test/fixtures/testdata/users.dev.json`.

| Vai trò | Email đăng nhập | Mật khẩu |
| :--- | :--- | :--- |
| Quản trị viên (Admin) | `admin@utc-polyglot.edu.vn` | `Password123!` |
| Giáo viên (Teacher) | `teacher01@gmail.com` | `Password123!` |
| Học sinh (Student) | `sv000001@gmail.com` | `Password123!` |

## 4. Tài khoản student đã verify thực tế

Nguồn: `production_artifacts/be_to_tester/submissions-api-phase1-testing.md`, `.agents/tasks/be-secondary/done/BE-TASK-6.yaml`.

| Vai trò | Email đăng nhập | Mật khẩu |
| :--- | :--- | :--- |
| Học sinh (Student) | `vo.bao.quynh@gmail.com` | `Password123!` |

## 5. Lưu ý quan trọng

- Tài khoản frontend (`@eh.com` / `password123`) và tài khoản backend seed (`@gmail.com` / `@utc-polyglot.edu.vn` / `Password123!`) **không khớp nhau**.
- Muốn đăng nhập backend thật, cần chạy seeder và lấy email thực tế. Log runtime in ra `Runtime IDs` nhưng **không in email**; có thể truy vấn database sau khi seed:
  ```sql
  SELECT email, role, status FROM users ORDER BY id;
  ```
- Không bật profile `seed` trên staging/production hoặc database dùng chung (xem `DATAMOCK_GUIDE.md`).
