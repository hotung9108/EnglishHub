# Hướng dẫn Kiểm thử Frontend & Hosting: SPA Routing Fallback (Fix lỗi 404 khi Refresh/Mở trực tiếp URL con)

**Người thực hiện**: @devops-secondary (hotung9108) & @fe-primary (Maloque18705)  
**Người nhận**: @tester (Zawn-Tsu)  
**Mã lỗi khắc phục**: QA29-039, QA29-042 (Package QA-29) - [OPS-41][ISSUE #159]  
**Môi trường**: `staging.hotung9108.me` (Hosting: Vercel Edge; API: `api-staging.hotung9108.me/api/v1`) & Production `hotung9108.me`  
**Ngày cập nhật**: 2026-10-27  

---

## 1. Tổng quan nguyên nhân và giải pháp

### Nguyên nhân lỗi
- Môi trường Staging và Production được triển khai lên Vercel Edge.
- Vite build ứng dụng Single Page Application (SPA) với entry point duy nhất `dist/index.html`.
- Khi người dùng điều hướng qua menu ứng dụng, `react-router-dom` xử lý client-side routing mượt mà.
- Tuy nhiên, khi người dùng **F5 / Refresh** hoặc **truy cập trực tiếp URL con** (ví dụ `/teacher/profile`, `/teacher/classes/126/progress`), trình duyệt gửi HTTP GET request lên máy chủ hosting. Nếu thiếu cấu hình SPA rewrite hoặc cấu hình chưa đồng bộ lên branch `main`, Vercel không tìm thấy file tĩnh tương ứng và trả về màn hình lỗi hosting: `404: NOT_FOUND This page could not be found`.

### Giải pháp kỹ thuật đã áp dụng
- Bổ sung/cập nhật file cấu hình `frontend/vercel.json`:
  ```json
  {
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "cleanUrls": false,
    "rewrites": [
      {
        "source": "/((?!api/).*)",
        "destination": "/index.html"
      }
    ]
  }
  ```
- Cập nhật `frontend/nginx.conf` với header `Cache-Control "no-store, no-cache, must-revalidate"` cho `/index.html` trong môi trường Docker container.
- **Nguyên lý hoạt động**:
  1. Các tài nguyên tĩnh thực tế (`/assets/*.js`, `/assets/*.css`, file ảnh, favicon) được Vercel tự động ưu tiên phân phối trực tiếp.
  2. Toàn bộ các route con của SPA (loại trừ `/api/`) được rewrite nội bộ về `index.html` với HTTP Status 200, cho phép React Router và AuthGuard khởi chạy bình thường.
  3. Bất kỳ request nào bắt đầu bằng `/api/` không tồn tại sẽ trả đúng mã `404 Not Found`, không bị rewrite nhầm sang trang HTML.
  4. Route không tồn tại trong hệ thống sẽ được React Router so khớp với `<Route path="*" element={<NotFound />} />` và hiển thị giao diện EnglishHub NotFound thay vì lỗi hosting 404 thô.

---

## 2. Kịch bản kiểm thử bàn giao cho QA/Tester (Retest Scenarios)

| Mã test | Kịch bản | URL kiểm thử | Thao tác thực hiện | Kết quả mong đợi |
|:---|:---|:---|:---|:---|
| **TC-SPA-01** | Refresh trang khi đã đăng nhập (Teacher Profile) | `https://staging.hotung9108.me/teacher/profile` | 1. Đăng nhập Teacher.<br>2. Vào `/teacher/profile`.<br>3. Nhấn **F5** hoặc **Ctrl + R**. | Ứng dụng nạp lại thành công, duy trì phiên đăng nhập, không trả về trang lỗi hosting 404. Hiển thị thông tin hồ sơ giáo viên. |
| **TC-SPA-02** | Mở trực tiếp URL có dynamic param (Class Progress) | `https://staging.hotung9108.me/teacher/classes/126/progress` | 1. Đăng nhập Teacher.<br>2. Mở tab mới hoặc dán trực tiếp URL vào thanh địa chỉ. | Ứng dụng nạp `index.html`, gọi API `GET /classes/126` (200 OK) và render màn hình tiến độ lớp 126 (hoặc từ chối quyền nếu không phải giáo viên phụ trách). |
| **TC-SPA-03** | Mở trực tiếp URL con khi chưa đăng nhập (Auth Guard) | `https://staging.hotung9108.me/teacher/settings` | 1. Mở cửa sổ ẩn danh (chưa đăng nhập).<br>2. Dán trực tiếp URL vào thanh địa chỉ. | Ứng dụng tải thành công `index.html`, `ProtectedRoute` phát hiện chưa xác thực và redirect an toàn về `/login`. |
| **TC-SPA-04** | Truy cập route không tồn tại (Catch-all 404) | `https://staging.hotung9108.me/random-non-existent-page` | Mở trực tiếp URL không có trong hệ thống. | Ứng dụng nạp React và hiển thị giao diện `NotFound` của EnglishHub (có logo, nút "Quay về trang chủ" và nút chuyển đổi ngôn ngữ), **không phải** màn hình 404 thô của Vercel. |
| **TC-SPA-05** | Tính toàn vẹn của Static Assets | `https://staging.hotung9108.me/assets/...` | Mở F12 -> tab Network, reload trang. | Tất cả file `.js`, `.css`, SVG/PNG tải thành công với HTTP 200/304, không bị rewrite nhầm thành file `index.html`. |
| **TC-SPA-06** | Phân biệt API Endpoint không tồn tại | `https://staging.hotung9108.me/api/v1/non-existent-endpoint` | Gửi HTTP GET hoặc dùng curl kiểm tra. | Trả về HTTP Status `404 Not Found`, **không** trả về HTTP 200 kèm HTML `index.html`. |

---

## 3. Lưu ý khi Retest
- Thực hiện hard refresh (`Ctrl + Shift + R` hoặc xóa cache) để đảm bảo trình duyệt nhận bản build mới sau khi Vercel deploy hoàn tất.
- Khi kiểm thử TC-SPA-02, đảm bảo fixture class ID tồn tại trong DB staging (hoặc tạo lớp mới để test với ID tương đương nếu ID 126 đã bị cleanup).
- Để kiểm tra trên Production, cần hoàn tất merge nhánh `develop` vào `main`.
