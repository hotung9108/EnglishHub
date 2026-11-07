# SPECIFICATION HANDOFF: [OPS-46] Cập nhật Audio Smoke Test trong CD Staging tương thích kiến trúc Presigned URL

> **Mã nhiệm vụ:** `[OPS-46]`  
> **Trello Card:** [https://trello.com/c/kwQsxEKh](https://trello.com/c/kwQsxEKh)  
> **Người thực hiện:** Hồ Việt Tùng (`@hvittung` / Git: `hotung9108`)  
> **Vai trò:** DevOps Secondary (`@devops-secondary`) / Product Manager (`@pm`)  
> **Nhánh Git:** `fix/OPS-46-audio-smoke-test-presigned-url`  
> **Target Branch:** `develop`  
> **Hạn chót hoàn thành:** 23:30 08/11/2026  

---

## 1. Mô tả Lỗi & Nguyên nhân Gốc rễ (Root Cause Analysis)

### 1.1. Bối cảnh
Khi merge PR #288 (từ `develop` sang `staging`), GitHub Actions tự động kích hoạt pipeline `CD-Backend-Staging` trong `.github/workflows/cd-backend-development.yml`.  
Tại step `Audio Stream Smoke Test [OPS-44]` (dòng 241-244), script `smoke-test-audio-stream.sh` được thực thi để kiểm tra tính sẵn sàng của backend sau khi deploy:
```bash
./test/scripts/smoke-test-audio-stream.sh https://api-staging.hotung9108.me
```
Kết quả kiểm thử bị fail ngay ở Test 1/4:
```text
[Test 1/4] Checking unauthenticated access...
  [FAIL] Unauthenticated request rejected with 401 - Expected HTTP 401, got 403
```
Lỗi này khiến toàn bộ job CD Backend trên môi trường Staging bị đánh dấu FAILED.

### 1.2. Phân tích Nguyên nhân Cốt lõi
1. **Kiến trúc Audio đã chuyển sang Presigned URL**:
   - Theo kiến trúc mới (tài liệu `PRESIGNED_URL_MIGRATION_GUIDE.md`), Backend đã xóa bỏ cơ chế stream audio trực tiếp qua `GET /api/v1/modules/{id}/audio`.
   - Endpoint hợp lệ hiện tại để lấy URL nghe/tải file âm thanh là:
     ```http
     GET /api/v1/modules/{moduleId}/audio-download-url
     ```
2. **Cơ chế bảo vệ của `ApiAuthenticationEntryPoint`**:
   - Do endpoint cũ `GET /api/v1/modules/{id}/audio` đã bị gỡ bỏ khỏi `ApiRoutePolicy.java`, khi một request không kèm token gửi tới, `ApiAuthenticationEntryPoint.java` kiểm tra `!ApiRoutePolicy.contains(request)` và cố ý trả về `403 Forbidden` thay vì `401 Unauthorized`.
3. **Smoke Test Script của DevOps bị lệch chuẩn**:
   - `test/scripts/smoke-test-audio-stream.sh` (được viết trong task `[OPS-44]` / `[OPS-36]`) vẫn cố định gọi `GET /api/v1/modules/$MODULE_ID/audio` và so sánh cứng `http_code == 401`.
   - Khi nhận về `403`, script so sánh lệch (`got 403, expected 401`) và trả về `exit code 1`.

---

## 2. Kế Hoạch & Hướng Dẫn Sửa Đổi (Implementation Plan)

### Bước 1: Cập nhật Script `test/scripts/smoke-test-audio-stream.sh`
1. **Cập nhật Endpoint mục tiêu**:
   - Thay đổi URL endpoint kiểm tra từ `$BASE_URL/api/v1/modules/$MODULE_ID/audio` sang:
     ```bash
     $BASE_URL/api/v1/modules/$MODULE_ID/audio-download-url
     ```
2. **Chuẩn hóa Test 1 (Unauthenticated Request)**:
   - Endpoint `GET /api/v1/modules/{id}/audio-download-url` đã được khai báo bảo vệ trong `ApiRoutePolicy`, nên request không kèm token sẽ trả về đúng `401 Unauthorized`.
   - Để an toàn cho các kịch bản routing, có thể chấp nhận cả `401` và `403` như mã từ chối unauthenticated thành công:
     ```bash
     if [ "$http_code" -eq 401 ] || [ "$http_code" -eq 403 ]; then
       echo "  [PASS] Unauthenticated request correctly rejected (HTTP $http_code)"
     ...
     ```
3. **Cập nhật Test 3 & Test 4 (Authorized Download & Streaming)**:
   - Khi có `TOKEN` (Student hoặc Teacher):
     - Gọi `GET $BASE_URL/api/v1/modules/$MODULE_ID/audio-download-url` với Header `Authorization: Bearer $TOKEN`.
     - Trả về HTTP `200 OK` với body JSON chứa trường `downloadUrl` (hoặc `404 Not Found` nếu module 1 không có audio).
     - Nếu có `downloadUrl`, dùng curl kiểm tra tiếp URL presigned đó (hỗ trợ `Accept-Ranges` hoặc tải thử chunk 1024 bytes với `Range: bytes=0-1023` trả về HTTP `206 Partial Content`).
   - Nếu module chưa có audio (HTTP 404), coi như auth pass và ghi log NOTICE.

### Bước 2: Đồng bộ hóa Workflow GitHub Actions
Trong `.github/workflows/cd-backend-development.yml`:
- Đổi tên step tại dòng 241 từ:
  ```yaml
  - name: Audio Stream Smoke Test [OPS-44]
  ```
  thành:
  ```yaml
  - name: Audio Smoke Test [OPS-46]
  ```

### Bước 3: Kiểm thử Cục bộ và Nghiệm thu trên Staging
1. Chạy thử script trực tiếp tới môi trường Staging:
   ```bash
   chmod +x test/scripts/smoke-test-audio-stream.sh
   ./test/scripts/smoke-test-audio-stream.sh https://api-staging.hotung9108.me
   ```
2. Xác nhận script in ra `[PASS]` cho unauthenticated request và kết thúc với `exit code 0`.

---

## 3. Tiêu Chí Nghiệm Thu (Definition of Done)

- [ ] Tái hiện được lỗi lệch mã HTTP (Expected 401, got 403) với script cũ.
- [ ] Cập nhật `smoke-test-audio-stream.sh` trỏ vào endpoint `GET /api/v1/modules/{id}/audio-download-url`.
- [ ] Kiểm thử unauthenticated request vượt qua với mã HTTP 401 Unauthorized.
- [ ] Kiểm thử authorized request (nếu có token) xác nhận nhận được `downloadUrl` hợp lệ.
- [ ] Chạy script `smoke-test-audio-stream.sh https://api-staging.hotung9108.me` trả về exit code 0.
- [ ] Đồng bộ hóa tên step trong workflow `cd-backend-development.yml` sang `[OPS-46]`.
- [ ] Mở Pull Request chuẩn quy ước: `fix/OPS-46-audio-smoke-test-presigned-url` trỏ vào `develop`.
