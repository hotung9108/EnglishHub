# Tự động kiểm tra & deploy lại Backend / AI Service khi server khởi động

## Vấn đề

3 workflow CD hiện tại (`cd-backend.yml`, `cd-backend-development.yml`, `cd-ai-service.yml`) chỉ chạy khi có **push** vào `main`/`staging`. Nếu home server bị tắt (mất điện, reboot, update hệ điều hành...) thì khi bật lại:

- Docker container có thể không tự chạy, hoặc chạy nhưng là **bản cũ** nếu có commit mới đã được deploy trong lúc server tắt (thực ra điều này không xảy ra vì CD chạy trên GitHub Actions runner, không phải trên server — nhưng image mới đã được build/push, chỉ là server tắt nên **không ai pull & restart** container với image mới đó).
- Không có cơ chế nào tự kiểm tra "server đang chạy đúng bản mới nhất chưa" khi khởi động lại.

Giải pháp: thêm 1 script chạy lúc server **boot**, làm nhiệm vụ:

1. Hỏi GitHub Actions: "lần chạy CD thành công gần nhất trên nhánh này là commit nào?"
2. So sánh với tag image đang ghi trong `.env` ở server.
3. Nếu khác → pull image đúng commit đó và `docker compose up -d` lại.
4. Nếu giống → chỉ đảm bảo container đang chạy (phòng trường hợp nó chưa tự start).
5. Thứ tự: **Tunnel → AI Service (chờ healthy) → Backend production → Backend staging** (2 bước sau có thể tắt bằng `ENABLE_PRODUCTION` / `ENABLE_STAGING`).

Script này **không thay thế** 3 CD workflow — nó chỉ chạy đúng 1 lần lúc boot (và tuỳ chọn định kỳ) để "đồng bộ lại" server với trạng thái mới nhất trên GitHub, phòng trường hợp server bị tắt đúng lúc có deploy.

> ⚠️ Lưu ý về kiến trúc hiện tại: `cd-ai-service.yml` deploy AI Service dùng **chung 1 thư mục/instance** cho cả nhánh `main` và `staging` (không có AI Service riêng cho staging). Vì vậy script dùng biến `AI_SERVICE_BRANCH` để chọn lấy version AI Service mới nhất theo 1 nhánh (`staging` trong script hiện tại). Nếu muốn AI Service luôn chạy theo bản `main` thì đổi biến `AI_SERVICE_BRANCH` thành `main`.

---

## File đi kèm

| File | Mục đích |
|---|---|
| `startup-deploy.sh` | Script chính, chạy khi server boot |
| `englishhub-startup.service` | systemd unit để chạy script lúc boot |
| `englishhub-startup.timer` | (tuỳ chọn) chạy lại script định kỳ để tự phục hồi |

---

## Yêu cầu trên server

```bash
# docker + docker compose plugin (v2, lệnh "docker compose", không phải "docker-compose")
docker --version
docker compose version

# GitHub CLI (gh) - dùng để query Actions API
# cài theo hướng dẫn chính thức: https://github.com/cli/cli/blob/trunk/docs/install_linux.md
gh --version

# jq - gh api --jq cần jq có sẵn trên máy
sudo apt-get install -y jq curl
```

---

## Bước 1 — Tạo 2 Personal Access Token (PAT)

Script cần 2 token **riêng biệt**, quyền tối thiểu, không dùng chung với `secrets.GITHUB_TOKEN` trên Actions:

### 1.1. Token đọc Actions API (để hỏi "commit mới nhất đã deploy thành công")

- GitHub → Settings → Developer settings → **Fine-grained personal access tokens** → Generate new token
- Repository access: chỉ chọn repo của bạn
- Permissions: **Actions → Read-only**
- Copy token lại.

### 1.2. Token pull image từ GHCR (ghcr.io)

- Dùng lại loại token tương tự, nhưng cần quyền **`read:packages`**
  (fine-grained token hiện chưa cấp được quyền packages độc lập cho mọi trường hợp, nếu gặp vướng mắc bạn có thể tạo **classic token** với scope `read:packages` thay thế).
- Copy token lại.

### 1.3. Lưu token vào server

```bash
sudo mkdir -p /home/<SERVER_USER>/.secrets
sudo chown <SERVER_USER>:<SERVER_USER> /home/<SERVER_USER>/.secrets
chmod 700 /home/<SERVER_USER>/.secrets

# Dán token Actions Read-only vào đây (không xuống dòng thừa)
nano /home/<SERVER_USER>/.secrets/gh_token

# Dán token read:packages vào đây
nano /home/<SERVER_USER>/.secrets/ghcr_pat

chmod 600 /home/<SERVER_USER>/.secrets/gh_token
chmod 600 /home/<SERVER_USER>/.secrets/ghcr_pat
```

Thay `<SERVER_USER>` bằng user thật chạy docker trên server của bạn trong tất cả lệnh ở hướng dẫn này.

---

## Bước 2 — Cấu hình script

Mở `startup-deploy.sh`, sửa phần `CONFIG` ở đầu file:

```bash
REPO="hotung9108/REPLACE_WITH_REPO_NAME"   # owner/repo GitHub, vd: hotung9108/english-hub
SERVER_USER="REPLACE_WITH_SERVER_USER"     # user chạy docker trên server
```

Các biến còn lại (`TUNNEL_DIR`, `AI_SERVICE_DIR`, `BACKEND_PROD_DIR`, `BACKEND_STAGING_DIR`, tên image...) đã khớp với cấu trúc thư mục suy ra từ 3 file CD bạn gửi — kiểm tra lại cho đúng với server thật của bạn, đặc biệt nếu đường dẫn khác.

Ngoài `REPO` và `SERVER_USER`, có 3 cờ trong `CONFIG` quyết định script sẽ deploy cái gì lúc boot:

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `ENABLE_PRODUCTION` | `true` | Có deploy **backend production** (`docker-compose.prod.yml`, nhánh `main`) khi boot không |
| `ENABLE_STAGING` | `true` | Có deploy **backend staging** (`docker-compose.staging.yml`, nhánh `staging`) khi boot không |
| `AI_SERVICE_BRANCH` | `staging` | AI Service chạy theo bản của nhánh nào (`main`/`staging`) |

- Nếu server của bạn **không chạy staging**, đặt `ENABLE_STAGING=false`.
- Nếu server **không chạy backend production**, đặt `ENABLE_PRODUCTION=false`.

> ⚠️ Lưu ý: cả 2 cờ đều theo kiểu "bật thì deploy, tắt thì **bỏ qua hoàn toàn**" — đặt `false` nghĩa là script không hề đụng tới backend đó: không pull image, **cũng không** `docker compose up -d` để khởi động lại container đang có. Nếu bạn vẫn muốn script đảm bảo container prod đang chạy nhưng không tự nâng version, hãy để `ENABLE_PRODUCTION=true` và ghim tag trong `.env`: script sẽ thấy version trùng và chỉ chạy `docker compose up -d`.

---

## Bước 3 — Copy script lên server

```bash
sudo mkdir -p /home/<SERVER_USER>/scripts
sudo cp startup-deploy.sh /home/<SERVER_USER>/scripts/startup-deploy.sh
sudo chown <SERVER_USER>:<SERVER_USER> /home/<SERVER_USER>/scripts/startup-deploy.sh
chmod +x /home/<SERVER_USER>/scripts/startup-deploy.sh
```

Test thủ công trước khi gắn vào systemd:

```bash
sudo -u <SERVER_USER> /home/<SERVER_USER>/scripts/startup-deploy.sh
tail -f /home/pmtuan/logs/englishhub-startup.log
```

Kiểm tra: container nào đang sai version thì script phải pull & restart đúng container đó; container nào đã đúng thì chỉ in log "Đã ở version mới nhất".

---

## Bước 4 — Tạo systemd service chạy lúc boot

```bash
# Sửa REPLACE_WITH_SERVER_USER trong englishhub-startup.service trước khi copy
sudo cp englishhub-startup.service /etc/systemd/system/englishhub-startup.service

sudo systemctl daemon-reload
sudo systemctl enable englishhub-startup.service

# Test ngay không cần reboot
sudo systemctl start englishhub-startup.service
sudo systemctl status englishhub-startup.service
journalctl -u englishhub-startup.service -f
```

`Type=oneshot` + `RemainAfterExit=yes`: service chạy 1 lần lúc boot rồi coi như "active" luôn (không phải service chạy nền liên tục), đúng với bản chất của script (chạy xong là thôi).

---

## Bước 5 (tuỳ chọn) — Tự phục hồi định kỳ

Có 2 tình huống script lúc boot có thể "bỏ lỡ":

- Server bật lại **trước khi** mạng sẵn sàng quá lâu, hoặc GitHub Actions chưa kịp chạy xong CD cho commit mới nhất.
- Container bị crash sau đó (ngoài phạm vi reboot) mà không ai restart.

Dùng thêm systemd timer để chạy lại script mỗi 30 phút, tự đồng bộ lại nếu có gì lệch:

```bash
sudo cp englishhub-startup.timer /etc/systemd/system/englishhub-startup.timer
sudo systemctl daemon-reload
sudo systemctl enable --now englishhub-startup.timer
systemctl list-timers | grep englishhub
```

Vì script đã tự so sánh version trước khi pull/deploy, chạy định kỳ không gây deploy thừa — những lần không có gì thay đổi chỉ tốn vài request API.

---

## Cách hoạt động tóm tắt

```
boot server
   │
   ▼
englishhub-startup.service
   │
   ├─ chờ mạng tới GitHub (tối đa 120s, timeout thì dùng version cũ trong .env)
   ├─ docker login ghcr.io
   ├─ tạo network englishhub_shared nếu chưa có
   ├─ start Cloudflare Tunnel
   │
   ├─ [1] AI Service
   │     ├─ hỏi GitHub: commit nào là lần "cd-ai-service.yml" thành công gần nhất trên nhánh main?
   │     ├─ so với AI_SERVICE_IMAGE trong .env hiện tại
   │     ├─ khác → pull image:<sha mới>, sửa .env, docker compose up -d --pull always
   │     └─ giống → docker compose up -d (đảm bảo đang chạy)
   ├─ chờ AI Service healthy (tối đa 180s)
   │
   ├─ [2] Backend production (nhánh main, workflow cd-backend.yml) — nếu ENABLE_PRODUCTION=true
   │     └─ (logic giống AI Service)
   │
   └─ [3] Backend staging (nhánh staging, workflow cd-backend-development.yml) — nếu ENABLE_STAGING=true
         └─ (logic giống AI Service)
```

---

## Xử lý sự cố thường gặp

| Triệu chứng | Nguyên nhân khả dĩ |
|---|---|
| Log `Thiếu file .../gh_token` | Chưa tạo file token ở Bước 1.3, hoặc sai `SERVER_USER` trong config |
| `gh api` trả rỗng, script giữ nguyên version cũ dù đã có bản mới | Token Actions thiếu quyền `Actions: Read-only`, hoặc `REPO` sai owner/repo |
| `docker login ghcr.io` lỗi | Token GHCR hết hạn / thiếu `read:packages`, hoặc không phải classic token khi fine-grained chưa hỗ trợ |
| AI Service không bao giờ "healthy", backend bị delay tối đa 180s mỗi lần boot | Compose file AI Service chưa khai báo `healthcheck` — script sẽ tự fallback coi "đang chạy = sẵn sàng" sau khi phát hiện không có healthcheck, chỉ cần container ở trạng thái running |
| `docker compose ps -q ai-service` không ra gì | Tên service trong `docker-compose.ai-service.yml` không phải `ai-service` — sửa lại tên trong `wait_ai_service_healthy()` cho khớp |
| Container start nhưng không join được mạng | Kiểm tra `englishhub_shared` đã tồn tại, và tunnel container start trước backend/AI service |

---

## Lưu ý bảo mật

- 2 PAT lưu trong `/home/<SERVER_USER>/.secrets/` nên set quyền `700`/`600` như hướng dẫn — đây là thư mục **không** nên backup lên git hay chia sẻ.
- Nên dùng fine-grained token, giới hạn đúng 1 repo, quyền tối thiểu (Actions: Read-only, Packages: read) thay vì PAT toàn quyền.
- Nếu muốn an toàn hơn nữa, có thể set token hết hạn sau ~1 năm và nhắc lịch gia hạn.
