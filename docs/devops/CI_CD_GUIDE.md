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
     ├─► Merge vào main          ──► [.github/workflows/cd-backend.yml]
     │                                ├── Build & Push Backend Image lên ghcr.io
     │                                └── SSH Deploy lên VPS (docker-compose.prod.yml)
     │
     └─► Merge vào main          ──► [.github/workflows/cd-frontend.yml]
                                      └── Deploy Frontend lên Vercel Production
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

### 2.4. CD Backend (`.github/workflows/cd-backend.yml`)
- **Kích hoạt**: Tự động khi workflow `Backend CI` hoàn tất thành công trên nhánh `main` (event `workflow_run`) → chỉ chạy khi code `backend/**` thay đổi.
- **Nhiệm vụ**:
  1. Job `wait-ai-service`: nếu commit cũng thay đổi `ai-service/**`, chờ `AI Service CI` và `cd-ai-service.yml` hoàn tất `success` → mới tiếp tục (thất bại thì chặn deploy Backend).
  2. Kết nối Tailscale mesh VPN, đăng nhập **GitHub Container Registry (`ghcr.io`)**.
  3. Build và đẩy Backend image lên registry với 2 tag: `:latest` và `:<commit sha>`.
  4. SSH vào máy chủ: cập nhật `BACKEND_IMAGE` trong `.env` rồi khởi động lại bằng `docker compose -f docker-compose.prod.yml up -d --pull always`.

### 2.5. CD Frontend (`.github/workflows/cd-frontend.yml`)
- **Kích hoạt**: Khi merge vào nhánh `main`.
- **Nhiệm vụ**: Lint, test, build bundle Frontend rồi deploy lên **Vercel Production** bằng Vercel CLI.

---

## 3. Hướng Dẫn Cấu Hình GitHub Secrets

Để kích hoạt tính năng tự động Deploy qua SSH lên VPS, bạn cần vào:
**GitHub Repository** -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**:

| Tên Secret | Bắt buộc | Ý nghĩa / Giá trị |
| :--- | :--- | :--- |
| `SERVER_HOST` | Bắt buộc | Địa chỉ IP của máy chủ (truy cập được qua Tailscale). |
| `SERVER_USER` | Bắt buộc | Tên người dùng SSH trên máy chủ (ví dụ: `englishhub`). |
| `SSH_PRIVATE_KEY` | Bắt buộc | Private Key SSH dùng để kết nối vào máy chủ. |
| `TAILSCALE_AUTHKEY` | Bắt buộc | Auth key để workflow kết nối vào mesh VPN Tailscale. |
| `GHCR_PAT` | Bắt buộc | Personal Access Token để push/pull image trên `ghcr.io`. |

> [!NOTE]
> Các secret này do **Admin/DevOps** cấu hình ở cấp Repository. Nếu thiếu secret, job deploy sẽ thất bại (fail đỏ) ngay tại bước kết nối — cố ý để cảnh báo thay vì âm thầm bỏ qua deploy.

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
Copy 2 file từ repository vào thư mục deploy của Backend (mặc định `/home/<SERVER_USER>/englishhub`):
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
