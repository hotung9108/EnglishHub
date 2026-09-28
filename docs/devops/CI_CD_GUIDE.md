# Cẩm Nang Thiết Lập & Vận Hành CI/CD - Dự Án EnglishHub

Tài liệu hướng dẫn chi tiết quy trình Tích hợp liên tục (CI) và Triển khai liên tục (CD) tự động cho dự án **EnglishHub** sử dụng **GitHub Actions**, **GitHub Container Registry (ghcr.io)** và **Docker Compose**.

---

## 1. Tổng Quan Kiến Trúc CI/CD

```text
[ Developer ]
     │
     ├─► Push / PR (frontend/**) ──► [.github/workflows/ci-frontend.yml]
     │                                ├── ESLint
     │                                └── TypeScript Build
     │
     ├─► Push / PR (backend/**)  ──► [.github/workflows/ci-backend.yml]
     │                                ├── PostgreSQL Test Container
     │                                ├── Gradle Test
     │                                └── Spring Boot Build
     │
     └─► Merge vào main          ──► [.github/workflows/cd-deploy.yml]
                                      ├── Build & Push Docker Image lên ghcr.io
                                      └── SSH Deploy lên VPS (docker-compose.prod.yml)
```

---

## 2. Chi Tiết Các Workflows

### 2.1. Frontend CI (`.github/workflows/ci-frontend.yml`)
- **Kích hoạt**: Khi có `push` hoặc `pull_request` vào nhánh `main` hoặc `develop` có thay đổi trong `frontend/**`.
- **Nhiệm vụ**:
  1. Kiểm tra cú pháp và quy chuẩn code: `npm run lint`.
  2. Kiểm tra type check và build bundle: `npm run build`.

### 2.2. Backend CI (`.github/workflows/ci-backend.yml`)
- **Kích hoạt**: Khi có `push` hoặc `pull_request` vào nhánh `main` hoặc `develop` có thay đổi trong `backend/**`.
- **Nhiệm vụ**:
  1. Khởi chạy tạm thời container **PostgreSQL 16** làm service database thực thụ.
  2. Cấp quyền thực thi cho Gradle wrapper.
  3. **Xác thực Flyway Migrations**: Chạy toàn bộ các file SQL trong `src/main/resources/db/migration/` trực tiếp lên PostgreSQL để đảm bảo không có lỗi cú pháp DDL/DML.
  4. Chạy toàn bộ Unit Tests với JUnit 5.
  5. Kiểm tra đóng gói file jar: `./gradlew bootJar -x test`.

### 2.3. Quét Bảo Mật & Rò Rỉ Bí Mật (`.github/workflows/security-scan.yml`)
- **Kích hoạt**: Mọi `push` và `pull_request` vào `main` và `develop`.
- **Nhiệm vụ**:
  - Tự động sử dụng **TruffleHog OSS** (100% mã nguồn mở hoàn toàn miễn phí, không yêu cầu license key hay tài khoản tổ chức).
  - Ngăn chặn và chặn đứng (Block) PR nếu phát hiện lập trình viên vô tình commit API Keys (OpenAI, AWS, JWT Secret, Private Key, Database Credentials,...).
  - Chạy quét với chế độ xác thực trực tuyến và debug log, không gây false positive trên các file mẫu `.example`.

### 2.4. CD Pipeline & Post-Deploy Healthcheck (`.github/workflows/cd-deploy.yml`)
- **Kích hoạt**: Tự động khi merge code vào nhánh `main` hoặc gắn tag phiên bản (`v*.*.*`).
- **Nhiệm vụ**:
  1. Đăng nhập vào **GitHub Container Registry (`ghcr.io`)** bằng `GITHUB_TOKEN`.
  2. Build và đẩy 2 Docker images lên registry:
     - `ghcr.io/<github_username>/englishhub/backend:latest`
     - `ghcr.io/<github_username>/englishhub/frontend:latest`
  3. Tự động SSH vào máy chủ VPS/PC:
     - Pull image mới nhất về máy chủ.
     - Khởi động lại dịch vụ với `docker compose up -d`.
     - **Post-deploy Healthcheck**: Đợi 15 giây để Spring Boot ổn định, kiểm tra trạng thái các container bằng `docker compose ps` để đảm bảo hệ thống không bị crash sau khi cập nhật.

     docker image prune -f
     ```

---

## 3. Hướng Dẫn Cấu Hình GitHub Secrets

Để kích hoạt tính năng tự động Deploy qua SSH lên VPS, bạn cần vào:
**GitHub Repository** -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**:

| Tên Secret | Bắt buộc | Ý nghĩa / Giá trị |
| :--- | :--- | :--- |
| `SERVER_HOST` | Tùy chọn | Địa chỉ IP Public của máy chủ VPS (ví dụ: `...`). |
| `SERVER_USER` | Tùy chọn | Tên người dùng SSH (ví dụ: `...`). |
| `SERVER_SSH_KEY` | Tùy chọn | Private Key SSH dùng để kết nối vào máy chủ (ví dụ: `...`). |
| `SERVER_PORT` | Tùy chọn | Cổng SSH của server (ví dụ: `...`). |


> [!NOTE]
> Nếu chưa điền các Secrets trên, CD workflow sẽ **chỉ thực hiện bước Build & Push Image** lên `ghcr.io` và tự động bỏ qua bước SSH mà không gây lỗi đỏ pipeline.

---

## 4. Hướng Dẫn Chuẩn Bị Máy Chủ Triển Khai (VPS Setup)

Trên máy chủ VPS của bạn, chỉ cần chuẩn bị một lần duy nhất:

### Bước 1: Cài đặt Docker & Docker Compose
```bash
# Cập nhật hệ thống và cài đặt docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### Bước 2: Tạo thư mục triển khai
```bash
sudo mkdir -p /opt/englishhub
sudo chown -R $USER:$USER /opt/englishhub
cd /opt/englishhub
```

### Bước 3: Đưa file cấu hình lên máy chủ
Copy 2 file từ repository lên `/opt/englishhub`:
1. `docker-compose.prod.yml`
2. `env.production.example` -> Đổi tên thành `.env` và điền mật khẩu thật:
```bash
cp env.production.example .env
nano .env   # Cập nhật mật khẩu DB, JWT_SECRET và OPENAI_API_KEY
```

---

## 5. Kiểm Thử Cục Bộ Trước Khi Đẩy Code

Bạn có thể chạy kiểm thử các bước CI trên máy cá nhân trước khi push:

### Kiểm tra Frontend:
```bash
cd frontend
npm run lint
npm run build
```

### Kiểm tra Backend:
```bash
cd backend
./gradlew test
./gradlew bootJar -x test
```

### Kiểm tra cấu hình Docker Compose:
```bash
docker compose -f docker-compose.prod.yml config
```
