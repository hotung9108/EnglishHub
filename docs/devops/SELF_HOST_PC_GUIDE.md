# Cẩm Nang Tự Biến PC Cá Nhân Thành Máy Chủ Self-Hosted - EnglishHub

Tài liệu này hướng dẫn chi tiết từ A-Z cách sử dụng máy tính cá nhân (PC hoặc Laptop chạy Windows / Linux) làm máy chủ lưu trữ (Self-Hosted Server) hoạt động ổn định 24/7 cho dự án **EnglishHub**, phục vụ học sinh và giáo viên truy cập trong mạng nội bộ (LAN) hoặc qua mạng Internet toàn cầu.

---

## 1. Yêu Cầu Phần Cứng & Môi Trường

- **Phần cứng đề xuất**:
  - **RAM**: Tối thiểu 8GB (khuyên dùng 16GB để chạy mượt mà cả PostgreSQL, Spring Boot, Nginx và các tác vụ chấm điểm AI).
  - **Ổ cứng**: Tối thiểu 20GB dung lượng trống (ưu tiên ổ SSD để build và truy vấn database nhanh).
  - **CPU**: 4 nhân trở lên (Intel Core i3/i5 đời mới, AMD Ryzen hoặc tương đương).
- **Phần mềm bắt buộc trên PC**:
  - **Hệ điều hành**: Windows 10/11 (kèm WSL2) hoặc Linux (Ubuntu Server / Debian / Fedora).
  - **Docker & Docker Compose**: Đã cài đặt [Docker Desktop](https://www.docker.com/products/docker-desktop/) (với Windows) hoặc Docker Engine (với Linux).

---

## 2. Kiến Trúc Cổng & Chống Lỗi CORS

Hệ thống sử dụng file cấu hình chuyên biệt [`docker-compose.selfhost.yml`](file:///d:/Codin/utc-code/HK4_1/Project1/EnglishHub/docker-compose.selfhost.yml):

- Toàn bộ lưu lượng truy cập từ bên ngoài chỉ đi qua **Cổng 80** của Nginx.
- Nginx đóng vai trò **Gateway kiêm Reverse Proxy**:
  - Khi người dùng vào trang web (`/`): Nginx phục vụ giao diện React App.
  - Khi ứng dụng gửi dữ liệu (`/api/...`): Nginx tự động chuyển tiếp ngầm sang Backend Spring Boot (Port 8080).
- **Lợi ích**: Cả Frontend và Backend nằm chung một domain/IP duy nhất, **loại bỏ 100% nguy cơ lỗi CORS** và chặn Cookie/Token.

---

## 3. Khởi Chạy Máy Chủ Trên PC (Quick Start)

### Bước 1: Sao chép file cấu hình môi trường
Tại thư mục gốc của dự án trên PC:
```bash
cp env.selfhost.example .env
```
Mở file `.env` bằng Notepad hoặc VS Code và điền các mật khẩu của bạn:
- `DB_PASSWORD`: Mật khẩu cho PostgreSQL.
- `JWT_SECRET`: Chuỗi ký tự bảo mật bất kỳ (ít nhất 32 ký tự).
- `OPENAI_API_KEY`: API Key OpenAI dùng để chấm điểm AI (nếu có).

### Bước 2: Khởi động hệ thống
Mở Terminal (PowerShell hoặc Bash) tại thư mục dự án và chạy:
```bash
docker compose -f docker-compose.selfhost.yml up -d --build
```
*Lệnh này sẽ tự động build mã nguồn Spring Boot và React thành các container tối ưu và chạy ngầm.*

### Bước 3: Kiểm tra trạng thái
```bash
docker compose -f docker-compose.selfhost.yml ps
```
Khi thấy cả 3 dịch vụ `postgres`, `backend`, `frontend` đều ở trạng thái `Up`, bạn có thể mở trình duyệt trên PC gõ `http://localhost` để trải nghiệm web.

---

## 4. Cho Phép Các Máy Khác Cùng Mạng WiFi / LAN Truy Cập

Để học sinh hoặc đồng nghiệp trong cùng nhà / trường học có thể truy cập:

### Bước 1: Cố định IP mạng nội bộ (Static LAN IP) của PC
- **Trên Windows**: Mở **Settings** -> **Network & internet** -> **Wi-Fi** hoặc **Ethernet** -> bấm **Edit** tại mục IP assignment -> Chọn **Manual** -> Điền IP tĩnh (ví dụ: `192.168.1.150`).
- **Trên Linux**: Đặt IP tĩnh qua `netplan` hoặc giao diện Network Manager.

### Bước 2: Mở Firewall Windows cho cổng 80 (Nếu bị chặn)
Mở PowerShell bằng quyền Administrator trên PC chạy lệnh:
```powershell
New-NetFirewallRule -DisplayName "EnglishHub Web Server" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
```

### Bước 3: Truy cập từ thiết bị khác
Trên điện thoại, iPad hoặc laptop khác kết nối cùng WiFi, mở trình duyệt gõ:
```text
http://192.168.1.150
```
*(Thay `192.168.1.150` bằng địa chỉ IP thật của PC bạn vừa đặt).*

---

## 5. Mở Rộng Ra Ngoài Mạng Internet Miễn Phí (Cloudflare Tunnel)

Nếu bạn muốn học sinh ở nhà hoặc bất kỳ đâu trên thế giới đều vào được web mà **không cần mở port modem** (tránh bị hack/DDoS) và **có sẵn HTTPS xanh miễn phí**:

### Bước 1: Đăng ký Cloudflare Zero Trust (Miễn phí)
1. Tạo tài khoản tại [dash.cloudflare.com](https://dash.cloudflare.com/) và thêm một tên miền miễn phí hoặc có phí của bạn vào Cloudflare.
2. Vào mục **Zero Trust** -> **Networks** -> **Tunnels** -> Bấm **Create a tunnel**.
3. Đặt tên tunnel (ví dụ `englishhub-pc`) -> Chọn môi trường **Docker**.
4. Cloudflare sẽ cấp cho bạn một đoạn mã chứa chuỗi token dài, dạng:
   ```text
   eyJhIjoiYmNm...
   ```

### Bước 2: Cấu hình Token vào `.env`
Mở file `.env` trên PC, điền token vừa nhận được vào:
```env
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoiYmNm...
```

### Bước 3: Bật container Tunnel
```bash
docker compose -f docker-compose.selfhost.yml --profile cloudflare up -d
```

### Bước 4: Cấu hình định tuyến trên Cloudflare Dashboard
Trong phần cấu hình Tunnel trên trang Cloudflare:
- **Subdomain**: ví dụ `englishhub` (Domain: `yourdomain.com`).
- **Service Type**: `HTTP`
- **URL**: `frontend:80`

Xong! Giờ đây bất kỳ ai trên thế giới cũng có thể truy cập web của bạn qua địa chỉ:
```text
https://englishhub.yourdomain.com
```

---

## 6. Cấu Hình Tự Khởi Động Khi Bật Máy (Auto-Start on Boot)

Vì file compose đã cấu hình `restart: always`, container sẽ tự động chạy bất cứ khi nào Docker khởi động. Bạn chỉ cần bật chế độ Docker chạy cùng hệ điều hành:

- **Trên Windows**:
  1. Mở **Docker Desktop** -> vào **Settings (bánh răng)**.
  2. Tại tab **General**, tích chọn **Start Docker Desktop when you sign in to your computer**.
- **Trên Linux**:
  Chạy lệnh để Docker khởi động cùng hệ thống:
  ```bash
  sudo systemctl enable docker
  ```

Khi cúp điện hoặc khởi động lại PC, chỉ cần bật máy lên và đăng nhập, hệ thống sẽ tự động phục hồi trong vòng 30 giây.

---

## 7. Sao Lưu Dữ Liệu Định Kỳ (Backup & Restore)

Dữ liệu PostgreSQL được lưu trữ an toàn trong Docker volume `postgres_selfhost_data`. Để sao lưu ra file `.sql` đề phòng hỏng hóc:

### Sao lưu (Backup):
```bash
docker exec -t englishhub-postgres-selfhost pg_dump -U englishhub_admin englishhub_db > englishhub_backup_$(date +%F).sql
```

### Phục hồi (Restore):
```bash
cat englishhub_backup_2026-09-16.sql | docker exec -i englishhub-postgres-selfhost psql -U englishhub_admin -d englishhub_db
```
