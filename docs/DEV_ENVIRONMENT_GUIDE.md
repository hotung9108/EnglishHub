# Cẩm Nang Vận Hành Môi Trường Phát Triển (Development Guide) - EnglishHub

Dự án **EnglishHub** cung cấp hai phương án khởi chạy môi trường phát triển (Development) tùy theo nhu cầu và phong cách làm việc của từng lập trình viên.

---

## 1. So Sánh Hai Phương Án Khởi Chạy

| Tiêu chí | Phương Án 1: Bare-Metal Dev | Phương Án 2: Full-Stack Docker Dev |
| :--- | :--- | :--- |
| **Vị trí file Compose** | [`database/docker-compose.dev.yml`](file:///d:/Codin/utc-code/HK4_1/Project1/EnglishHub/database/docker-compose.dev.yml) | [`docker-compose.dev.yml`](file:///d:/Codin/utc-code/HK4_1/Project1/EnglishHub/docker-compose.dev.yml) (ở thư mục gốc) |
| **Dịch vụ chạy trong Docker** | Chỉ duy nhất **PostgreSQL** | Trọn gói: **PostgreSQL** + **Backend** + **Frontend** |
| **Backend chạy ở đâu?** | Trực tiếp trên máy host (IntelliJ, Eclipse, hoặc `./gradlew bootRun`) | Trong Docker Container (Port 8080) |
| **Frontend chạy ở đâu?** | Trực tiếp trên máy host (`npm run dev`) | Trong Docker Container (Port 5173, có HMR Live Reload) |
| **Yêu cầu cài đặt trên máy host** | Cần cài JDK 21, Node.js 22, Git, Docker | **Chỉ cần cài Git và Docker** (không cần Java/Node) |
| **Trường hợp khuyên dùng** | Khi bạn đang tích cực viết code, cần breakpoint debugger trên IDE và hot reload cực nhanh | Khi bạn muốn review nhanh cả hệ thống, test luồng tích hợp hoặc máy mới chưa cài môi trường |

---

## 2. Hướng Dẫn Chi Tiết Phương Án 1: Bare-Metal Dev (Khuyên Dùng Cho Dev Đang Code)

### Bước 1: Khởi động Database PostgreSQL
```bash
# Di chuyển vào thư mục database hoặc dùng cờ -f
docker compose -f database/docker-compose.dev.yml up -d
```
*Database sẽ mở cổng `5432` trên localhost với user `devuser`, pass `devpassword`, db `appdb`.*

### Bước 2: Chạy Backend (Spring Boot)
Mở dự án `backend/` trong IntelliJ IDEA hoặc chạy lệnh:
```bash
cd backend
./gradlew bootRun
```
*Backend lắng nghe tại: `http://localhost:8080`.*

### Bước 3: Chạy Frontend (React / Vite)
Mở terminal khác và chạy:
```bash
cd frontend
npm install
npm run dev
```
*Frontend mở tại: `http://localhost:5173`.*

---

## 3. Hướng Dẫn Chi Tiết Phương Án 2: Full-Stack Docker Dev (Chạy 1 Lệnh Duy Nhất)

### Bước 1: Chuẩn bị biến môi trường (Lần đầu tiên)
```bash
# Ở thư mục gốc của repo:
cp env.dev.example .env
```

### Bước 2: Khởi chạy toàn bộ hệ thống
```bash
# Build và chạy ngầm toàn bộ 3 containers:
docker compose -f docker-compose.dev.yml up --build -d
```

### Bước 3: Truy cập hệ thống
- **Frontend App**: `http://localhost:5173` (Hỗ trợ Live Reload: Khi bạn sửa code trong `frontend/src/`, giao diện web tự cập nhật ngay lập tức).
- **Backend API**: `http://localhost:8080`
- **PostgreSQL**: `localhost:5432`

### Bước 4: Xem logs và dừng dịch vụ
```bash
# Xem logs của Backend:
docker compose -f docker-compose.dev.yml logs -f backend

# Xem logs của Frontend:
docker compose -f docker-compose.dev.yml logs -f frontend

# Dừng toàn bộ hệ thống:
docker compose -f docker-compose.dev.yml down
```

---

## 4. Cấu Trúc Dockerfile Frontend (`frontend/Dockerfile`)

`frontend/Dockerfile` là Dockerfile đa tầng (Multi-stage Build) hỗ trợ cả 2 mục đích:
1. **Target `development`**: Được dùng bởi `docker-compose.dev.yml`, chạy Vite Dev Server ở cổng `5173`, mount volume mã nguồn `./frontend:/app` để hot reload code.
2. **Target `production`**: Được dùng bởi CI/CD pipeline (`cd-deploy.yml`) và `docker-compose.prod.yml`, build ra file tĩnh tối ưu và chạy bằng web server **Nginx Alpine** siêu nhẹ ở cổng `80`.
