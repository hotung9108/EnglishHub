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

Script cũng có **rollback dựa trên "bản ổn định"** (không phải chỉ đơn giản "bản trước đó"):

1. **Trước khi deploy**, script kiểm tra nhanh xem bản image đang chạy hiện tại có đang healthy không. Nếu có → ghi nhận nó vào file `.stable_tag` (nằm cạnh `.env`) làm **bản ổn định**. Nếu bản hiện tại không healthy (hoặc chưa từng healthy) → giữ nguyên bản ổn định cũ đã ghi nhận trước đó (nếu có).
2. Deploy bản mới nhất (nếu có).
3. Health check trong tối đa `HEALTH_CHECK_TIMEOUT` giây.
4. Nếu **vẫn unhealthy sau khi hết thời gian chờ**:
   - Có bản ổn định đã ghi nhận và khác bản vừa deploy → **rollback** về bản đó.
   - **Không có** bản ổn định nào (vd lần đầu deploy, hoặc chưa bao giờ healthy) → **giữ nguyên bản hiện tại**, không rollback (vì không có đích để quay về), chỉ cảnh báo để bạn tự xử lý.
5. Nếu healthy (dù là bản mới hay sau khi rollback) → cập nhật `.stable_tag` = bản đang chạy, làm baseline cho lần sau.

Áp dụng cho **AI Service, Backend production, Backend staging**. Tunnel không có cơ chế health check/rollback (chỉ `docker compose up -d` như bình thường), vì tunnel không có "version" để pull/rollback.

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

# curl - dùng để kiểm tra mạng và (tuỳ chọn) gửi notify
curl --version

# jq - CHỈ cần khi NOTIFY_METHOD là "discord" hoặc "webhook" (escape JSON)
sudo apt-get install -y jq curl
```

Script sẽ tự kiểm tra các lệnh trên ngay khi bắt đầu và dừng với thông báo rõ ràng nếu thiếu (`docker`/`curl`/`gh` luôn bắt buộc, `jq` chỉ khi cần).

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
REPO="hotung9108/EnglishHub"      # owner/repo GitHub
SERVER_USER="pmtuan"              # user chạy docker trên server
```

Script trong repo này đã điền sẵn 2 giá trị trên cho server hiện tại — **chỉ đổi nếu bạn dùng server/repo khác**.

Các biến còn lại (`TUNNEL_DIR`, `AI_SERVICE_DIR`, `BACKEND_PROD_DIR`, `BACKEND_STAGING_DIR`, tên image...) đã khớp với cấu trúc thư mục suy ra từ 3 file CD bạn gửi — kiểm tra lại cho đúng với server thật của bạn, đặc biệt nếu đường dẫn khác.

Ngoài `REPO` và `SERVER_USER`, có 3 cờ trong `CONFIG` quyết định script sẽ deploy cái gì lúc boot:

| Biến | Mặc định trong script | Ý nghĩa |
|---|---|---|
| `ENABLE_PRODUCTION` | `false` | Có deploy **backend production** (`docker-compose.prod.yml`, nhánh `main`) khi boot không |
| `ENABLE_STAGING` | `true` | Có deploy **backend staging** (`docker-compose.staging.yml`, nhánh `staging`) khi boot không |
| `AI_SERVICE_BRANCH` | `staging` | AI Service chạy theo bản của nhánh nào (`main`/`staging`) |

- Nếu server của bạn **không chạy staging**, đặt `ENABLE_STAGING=false`.
- Nếu server **không chạy backend production**, để `ENABLE_PRODUCTION=false`.

> ⚠️ Lưu ý: cả 2 cờ đều theo kiểu "bật thì deploy, tắt thì **bỏ qua hoàn toàn**" — đặt `false` nghĩa là script không hề đụng tới backend đó: không pull image, **cũng không** `docker compose up -d` để khởi động lại container đang có. Nếu bạn vẫn muốn script đảm bảo container prod đang chạy nhưng không tự nâng version, hãy để `ENABLE_PRODUCTION=true` và ghim tag trong `.env`: script sẽ thấy version trùng và chỉ chạy `docker compose up -d`.

Vài biến `CONFIG` khác cần biết:

```bash
LOG_FILE="/home/${SERVER_USER}/logs/englishhub-startup.log"   # nơi ghi log, tự tạo thư mục nếu chưa có
```

> Script kiểm tra sự tồn tại của `docker`, `curl`, `gh` ngay khi bắt đầu (thiếu là dừng ngay, có notify). `jq` chỉ bắt buộc khi `NOTIFY_METHOD` là `discord` hoặc `webhook`.

### Cấu hình health check / rollback

```bash
# Tên service PHẢI khớp đúng key dưới "services:" của từng file compose
AI_SERVICE_COMPOSE_SERVICE="ai-service"        # docker-compose.ai-service.yml
BACKEND_PROD_COMPOSE_SERVICE="backend"         # docker-compose.prod.yml
BACKEND_STAGING_COMPOSE_SERVICE="backend-staging"  # docker-compose.staging.yml (tên KHÁC prod!)

# Tunnel: chỉ cần file + tên service (không có version để pull/rollback)
TUNNEL_COMPOSE_FILE="docker-compose.tunnel.yml"
TUNNEL_COMPOSE_SERVICE="tunnel"

AI_SERVICE_HEALTH_URL=""          # vd http://localhost:8001/health, để trống nếu chưa có
BACKEND_HEALTH_URL=""             # vd http://localhost:8080/actuator/health (production)
BACKEND_STAGING_HEALTH_URL=""     # vd http://localhost:8082/actuator/health (staging)

HEALTH_CHECK_TIMEOUT=300   # giây, chờ healthy sau deploy trước khi coi là fail -> rollback
PRECHECK_TIMEOUT=20        # giây, chờ xác nhận bản ĐANG CHẠY có healthy không (trước khi deploy)
HEALTH_POLL_INTERVAL=5     # giây giữa mỗi lần poll
HEALTH_STABLE_CHECKS=3     # số lần poll liên tiếp "container ổn định" nếu không có healthcheck/health_url
```

#### Để trống `*_HEALTH_URL` được không? (có, và nên để trống trong trường hợp này)

Để trống **không** có nghĩa là "coi như luôn healthy". Script kiểm tra theo thứ tự ưu tiên, dùng cái đầu tiên có:

1. **Docker healthcheck** (ưu tiên cao nhất) — nếu file compose của service có khai báo `healthcheck:` thì script đọc thẳng `docker inspect ... State.Health.Status`, và **`*_HEALTH_URL` bị bỏ qua hoàn toàn**.
2. **`*_HEALTH_URL`** — chỉ khi service **không** có `healthcheck`. Script `curl` URL đó, phải OK liên tiếp `HEALTH_STABLE_CHECKS` lần mới tính là healthy.
3. **Fallback** — chỉ khi không có cả 2 cái trên: coi là healthy nếu container `running`, không `restarting`, giữ nguyên trạng thái đó đủ `HEALTH_STABLE_CHECKS` lần poll liên tiếp (mặc định 3 × 5s = 15s).

Với repo này, cả `docker-compose.ai-service.yml`, `docker-compose.prod.yml` và `docker-compose.staging.yml` **đều đã khai báo `healthcheck:`** → script luôn dùng cách 1, nên 3 biến `*_HEALTH_URL` cứ để trống `""`.

Chỉ điền khi bạn thêm 1 service mới không có `healthcheck`, hoặc muốn kiểm tra sâu hơn (vd kiểm tra app còn phản hồi, không chỉ container sống). Giá trị đúng cho stack hiện tại (chạy từ **host** nên dùng **port host** - `AI_SERVICE_PORT`/`BACKEND_PORT` trong `.env`, không phải `SERVER_PORT` bên trong container):

```bash
AI_SERVICE_HEALTH_URL="http://localhost:8001/health"              # FastAPI /health
BACKEND_HEALTH_URL="http://localhost:8080/actuator/health"        # Spring Actuator, prod (BACKEND_PORT=8080)
BACKEND_STAGING_HEALTH_URL="http://localhost:8082/actuator/health" # staging (BACKEND_PORT=8082)
```

> ⚠️ Điền sai (sai port, sai path, thiếu `/actuator`) thì `curl` fail → script coi là unhealthy và **rollback oan** sau `HEALTH_CHECK_TIMEOUT`. Nếu không chắc, hãy để trống và dựa vào `healthcheck:` của compose.

> ⚠️ `*_HEALTH_URL` chỉ xác nhận "có HTTP 200 ở đâu đó" — nếu bạn đổi `SERVER_PORT`, nhớ sửa cả URL này cho khớp port host thực tế (`docker compose ps` để xem port đang map).

> ⚠️ Dễ sai nhất là nhóm `*_COMPOSE_SERVICE`: `docker-compose.prod.yml` đặt service tên `backend`, còn `docker-compose.staging.yml` đặt tên `backend-staging`. Nếu điền sai tên, `docker compose ps -q <tên>` trả về rỗng → script tưởng service chưa chạy, chờ hết `HEALTH_CHECK_TIMEOUT` rồi báo unhealthy/rollback oan dù container thực tế vẫn đang chạy tốt.

Script **không bao giờ rollback ngay lập tức** khi thấy 1 lần "unhealthy" hay "chưa chạy" — luôn chờ đủ `HEALTH_CHECK_TIMEOUT` giây rồi mới kết luận, để tránh rollback oan vì container đang khởi động chậm.

### File `.stable_tag`

Mỗi thư mục deploy (`ai-service/`, `englishhub/`, `englishhub-dev/`) sẽ có thêm 1 file `.stable_tag` cạnh `.env`, chỉ chứa 1 dòng là tag (SHA commit) của bản gần nhất được xác nhận healthy. Đây là "bộ nhớ" để script biết rollback về đâu — **không nên xoá thủ công** file này trừ khi bạn chắc chắn muốn reset trạng thái (lần deploy kế tiếp sẽ không có gì để rollback về cho tới khi có 1 bản healthy mới).

### File `.env`

Mỗi thư mục deploy cần có `.env` (chứa `DB_URL`, `JWT_SECRET`, và biến image do CD ghi vào):

- `ai-service/.env` ← `AI_SERVICE_IMAGE=...` (do `cd-ai-service.yml` ghi)
- `englishhub/.env` ← `BACKEND_IMAGE=...` (do `cd-backend.yml` ghi)
- `englishhub-dev/.env` ← `BACKEND_IMAGE=...` (do `cd-backend-development.yml` ghi)

Nếu `.env` chưa tồn tại, script tự copy từ `env.production.example` / `env.ai-service.example` và **cảnh báo** — bạn vẫn phải kiểm tra lại các giá trị bắt buộc, vì bản deploy đầu tiên có thể fail do thiếu secret. Nếu không có file `*example` nào, script bỏ qua service đó và notify lỗi (thay vì chờ hết `HEALTH_CHECK_TIMEOUT` rồi rollback vô ích).

Script luôn chạy `docker compose up -d --no-build`: image được build trên CI rồi push lên GHCR, server chỉ **pull về**, không build tại chỗ (kể cả AI Service, dù compose của nó có `build:`).

---

## Bước 2.5 (tuỳ chọn) — Cấu hình thông báo (notify) cho admin

Script gửi thông báo ở các mốc quan trọng: bắt đầu deploy bản mới, deploy/rollback healthy trở lại, và đặc biệt là **lỗi cần can thiệp thủ công** (unhealthy không rollback được, rollback xong vẫn lỗi...). Chọn 1 trong các cách dưới, đặt `NOTIFY_METHOD` tương ứng trong script.

### Cách 1 — ntfy.sh (đơn giản nhất, không cần tài khoản)

[ntfy.sh](https://ntfy.sh) là dịch vụ push notification miễn phí, mã nguồn mở — bạn tự nghĩ ra 1 "topic" (giống tên phòng), subscribe nó trên app ntfy (iOS/Android) hoặc trình duyệt, server chỉ cần POST tin nhắn tới `https://ntfy.sh/<topic>`.

```bash
NOTIFY_METHOD="ntfy"
NOTIFY_NTFY_URL="https://ntfy.sh/englishhub-alerts-x7k2p9"   # đặt topic dài, khó đoán — ai biết topic cũng đọc được tin
```

Cài app ntfy, subscribe đúng topic đó là xong — không cần đăng ký gì thêm. Muốn riêng tư tuyệt đối hơn thì tự host ntfy server ([hướng dẫn](https://docs.ntfy.sh/install/)).

### Cách 2 — Telegram Bot

1. Nhắn [@BotFather](https://t.me/BotFather) trên Telegram → `/newbot` → lấy **bot token**.
2. Nhắn bất kỳ tin nào cho bot vừa tạo, sau đó mở `https://api.telegram.org/bot<TOKEN>/getUpdates` trên trình duyệt → lấy `chat.id` trong kết quả JSON, đó là **chat ID** của bạn.

```bash
NOTIFY_METHOD="telegram"
NOTIFY_TELEGRAM_BOT_TOKEN="123456789:AAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
NOTIFY_TELEGRAM_CHAT_ID="987654321"
```

### Cách 3 — Discord Webhook

Server Discord → Server Settings → Integrations → Webhooks → New Webhook → copy URL.

```bash
NOTIFY_METHOD="discord"
NOTIFY_DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/xxxxx/yyyyy"
```

### Cách 4 — Email qua SMTP

Gửi thẳng bằng `curl` (hỗ trợ SMTP sẵn trên hầu hết các bản curl, kể cả Arch Linux), không cần cài `mailx`/`msmtp`.

**Với Gmail** (áp dụng tương tự cho Zoho, Outlook, hay SMTP server riêng):

1. Bật **2-Step Verification** cho tài khoản Gmail (bắt buộc để tạo App Password).
2. Google Account → Security → 2-Step Verification → **App passwords** → tạo 1 app password cho "Mail" → copy mã 16 ký tự.
3. Lưu mã đó vào server (không ghi thẳng vào script):

```bash
nano /home/<SERVER_USER>/.secrets/smtp_pass   # dán app password vào đây, không xuống dòng thừa
chmod 600 /home/<SERVER_USER>/.secrets/smtp_pass
```

4. Cấu hình trong `startup-deploy.sh`:

```bash
NOTIFY_METHOD="email"
NOTIFY_SMTP_HOST="smtp.gmail.com"
NOTIFY_SMTP_PORT="465"
NOTIFY_SMTP_USER="your-account@gmail.com"
NOTIFY_SMTP_PASS_FILE="/home/<SERVER_USER>/.secrets/smtp_pass"
NOTIFY_EMAIL_FROM="your-account@gmail.com"
NOTIFY_EMAIL_TO="admin1@example.com,admin2@example.com"   # nhiều người cách nhau dấu phẩy
```

> Kiểm tra `curl` trên server có hỗ trợ SMTP không: `curl --version | grep -i Protocols` — nếu dòng Protocols không có `smtp`/`smtps`, cần cài bản curl đầy đủ hơn hoặc dùng `msmtp` thay thế (ngoài phạm vi hướng dẫn này).
> Dùng nhà cung cấp SMTP khác (không phải Gmail): đổi `NOTIFY_SMTP_HOST`/`NOTIFY_SMTP_PORT` theo họ, `NOTIFY_SMTP_USER`/`smtp_pass` theo thông tin đăng nhập SMTP họ cấp (một số dịch vụ như SendGrid/Mailgun dùng API key làm "password").

### Cách 5 — Webhook JSON chung

Dùng khi bạn có sẵn hệ thống nhận webhook khác (Slack incoming webhook, n8n, Make.com, hoặc tự viết 1 endpoint nhỏ nhận `{"text": "..."}`).

```bash
NOTIFY_METHOD="webhook"
NOTIFY_WEBHOOK_URL="https://your-endpoint.example.com/notify"
```

### Không muốn nhận thông báo

```bash
NOTIFY_METHOD="none"   # mặc định
```

> Cần cài thêm `jq` trên server nếu dùng `discord` hoặc `webhook` (dùng để escape JSON cho đúng) — đã có trong phần "Yêu cầu trên server" ở trên. `ntfy`, `telegram` và `email` chỉ cần `curl`.

> Muốn gửi đồng thời nhiều kênh (vd vừa Telegram vừa ntfy): mở `startup-deploy.sh`, sửa hàm `notify()` — thêm 1 block `case` nữa hoặc gọi tuần tự 2 lệnh `curl` thay vì dùng `case ... esac` chọn 1.

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
echo $?                                            # 0 = tất cả healthy
tail -f /home/<SERVER_USER>/logs/englishhub-startup.log
```

Kiểm tra: container nào đang sai version thì script phải pull & restart đúng container đó; container nào đã đúng thì chỉ in log "Đã ở version mới nhất".

Script trả **exit code 0** khi mọi service (tunnel, AI service, các backend đang bật) đều lên healthy, và **exit code 1** nếu có bất kỳ service nào không healthy sau khi đã thử rollback. Khi chạy tay bằng `sudo -u <SERVER_USER> ...` có thể kiểm tra bằng `echo $?`; khi chạy qua systemd, exit code này quyết định unit ở trạng thái `active (exited)` hay `failed`.

**Test riêng kênh notify** (không cần chờ unhealthy thật xảy ra) — chạy lệnh tương ứng với kênh đã chọn:

```bash
# ntfy
curl -d "Test thông báo từ startup-deploy" "https://ntfy.sh/<topic-cua-ban>"

# telegram
curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
  --data-urlencode "chat_id=<CHAT_ID>" --data-urlencode "text=Test thông báo"

# discord
curl -H "Content-Type: application/json" -d '{"content":"Test thông báo"}' "<DISCORD_WEBHOOK_URL>"

# webhook chung
curl -H "Content-Type: application/json" -d '{"text":"Test thông báo"}' "<NOTIFY_WEBHOOK_URL>"

# email (thay <SMTP_USER>, <APP_PASSWORD>, <TO> cho đúng)
echo -e "From: <SMTP_USER>\nTo: <TO>\nSubject: Test\n\nTest thông báo" | \
  curl --ssl-reqd --url "smtps://smtp.gmail.com:465" \
    --mail-from "<SMTP_USER>" --mail-rcpt "<TO>" \
    --user "<SMTP_USER>:<APP_PASSWORD>" --upload-file -
```

Nhận được tin nhắn test là coi như cấu hình đúng, script sẽ gửi được khi có sự kiện thật.

---

## Bước 4 — Tạo systemd service chạy lúc boot

```bash
# englishhub-startup.service đã điền sẵn User=pmtuan khớp với SERVER_USER trong script
# (đổi lại nếu server của bạn dùng user khác)
sudo cp englishhub-startup.service /etc/systemd/system/englishhub-startup.service

sudo systemctl daemon-reload
sudo systemctl enable englishhub-startup.service

# Test ngay không cần reboot
sudo systemctl start englishhub-startup.service
sudo systemctl status englishhub-startup.service
journalctl -u englishhub-startup.service -f
```

`Type=oneshot` + `RemainAfterExit=yes`: service chạy 1 lần lúc boot rồi coi như "active" luôn (không phải service chạy nền liên tục), đúng với bản chất của script (chạy xong là thôi).

Unit đã đặt `TimeoutStartSec=infinity` vì 1 lần boot có thể phải chờ health check + rollback cho từng service (`HEALTH_CHECK_TIMEOUT` × số service) — để mặc định 600s systemd sẽ kill script giữa chừng (kể cả khi script đang rollback dở).

Nếu script trả exit code 1 (có service không healthy), unit sẽ ở trạng thái `failed`:

```bash
systemctl status englishhub-startup.service   # thấy "failed" + exit code
journalctl -u englishhub-startup.service -n 200
```

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
   ├─ kiểm tra docker / curl / gh có sẵn (thiếu → dừng ngay, notify)
   ├─ docker login ghcr.io (thất bại → chỉ warn, thử dùng image cache local)
   ├─ tạo network englishhub_shared nếu chưa có
   ├─ start Cloudflare Tunnel (thiếu file compose → bỏ qua + notify, không rollback)
   │
   ├─ [1] AI Service
   │     ├─ pre-check: bản đang chạy có healthy không? có → ghi .stable_tag
   │     ├─ hỏi GitHub: commit nào là lần "cd-ai-service.yml" thành công gần nhất trên nhánh AI_SERVICE_BRANCH?
   │     ├─ khác bản hiện tại → pull image:<sha mới>, sửa .env, up -d --pull always --no-build, notify "info"
   │     ├─ giống → chỉ up -d --no-build (đảm bảo đang chạy, pull nếu image bị thiếu)
   │     ├─ health check tối đa HEALTH_CHECK_TIMEOUT giây
   │     ├─ healthy → cập nhật .stable_tag = bản này
   │     └─ hết giờ vẫn unhealthy →
   │           ├─ có .stable_tag khác bản lỗi → rollback, up -d, health check lại, notify "warn"/"error"
   │           └─ không có .stable_tag (hoặc trùng bản lỗi) → GIỮ NGUYÊN, notify "error", cần tay can thiệp
   │
   ├─ [2] Backend production (nhánh main, workflow cd-backend.yml) — nếu ENABLE_PRODUCTION=true
   │     └─ (logic deploy + health check + rollback + notify giống AI Service)
   │
   └─ [3] Backend staging (nhánh staging, workflow cd-backend-development.yml) — nếu ENABLE_STAGING=true
         └─ (logic deploy + health check + rollback + notify giống AI Service)

exit 0 = tất cả service healthy | exit 1 = có service lỗi sau khi đã thử rollback
```

---

## Xử lý sự cố thường gặp

| Triệu chứng | Nguyên nhân khả dĩ |
|---|---|
| Log `Thiếu file .../gh_token` | Chưa tạo file token ở Bước 1.3, hoặc sai `SERVER_USER` trong config |
| `tee: /home/.../logs/...: Permission denied` khi chạy bằng user thường | `LOG_FILE` trỏ vào thư mục user không ghi được (vd đổi sang `/var/log/`). Mặc định script dùng `/home/<SERVER_USER>/logs/englishhub-startup.log` và tự tạo thư mục — nếu vẫn lỗi, tạo sẵn: `mkdir -p /home/<SERVER_USER>/logs && chown <SERVER_USER>:<SERVER_USER> /home/<SERVER_USER>/logs` |
| `gh api` trả rỗng, script giữ nguyên version cũ dù đã có bản mới | Token Actions thiếu quyền `Actions: Read-only`, hoặc `REPO` sai owner/repo |
| `docker login ghcr.io` lỗi | Token GHCR hết hạn / thiếu `read:packages`, hoặc không phải classic token khi fine-grained chưa hỗ trợ |
| AI Service / Backend không bao giờ "healthy", mỗi lần boot bị delay đúng `HEALTH_CHECK_TIMEOUT` giây | Compose file chưa khai báo `healthcheck` và chưa set `*_HEALTH_URL` — script fallback coi "container running ổn định `HEALTH_STABLE_CHECKS` lần" là đủ, kiểm tra container có thật sự đứng yên không (`docker ps`, `docker logs`) |
| `docker compose ps -q <service>` không ra gì | `*_COMPOSE_SERVICE` không khớp tên service thật trong file `docker-compose.*.yml` — nhớ prod là `backend`, staging là `backend-staging` |
| Container start nhưng không join được mạng | Kiểm tra `englishhub_shared` đã tồn tại, và tunnel container start trước backend/AI service |
| Log báo "ROLLBACK" liên tục mỗi lần boot | Bản mới nhất trên nhánh tương ứng thực sự đang lỗi — không phải bug của script, kiểm tra `docker logs`, hoặc revert/sửa code rồi push lại để CD build bản khác |
| `KHÔNG CÓ bản ổn định để rollback` | Chưa có lần deploy nào trước đó từng healthy đủ lâu để được ghi vào `.stable_tag` (vd mới setup lần đầu) — cần xử lý thủ công lần này; các lần sau sẽ có baseline |
| Không nhận được thông báo dù đã cấu hình | Kiểm tra `NOTIFY_METHOD` đúng chính tả (`ntfy`/`telegram`/`discord`/`webhook`), test thủ công bằng `curl` với đúng URL/token đã điền, và với `discord`/`webhook` kiểm tra đã cài `jq` chưa |
| Script dừng ngay với `Thiếu lệnh 'gh'` / `'docker'` / `'curl'` | Server chưa cài CLI tương ứng — xem phần "Yêu cầu trên server" |
| Script tự copy `.env` từ `*example` và deploy lỗi | Bản `.env` tạo tạm thiếu secret thật (`DB_URL`, `JWT_SECRET`...) — sửa `.env` cho đúng rồi chạy lại script |
| `systemctl status` báo `failed` | Script trả exit code 1 = có service không healthy sau khi thử rollback — đọc log/notify để biết service nào |

---

## Lưu ý bảo mật

- 2 PAT lưu trong `/home/<SERVER_USER>/.secrets/` nên set quyền `700`/`600` như hướng dẫn — đây là thư mục **không** nên backup lên git hay chia sẻ.
- Nên dùng fine-grained token, giới hạn đúng 1 repo, quyền tối thiểu (Actions: Read-only, Packages: read) thay vì PAT toàn quyền.
- Nếu muốn an toàn hơn nữa, có thể set token hết hạn sau ~1 năm và nhắc lịch gia hạn.
