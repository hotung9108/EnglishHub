# EnglishHub — Hướng dẫn Secrets & Biến môi trường (DevOps)

> **Đối tượng**: @devops-primary, @devops-secondary, @be-primary (để cài đặt local).
> **Mục đích**: Liệt kê **tất cả** các secret key / token được sử dụng trong dự án, phân nhóm theo nơi chúng tồn tại,
> cách lấy, cách sử dụng, và **vị trí chính xác cần đặt** để CI/CD và hệ thống đang chạy thực sự hoạt động.
>
> **Nguyên tắc vàng**: Các file `.env` thật đều được **gitignore** — không bao giờ commit giá trị thật.
> Chỉ có các template `*.example` nằm trong repo. Workflow `security-scan.yml` chạy
> TruffleHog trên mỗi push/PR và sẽ cảnh báo nếu phát hiện secret bị lộ.

Có **3 nơi** lưu trữ secrets:

| # | Vị trí | Được sử dụng bởi |
|---|----------|---------|
| 1 | **GitHub Actions Secrets** (repo Settings → Secrets and variables → Actions) | Các workflow CI/CD trong `.github/workflows/` |
| 2 | **File `.env` trên server** (trên máy deploy, dưới `/home/<SERVER_USER>/`) | docker-compose.prod.yml / staging / tunnel / ai-service |
| 3 | **File `.env` dev local** (trên máy mỗi lập trình viên) | Backend, ai-service, frontend chạy local |

---

## 1. GitHub Actions Secrets

Thiết lập tại: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**.
Các secret này được tham chiếu dưới dạng `${{ secrets.X }}` trong các workflow.

### 1.1. Nhóm A — Server / SSH / Tunnel (dùng bởi CD-Backend, CD-AI-Service, CD-*-development)

| Secret | Dùng trong | Cách lấy | Cách dùng / lưu ý |
|--------|---------|---------------|--------------------|
| `SERVER_HOST` | `cd-backend.yml`, `cd-ai-service.yml`, `cd-backend-development.yml` | IP Tailscale của máy deploy (ví dụ `100.x.y.z`) hoặc tên MagicDNS của Tailscale (`pcname.tailnet-name.ts.net`). Tìm bằng lệnh `tailscale ip -4` trên server. | Runner sẽ SSH vào host này để chạy `docker compose`. Phải truy cập được **qua Tailscale** (workflow kết nối qua `TAILSCALE_AUTHKEY` trước). |
| `SERVER_USER` | tương tự | Username Linux trên máy deploy (ví dụ `tuan-pham`). | Cũng dùng làm username đăng nhập GHCR và để tạo đường dẫn `/home/<SERVER_USER>/englishhub`, `/home/<SERVER_USER>/ai-service`, `/home/<SERVER_USER>/tunnel`. |
| `SSH_PRIVATE_KEY` | tương tự | Tạo một cặp khóa ed25519 **mới** trên máy deploy: `ssh-keygen -t ed25519 -C "github-actions-deploy" -f deploy_key -N ""`. Copy khóa **public** vào `~/.ssh/authorized_keys` của `SERVER_USER`. | Dán **toàn bộ private key** (bao gồm cả dòng `-----BEGIN/END OPENSSH PRIVATE KEY-----`) làm giá trị secret. Được dùng bởi `appleboy/ssh-action`. |
| `GHCR_PAT` | tương tự | GitHub → Settings → Developer settings → **Personal access tokens → Fine-grained tokens** → Generate. Cấp quyền cho owner repo `hotung9108/english-hub` với quyền: **Packages → Read** (hoặc classic token với `read:packages`). Phải thuộc về tài khoản có quyền pull `ghcr.io/hotung9108/english-hub-*`. | Dùng để `docker login ghcr.io` **trên server** để pull các image mà CI vừa push. Bản thân CI dùng `GITHUB_TOKEN` tích hợp sẵn. |
| `TAILSCALE_AUTHKEY` | `cd-backend.yml`, `cd-ai-service.yml`, `cd-backend-development.yml` | Tailscale admin console → **Settings → Keys → Generate auth key**. Bật **Reusable** và **Pre-authorized** (và tốt nhất nên bật **Ephemeral**) để GitHub runner có thể tham gia tailnet mà không cần duyệt thủ công. | Cho phép GitHub Actions runner (ephemeral) tham gia tailnet để SSH tới `SERVER_HOST` hoạt động. Key sẽ bị tiêu thụ mỗi lần chạy nếu không phải loại reusable. |

### 1.2. Nhóm B — Triển khai Frontend trên Vercel (dùng bởi CD-Frontend, CD-Frontend-development)

| Secret | Dùng trong | Cách lấy | Cách dùng / lưu ý |
|--------|---------|---------------|--------------------|
| `VERCEL_TOKEN` | `cd-frontend.yml`, `cd-frontend-development.yml` | Avatar tài khoản Vercel → **Settings → Account → Tokens → Create Token**. Chọn tài khoản/team sở hữu project frontend. | Được truyền dưới dạng `--token` cho mọi lệnh CLI `vercel` trong CI (`pull`, `build`, `deploy --prebuilt --prod`). |
| `VERCEL_ORG_ID` | `cd-frontend.yml` (production) | Trong thư mục frontend, chạy `vercel link` rồi đọc file `.vercel/project.json` → `"orgId"`; hoặc Vercel dashboard → Project → Settings → General. | Được cung cấp cho bản build dưới dạng biến môi trường `VERCEL_ORG_ID`. |
| `VERCEL_PROJECT_ID` | `cd-frontend.yml` (production) | Cũng từ file `.vercel/project.json` → `"projectId"` (project production). | Biến môi trường `VERCEL_PROJECT_ID`. |
| `VERCEL_ORG_ID_DEV` | `cd-frontend-development.yml` (deploy staging/dev) | Tương tự như trên nhưng cho project Vercel **development** (project riêng, ví dụ `englishhub-dev`). | Biến môi trường cho workflow dev. |
| `VERCEL_PROJECT_ID_DEV` | `cd-frontend-development.yml` | Project ID của project Vercel dev. | Biến môi trường cho workflow dev. |

### 1.3. Nhóm C — Tự động (không cần thiết lập)

| Secret | Ghi chú |
|--------|-------|
| `GITHUB_TOKEN` | Được GitHub Actions tự động cung cấp mỗi lần chạy. Dùng để đăng nhập GHCR trong quá trình build/push của CI (quyền `packages: write` được khai báo trong workflow). **Không** tự tạo secret này thủ công. |

---

## 2. File môi trường trên Server (máy deploy)

Đây là các file `.env` **thuần túy trên server**, được tạo thủ công một lần và không bao giờ commit.
Mỗi file docker-compose đọc file env riêng của nó.

### 2.1. `/home/<SERVER_USER>/englishhub/.env` — Backend PROD
Template trong repo: `env.production.example` (dùng bởi `docker-compose.prod.yml` và `docker-compose.staging.yml`;
instance staging nằm ở `/home/<SERVER_USER>/englishhub-dev` theo workflow dev).

```bash
cd /home/<SERVER_USER>/englishhub
cp env.production.example .env   # hoặc copy file template qua thủ công
nano .env
```

| Biến | Cách lấy | Ghi chú |
|----------|---------------|-------|
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | Dashboard **Neon** (https://console.neon.tech) → project của bạn → **Connection Details** → JDBC. | Postgres serverless. Phải giữ `sslmode=require`. |
| `JWT_SECRET` | Tạo ≥32 ký tự ngẫu nhiên: `openssl rand -base64 48`. | Phải khớp giữa các instance backend; xoay vòng (rotate) sẽ làm mất hiệu lực tất cả token. |
| `CORS_ALLOWED_ORIGINS` | Các domain frontend thật của bạn (ví dụ `https://englishhub.io,https://www.englishhub.io`). | Chỉ dùng `*` cho mục đích test nhanh. |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys → Create new secret key. | Dùng cho tích hợp chấm điểm AI của backend. |
| `STORAGE_S3_ENDPOINT`, `STORAGE_S3_REGION`, `STORAGE_S3_ACCESS_KEY_ID`, `STORAGE_S3_SECRET_ACCESS_KEY`, `STORAGE_S3_BUCKET` | Nhà cung cấp tương thích S3 (AWS S3 / Cloudflare R2 / MinIO). AWS: IAM → Users → Create access key. R2: Bucket → S3 API token. Xem `docs/devops/s3-config-guide.md`. | Giữ `STORAGE_S3_PATH_STYLE=true` cho MinIO. |
| `BACKEND_IMAGE` | Được pipeline CD tự động thiết lập (`sed` thay thế tag bằng SHA deploy). | Giữ nguyên placeholder `latest` từ template. |
| `AI_SERVICE_BASE_URL`, `AI_SERVICE_*_TIMEOUT_SECONDS`, `AI_SERVICE_MODEL`, `AI_SERVICE_PROVIDER` | Giá trị mặc định trong template là ổn khi AI service chạy trên cùng Docker network (`englishhub_shared`). | **Không** đặt API key của AI provider ở đây — chúng thuộc về env của AI service (§2.3). |
| `BACKEND_PORT`, `SERVER_PORT`, `SERVER_FORWARD_HEADERS_STRATEGY`, `APP_OPENAPI_SERVER_URL`, `JAVA_TOOL_OPTIONS` | Không phải secret — giữ giá trị template, chỉnh URL theo từng môi trường. | `SERVER_FORWARD_HEADERS_STRATEGY=framework` là bắt buộc khi chạy sau Cloudflare Tunnel. |

### 2.2. `/home/<SERVER_USER>/tunnel/.env` — Cloudflare Tunnel
Template trong repo: `env.tunnel.example` (dùng bởi `docker-compose.tunnel.yml`).

| Biến | Cách lấy | Ghi chú |
|----------|---------------|-------|
| `TUNNEL_TOKEN` | Cloudflare Zero Trust dashboard → **Networks → Tunnels** → tunnel của bạn → configure → copy token hiển thị trong câu lệnh run (`cloudflared tunnel run --token eyJ...`). | Một token opaque duy nhất; `docker-compose.tunnel.yml` dùng token này thay vì file config đầy đủ. |

### 2.3. `/home/<SERVER_USER>/ai-service/.env` — AI Microservice
Template trong repo: `env.ai-service.example` (dùng bởi `docker-compose.ai-service.yml`).
Pipeline CD tự động copy file example nếu file bị thiếu, rồi thiết lập `AI_SERVICE_IMAGE` — nhưng **bạn phải tự điền API key một lần**.

```bash
cd /home/<SERVER_USER>/ai-service
cp env.ai-service.example .env
```

| Biến | Cách lấy | Ghi chú |
|----------|---------------|-------|
| `OPENROUTER_API_KEY` | https://openrouter.ai/keys → Create Key (bắt đầu bằng `sk-or-v1-`). | Provider chính (`AI_PROVIDER=auto` ưu tiên OpenRouter). |
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey. | Provider dự phòng; không bắt buộc nếu đã có key OpenRouter. |
| `AI_PROVIDER` | Chọn `auto` \| `openrouter` \| `gemini`. | `auto` = ưu tiên OpenRouter, dự phòng Gemini. |
| `OPENROUTER_MODEL`, `GEMINI_MODEL` | Giá trị mặc định trong template (`google/gemini-2.5-flash`, `gemini-2.5-flash`) là ổn. | Ghi đè nếu muốn dùng model khác. |
| `AI_SERVICE_MOCK_MODE` | `true` cho offline/benchmark (QA-21), `false` khi production. | Chế độ mock không cần bất kỳ API key nào. |
| `CORS_ALLOWED_ORIGINS`, `AI_SERVICE_PORT`, `AI_SERVICE_REQUEST_TIMEOUT_SECONDS`, `AI_SERVICE_MAX_RETRIES`, `AI_SERVICE_IMAGE` | Không phải secret / tự động quản lý. | Tag image được CD ghi đè lại. |

---

## 3. File `.env` trên máy lập trình viên (local)

### 3.1. Frontend — `frontend/.env`
Template: `frontend/env.frontend.example`.

```bash
cd frontend
cp env.frontend.example .env
```

| Biến | Cách lấy | Ghi chú |
|----------|---------------|-------|
| `VITE_API_BASE_URL` | URL backend local của bạn (mặc định `http://localhost:8080/api/v1`). | Với staging/prod bạn có thể trỏ tới URL tunnel (`https://api.hotung9108.me/api/v1`). |
| `VITE_APP_ENV` | `development` \| `staging` \| `production`. | Chỉ dùng để hiển thị/debug. |

### 3.2. Backend — `backend/.env` (dev local)
Cấu trúc giống §2.1 nhưng trỏ tới tài nguyên local (Postgres local hoặc nhánh dev của Neon, MinIO local, v.v.).
Copy `env.production.example` rồi chỉnh sửa, hoặc làm theo `docs/setup/DEV_ENVIRONMENT_GUIDE.md`.

### 3.3. AI service — `ai-service/.env` (dev local)
Copy `env.ai-service.example` → `ai-service/.env` và điền `OPENROUTER_API_KEY` và/hoặc `GEMINI_API_KEY`,
hoặc đặt `AI_SERVICE_MOCK_MODE=true` để chạy hoàn toàn offline.

---

## 4. Checklist thiết lập nhanh (môi trường mới)

1. **Secrets trên GitHub repo** — tạo tất cả secret trong §1.1 và §1.2 (9 secret thủ công cộng với `GITHUB_TOKEN` tự động).
2. **Thư mục trên server** — đảm bảo các thư mục sau tồn tại với đúng file `.env`:
   - `/home/<SERVER_USER>/englishhub/.env` (từ `env.production.example`)
   - `/home/<SERVER_USER>/englishhub-dev/.env` (staging, dùng cùng template)
   - `/home/<SERVER_USER>/ai-service/.env` (từ `env.ai-service.example`, đã điền key)
   - `/home/<SERVER_USER>/tunnel/.env` (từ `env.tunnel.example`)
3. **Docker network dùng chung** — CD tự động tạo, nhưng bạn có thể tạo trước:
   `docker network create englishhub_shared`
4. **Cặp khóa SSH** — khóa public nằm trong `~/.ssh/authorized_keys` của `SERVER_USER`, khóa private nằm trong secret `SSH_PRIVATE_KEY`.
5. **Tailscale** — máy deploy đã tham gia tailnet; auth key nằm trong `TAILSCALE_AUTHKEY`.
6. **Vercel** — frontend đã được link (`vercel link`), org/project ID đã có trong secrets, `VERCEL_TOKEN` còn hiệu lực.
7. Kiểm tra bằng một lần push thử: CI → CD cần build, push lên GHCR, SSH vào, pull và `docker compose up`.

## 5. Lưu ý bảo mật

- Không bao giờ commit file `.env` thật — `.gitignore` đã loại trừ chúng; TruffleHog (`security-scan.yml`) kiểm tra trên mỗi push/PR.
- Ưu tiên dùng **fine-grained PAT** với phạm vi quyền tối thiểu (chỉ `read:packages`) cho `GHCR_PAT`.
- Xoay vòng (rotate) `JWT_SECRET`, `SSH_PRIVATE_KEY`, `TAILSCALE_AUTHKEY`, và các API key của provider ngay lập tức nếu bị lộ.
- Lưu bản sao cá nhân của các secret production trong trình quản lý mật khẩu, không lưu trong chat hoặc ticket.
