# Bàn Giao Kỹ Thuật: [OPS-41][ISSUE #159] Khắc Phục Lỗi 404 Khi Refresh / Mở Trực Tiếp Route Con SPA

- **Mã Task**: `OPS-41` / GitHub Issue `#159`
- **Người thực hiện**: `@devops-secondary` (hotung9108)
- **Người nhận**: `@tester` (Zawn-Tsu), Toàn bộ nhóm phát triển
- **Ngày hoàn thành**: 2026-10-27
- **Môi trường tác động**: Staging (`staging.hotung9108.me`), Production (`hotung9108.me`, `app.hotung9108.me`), Docker Nginx runtime

---

## 1. Bản Chất Kỹ Thuật & Giải Pháp Đã Thực Hiện

### a. Vercel Hosting (`frontend/vercel.json`)
- **Trước thay đổi**:
  - Nhánh `develop`: Quy tắc `"source": "/(.*)"` rewrite toàn bộ request (kể cả `/api/...`) về `index.html` và trả `200 OK`, gây nhầm lẫn giữa API và UI route.
  - Nhánh `main`: Chưa có file `vercel.json`, dẫn đến Production trả lỗi `404 NOT_FOUND` trực tiếp từ Vercel edge khi refresh các trang con.
- **Sau thay đổi**:
  - Cập nhật quy tắc rewrite sử dụng Negative Lookahead:
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
  - **Kết quả**:
    1. Các route SPA như `/teacher/profile`, `/teacher/classes/:id/progress`, `/student/dashboard`, `/login` đều được rewrite về `index.html` (HTTP 200).
    2. Static assets (`/assets/*.js`, `/assets/*.css`, SVG/PNG) được Vercel phục vụ trực tiếp.
    3. Mọi request bắt đầu bằng `/api/` (nếu không có API endpoint tương ứng trên máy chủ) sẽ trả về `404 Not Found` đúng nghĩa, không bị rewrite nhầm thành file HTML.

### b. Docker / Nginx Hosting (`frontend/nginx.conf`)
- Đã duy trì `location / { try_files $uri $uri/ /index.html; }` và `location /api/ { proxy_pass http://backend:8080/api/; }`.
- Bổ sung cấu hình `location = /index.html` với header `Cache-Control "no-store, no-cache, must-revalidate"` nhằm ngăn chặn trình duyệt cache file `index.html` cũ khi có phiên bản release mới.

---

## 2. Kịch Bản Kiểm Thử Bàn Giao QA / Retest Matrix

| Mã Test | Loại Kịch Bản | Đường Dẫn Kiểm Thử | Thao Tác | Kết Quả Mong Đợi |
| :--- | :--- | :--- | :--- | :--- |
| **TC-OPS41-01** | Refresh Route Con (Teacher Profile) | `https://staging.hotung9108.me/teacher/profile` | Đăng nhập Teacher, mở trang và nhấn F5 / Ctrl+R | Trang tải mượt mà, giữ nguyên session, không hiển thị lỗi 404 Vercel. |
| **TC-OPS41-02** | URL Con Dynamic Param (Class Progress) | `https://staging.hotung9108.me/teacher/classes/126/progress` | Mở trực tiếp URL trên tab mới khi đã đăng nhập | Nạp SPA `index.html`, gọi API lớp học thành công hoặc hiển thị giao diện phân quyền phù hợp. |
| **TC-OPS41-03** | Mở URL Con Chưa Đăng Nhập (AuthGuard) | `https://staging.hotung9108.me/teacher/classes` | Mở cửa sổ ẩn danh (chưa đăng nhập), dán trực tiếp URL | Nạp SPA thành công, `ProtectedRoute` tự động chuyển hướng về `/login`. |
| **TC-OPS41-04** | Route Không Tồn Tại Trong Ứng Dụng | `https://staging.hotung9108.me/duong-dan-khong-ton-tai` | Mở trực tiếp URL bất kỳ không có trong App | Nạp SPA và hiển thị trang NotFound của EnglishHub (có nút về trang chủ), không phải trang 404 thô của Vercel. |
| **TC-OPS41-05** | Phân Biệt API Endpoint Không Tồn Tại | `https://staging.hotung9108.me/api/v1/invalid-route` | Gửi HTTP GET hoặc curl | Trả về HTTP Status `404 Not Found`, tuyệt đối **không** trả về HTTP 200 kèm nội dung `index.html`. |
| **TC-OPS41-06** | Tính Toàn Vẹn Của Static Assets | `https://staging.hotung9108.me/vite.svg` | Kiểm tra tải file tĩnh | Trả về HTTP 200 OK với đúng `Content-Type: image/svg+xml`. |

---

## 3. Quy Trình Triển Khai Sang Production
1. Push commit chứa `frontend/vercel.json` và `frontend/nginx.conf` lên nhánh `develop` -> Workflow `cd-frontend-development.yml` tự động build và deploy lên `staging.hotung9108.me`.
2. Tạo Pull Request merge từ `develop` vào `main` -> Workflow `cd-frontend.yml` tự động deploy lên Production (`hotung9108.me` và `app.hotung9108.me`).
