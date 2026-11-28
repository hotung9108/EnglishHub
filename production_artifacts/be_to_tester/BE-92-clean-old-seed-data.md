# BE-92 — Bàn giao làm sạch dữ liệu seed cũ

## Mục đích

`database/clean-old-seed-data.sql` đếm dữ liệu khi chạy dry-run. Chế độ xóa
làm sạch toàn bộ 16 bảng nghiệp vụ và reset 14 sequence trong một transaction.
Script chỉ commit sau khi xác nhận các bảng rỗng, sequence về điểm bắt đầu và
`public.flyway_schema_history` giống bản chụp trước khi xóa. Sau khi commit,
không còn tài khoản đăng nhập, kể cả ADMIN, cho đến khi seed Release v1.0.0
được nạp. MinIO ngoài phạm vi BE-92. DevOps xử lý dữ liệu MinIO riêng.

## Checklist DevOps trước khi xóa

1. Xác nhận cửa sổ bảo trì, bản sao lưu và DB cần dọn. Kiểm tra host/port của
   cấu hình backend và **đọc tận mắt tên DB** trong cấu hình lẫn đầu ra psql.
   Guard của script chỉ tìm marker `prod`, `production`, `live` trong tên DB.
   Một DB production có tên trung tính vẫn có thể vượt qua guard.
2. Các lệnh psql thủ công ở đây chỉ dùng `be92_sandbox` và DB tạm thuộc
   `be92_*_check`, `be92_partial_check_*`, `be92_special_*_check`. Luôn
   truyền `-d` tường minh. Nếu DB thật nằm ngoài allowlist, dừng và xác nhận
   phạm vi riêng trước khi chạy bất kỳ lệnh psql nào.
3. Chặn deploy staging và timer/job có thể tự bật lại backend. Dừng service
   staging theo lệnh dưới đây, rồi đóng IDE, worker, pool và các kết nối khác
   tới DB đích. Giữ deploy/timer bị chặn đến khi hoàn tất cửa sổ bảo trì.

   ```sh
   docker compose -f docker-compose.staging.yml stop --timeout 60 backend-staging
   ```

4. Chạy truy vấn dưới đây trên đúng cụm kiểm thử để cùng lúc xác nhận tên DB
   và số session khác. Chỉ tiếp tục khi tên khớp hoàn toàn và kết quả là `0`.
   Script tự kiểm lại điều kiện này khi xóa.

   ```sh
   psql -X -At -d be92_sandbox -c 'SELECT current_database(), count(*) FROM pg_catalog.pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid();'
   ```

## Lệnh chạy và mã thoát

Dùng role có quyền đọc các bảng, sequence và Flyway, tạo bảng tạm, làm sạch
các bảng và đặt lại các sequence thuộc sở hữu của bảng. Chạy từ thư mục gốc
repo. Để script tự quản lý transaction.

```sh
# Dry-run: xem Preflight OK và 16 số đếm.
psql -X -d be92_sandbox -f database/clean-old-seed-data.sql; echo "exit=$?"

# Xóa: chỉ chạy sau khi xác nhận đúng DB và không có session khác.
psql -X -d be92_sandbox -v 'BE92_CONFIRM_DELETE=DELETE_BE92_DATA:be92_sandbox' -f database/clean-old-seed-data.sql; echo "exit=$?"
```

Token phải có dạng `DELETE_BE92_DATA:<tên_db_chính_xác>`. Với DB tạm chứa
khoảng trắng hoặc dấu nháy đơn, đặt tên trong biến shell và truyền
`-d "$db" -v "BE92_CONFIRM_DELETE=DELETE_BE92_DATA:$db"`.

| Mã | Ý nghĩa |
| --- | --- |
| `0` | Dry-run trả đủ số đếm, hoặc chế độ xóa đã commit và in tóm tắt 16 bảng, 14 sequence. |
| `1` | Lỗi nghiêm trọng của psql, ví dụ không đọc được file script. |
| `2` | Kết nối PostgreSQL thất bại hoặc bị mất. Nếu mất kết nối quanh thời điểm commit, kiểm tra lại trạng thái DB trước khi thử lại. |
| `3` | Guard, token, preflight hoặc SQL từ chối. Lỗi trước commit làm transaction xóa rollback. Đọc lỗi và xử lý nguyên nhân trước khi thử lại. |

## PH-03 — Tester xác nhận backend sau khi dọn

1. Sau khi lệnh xóa trả `0`, giữ deploy tự động và timer bị chặn. Dùng backend
   kiểm thử trỏ **đúng** vào `be92_sandbox` đã dọn. Kiểm tra profile thực tế
   không có `seed` và không bật bất kỳ job nạp fixture nào.
2. Khởi động backend bình thường, kiểm tra log khởi động không có lỗi kết nối
   PostgreSQL và endpoint `/actuator/health` của instance đó báo `UP`.
   Kiểm tra log không có seeder chạy.
3. Trên cùng DB, xác nhận số dòng `public.users` bằng `0`.

   ```sh
   psql -X -d be92_sandbox -At -c 'SELECT current_database(), count(*) FROM public.users;'
   ```

4. Tester lưu output `be92_sandbox|0`, trạng thái health và profile đang bật.
   Chỉ đánh dấu PH-03 đạt khi cả ba bằng chứng khớp. Runner SQL không khởi động
   backend, nên PH-03 được kiểm thủ công trước khi nạp seed Release v1.0.0.
