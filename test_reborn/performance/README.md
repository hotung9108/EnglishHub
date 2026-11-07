# Kiểm thử Hiệu năng & Áp lực (Performance & Load Testing)

Hướng dẫn chạy các kịch bản kiểm thử tải thực tế với công cụ **k6** (thay thế hoàn toàn các file placeholder cũ).

## Yêu cầu cài đặt
- Tải k6 từ [k6.io](https://k6.io) hoặc chạy qua Docker: `docker run --rm -i grafana/k6 run - <scenarios/auth-login-load.js`

## Danh mục Kịch bản
1. `scenarios/auth-login-load.js`:
   - Kiểm tra khả năng xử lý đăng nhập đồng thời lên đến 50 người dùng trong giờ cao điểm.
   - Ngưỡng SLA: 95% request $< 1.5s$, tỷ lệ lỗi $< 1\%$.
2. `scenarios/submission-burst-load.js`:
   - Mô phỏng 35 học sinh cùng nộp bài sát giờ nộp (Burst Submission).
   - Ngưỡng SLA: 95% request $< 2.5s$, tỷ lệ lỗi $< 2\%$.

## Lệnh thực thi
```sh
# Chạy kịch bản đăng nhập với mục tiêu môi trường Staging
k6 run scenarios/auth-login-load.js

# Chạy kịch bản nộp bài trên môi trường Staging
k6 run -e TARGET_URL=https://api-staging.hotung9108.me/api/v1 -e STUDENT_TOKEN="<jwt-token>" scenarios/submission-burst-load.js
```
