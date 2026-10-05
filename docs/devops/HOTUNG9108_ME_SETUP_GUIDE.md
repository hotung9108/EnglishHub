# Hướng Dẫn Thực Chiến Cấu Hình & Triển Khai 1 Domain Duy Nhất: `hotung9108.me`

Tài liệu này hướng dẫn chi tiết cách cấu hình **1 tên miền duy nhất `hotung9108.me`** để vận hành độc lập và đồng thời cả 4 dịch vụ:
1. **Frontend Production** (Vercel Edge): `https://hotung9108.me` hoặc `https://app.hotung9108.me`
2. **Backend Production** (Máy chủ cá nhân / Port 8080): `https://api.hotung9108.me`
3. **Frontend Staging** (Vercel Staging): `https://staging.hotung9108.me`
4. **Backend Staging** (Máy chủ cá nhân / Port 8082): `https://api-staging.hotung9108.me`

Kèm theo kiến trúc tách biệt **Cloudflare Tunnel chạy độc lập 24/7**, khắc phục triệt để lỗi xung đột container và lỗi treo mạng khi pull image từ Docker Hub.

---

## 1. Bản Đồ Định Tuyến Hệ Thống

| Dịch Vụ | Tên Miền Con (Subdomain) | Mục Đích Thực Tế | Nơi Chạy & Cổng Nội Bộ |
| :--- | :--- | :--- | :--- |
| **Frontend Production** | `https://hotung9108.me` hoặc `app.hotung9108.me` | Web chính thức cho học sinh, giáo viên | Vercel Edge |
| **Backend Production** | `https://api.hotung9108.me` | API cấp dữ liệu cho web chính thức | Container `englishhub-backend-prod` (Port 8080) |
| **Swagger UI Prod** | `https://api.hotung9108.me/swagger-ui/index.html` | Xem danh sách API bản chính | Container `englishhub-backend-prod` (Port 8080) |
| **Frontend Staging** | `https://staging.hotung9108.me` | Web thử nghiệm tính năng mới | Vercel Staging |
| **Backend Staging** | `https://api-staging.hotung9108.me` | API cấp dữ liệu cho web thử nghiệm | Container `englishhub-backend-staging` (Port 8082) |
| **Swagger UI Staging** | `https://api-staging.hotung9108.me/swagger-ui/index.html` | **Link gửi cho Tester vào test API** | Container `englishhub-backend-staging` (Port 8082) |

---

## 2. Hướng Dẫn Cấu Hình Từng Bước Thực Tế

### Bước 1: Thêm `hotung9108.me` Vào Cloudflare & Đổi Nameservers Trên Namecheap

1. Đăng nhập [Cloudflare Dashboard](https://dash.cloudflare.com/) ➔ Bấm **Add a site**.
2. Nhập: `hotung9108.me` ➔ Chọn gói **Free (0$)** ➔ Bấm **Continue**.
3. Cloudflare sẽ cấp 2 địa chỉ Nameservers (ví dụ `ns1.cloudflare.com`, `ns2.cloudflare.com`).
4. Mở tab mới vào [Namecheap Dashboard](https://ap.www.namecheap.com/):
   - Vào **Domain List** ➔ Dòng `hotung9108.me` ➔ Bấm nút **Manage**.
   - Tại mục **Nameservers**: Chọn **Custom DNS**.
   - Điền 2 địa chỉ Nameserver Cloudflare vừa cấp.
   - Bấm **dấu tích màu xanh (Save)**.
5. Quay lại Cloudflare bấm **Check nameservers now**. Trạng thái domain chuyển sang **Active** (Xanh lá).

---

### Bước 2: Thiết Lập Cloudflare Tunnel (Named Tunnel Cố Định)

> [!NOTE]
> **Giải thích kỹ thuật**: Dự án sử dụng Named Tunnel có Token (`cloudflared tunnel run`). Tên miền **hoàn toàn cố định**, không bao giờ bị random như chế độ Quick Tunnel (`trycloudflare.com`).

1. Truy cập [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/).
2. Chọn menu **Networks** ➔ **Tunnels** ➔ Bấm **Create a tunnel**.
3. Chọn loại **Cloudflared** ➔ Đặt tên là `englishhub-tunnel` ➔ Bấm **Save tunnel**.
4. Tại bước Install connector, chọn môi trường **Docker**:
   - Sao chép đoạn mã Token dài phía sau `--token` (bắt đầu bằng `eyJhIjoi...`).
   - Đây chính là `CLOUDFLARE_TUNNEL_TOKEN`.
5. Chuyển sang tab **Public Hostname** (trong cấu hình Tunnel):

#### Thêm Hostname 1 (Cho Backend Production):
- **Subdomain**: `api`
- **Domain**: chọn `hotung9108.me`
- **Type**: `HTTP`
- **URL**: `englishhub-backend-prod:8080` (hoặc `localhost:8080`)
- Bấm **Save hostname**.

#### Thêm Hostname 2 (Cho Backend Staging & Tester):
- Bấm **Add a public hostname**
- **Subdomain**: `api-staging`
- **Domain**: chọn `hotung9108.me`
- **Type**: `HTTP`
- **URL**: `englishhub-backend-staging:8080` (hoặc `localhost:8082`)
- Bấm **Save hostname**.

---

### Bước 3: Chuẩn Bị & Khởi Chạy Máy Chủ Cá Nhân (Arch Linux / Home Server)

#### 1. Dọn dẹp lỗi kẹt snapshot (nếu từng bị lỗi context canceled / status 499):
```bash
docker system prune -a --volumes -f
```

#### 2. Khởi tạo Docker Network chung:
```bash
docker network create englishhub_network
```

#### 3. Chạy Container Cloudflare Tunnel độc lập (Chỉ chạy 1 lần duy nhất):
Tạo thư mục riêng cho tunnel trên máy chủ, tách biệt hoàn toàn khỏi mã nguồn Backend:
```bash
mkdir -p /home/$USER/englishhub-tunnel
cd /home/$USER/englishhub-tunnel
```
Tạo file `.env` tại thư mục này:
```env
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoi... (Token từ Bước 2)
```
Tạo file `docker-compose.tunnel.yml`:
```yaml
services:
  tunnel:
    image: cloudflare/cloudflared:latest
    container_name: englishhub-cloudflared-tunnel
    restart: unless-stopped
    command: tunnel run
    environment:
      TUNNEL_TOKEN: ${CLOUDFLARE_TUNNEL_TOKEN:?Cloudflare Tunnel Token is required}
    networks:
      - englishhub_network

networks:
  englishhub_network:
    name: englishhub_network
    external: true
```
Khởi chạy tunnel:
```bash
docker compose -f docker-compose.tunnel.yml up -d
```
*(Container này sẽ chạy 24/7 và tự khởi động lại cùng máy chủ. Mỗi khi Backend Prod hay Staging deploy, tunnel hoàn toàn không bị ảnh hưởng!)*

---

### Bước 4: Cấu Hình 2 Thư Mục Backend Prod & Staging Trên Máy Chủ

Để hai phiên bản cùng chạy đồng thời mà không bị xung đột container hay cổng:

#### 1. Thư mục Production (`/home/$USER/englishhub/.env`):
```env
BACKEND_PORT=8080
CORS_ALLOWED_ORIGINS=https://hotung9108.me,https://app.hotung9108.me,https://api.hotung9108.me
DB_URL=jdbc:postgresql://ep-xyz.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
DB_USER=neondb_owner
DB_PASSWORD=your_neon_prod_password
JWT_SECRET=your-production-secret-key-min-32-chars
```
Triển khai backend Production:
```bash
cd /home/$USER/englishhub
docker compose -f docker-compose.prod.yml up -d
```
*(Sử dụng container name: `englishhub-backend-prod`, cổng ngoài 8080, không chứa service tunnel).*

#### 2. Thư mục Staging (`/home/$USER/englishhub-dev/.env`):
```env
BACKEND_PORT=8082
CORS_ALLOWED_ORIGINS=https://staging.hotung9108.me,https://api-staging.hotung9108.me
DB_URL=jdbc:postgresql://ep-xyz.ap-southeast-1.aws.neon.tech/neondb_staging?sslmode=require
DB_USER=neondb_owner
DB_PASSWORD=your_neon_staging_password
JWT_SECRET=your-staging-secret-key-min-32-chars
```
Triển khai backend Staging:
```bash
cd /home/$USER/englishhub-dev
docker compose -f docker-compose.staging.yml up -d
```
*(Sử dụng container name: `englishhub-backend-staging`, cổng ngoài 8082, không chứa service tunnel).*

---

### Bước 5: Cấu Hình Vercel Cho Frontend

1. **Frontend Production**:
   - Trong Vercel: Vào Project Frontend Prod ➔ **Settings** ➔ **Domains** ➔ Thêm `app.hotung9108.me` (hoặc `hotung9108.me`).
   - Vào **Environment Variables** ➔ Đặt:
     ```env
     VITE_API_BASE_URL=https://api.hotung9108.me/api/v1
     ```
2. **Frontend Staging**:
   - Trong Vercel: Vào Project Frontend Staging ➔ **Settings** ➔ **Domains** ➔ Thêm `staging.hotung9108.me`.
   - Vào **Environment Variables** ➔ Đặt:
     ```env
     VITE_API_BASE_URL=https://api-staging.hotung9108.me/api/v1
     ```
3. **Thêm 2 bản ghi trên Cloudflare DNS** ([dash.cloudflare.com](https://dash.cloudflare.com/) ➔ `hotung9108.me` ➔ **DNS** ➔ **Records**):
   - Bản ghi 1: Type `CNAME` | Name `app` | Target `cname.vercel-dns.com` | Proxy status: **DNS Only** (icon đám mây màu xám)
   - Bản ghi 2: Type `CNAME` | Name `staging` | Target `cname.vercel-dns.com` | Proxy status: **DNS Only** (icon đám mây màu xám)

---

## 3. Đường Link Bàn Giao Cho Đội Ngũ

Sau khi thiết lập hoàn tất, toàn bộ hệ thống hoạt động thông suốt:

- 🌐 **Web Production**: `https://hotung9108.me` (hoặc `https://app.hotung9108.me`)
- ⚙️ **API Production**: `https://api.hotung9108.me/actuator/health`
- 🌐 **Web Staging**: `https://staging.hotung9108.me`
- 📋 **Swagger UI Staging (Gửi cho QA/Tester)**:  
  👉 🔗 `https://api-staging.hotung9108.me/swagger-ui/index.html`
