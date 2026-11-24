#!/usr/bin/env bash
set -uo pipefail
# Không dùng "set -e": nhiều bước ở đây được PHÉP fail (deploy fail -> rollback,
# health check fail -> rollback...) và cần tự xử lý bằng if/then.

############################################
# CONFIG - sửa các giá trị dưới đây cho đúng với server/repo của bạn
############################################
REPO="hotung9108/EnglishHub"        # owner/repo trên GitHub, vd: hotung9108/english-hub
SERVER_USER="pmtuan"                # user chạy docker trên server (vd: hotung9108)

GH_TOKEN_FILE="/home/${SERVER_USER}/.secrets/gh_token"     # PAT quyền "Actions: Read-only" trên repo
GHCR_PAT_FILE="/home/${SERVER_USER}/.secrets/ghcr_pat"     # PAT quyền "read:packages" để pull GHCR

LOG_FILE="/home/${SERVER_USER}/logs/englishhub-startup.log"

TUNNEL_DIR="/home/${SERVER_USER}/tunnel"
AI_SERVICE_DIR="/home/${SERVER_USER}/ai-service"
BACKEND_PROD_DIR="/home/${SERVER_USER}/englishhub"
BACKEND_STAGING_DIR="/home/${SERVER_USER}/englishhub-dev"

AI_SERVICE_IMAGE="ghcr.io/hotung9108/english-hub-ai-service"
BACKEND_IMAGE="ghcr.io/hotung9108/english-hub-backend"

NETWORK_NAME="englishhub_shared"

# AI service chỉ có 1 instance dùng chung cho main và staging (theo cd-ai-service.yml),
# nên ở đây chọn 1 nhánh để lấy version mới nhất: "main" hoặc "staging".
AI_SERVICE_BRANCH="staging"

# Có deploy backend production khi khởi động server không (true/false)
ENABLE_PRODUCTION=false
# Có deploy backend staging khi khởi động server không (true/false)
ENABLE_STAGING=true

# Thời gian tối đa chờ mạng / GitHub API sẵn sàng khi mới boot (giây)
NETWORK_WAIT_TIMEOUT=120

# ==== Health check & rollback ====
# Tên service trong từng file docker-compose (dùng cho "docker compose ps -q <tên>"
# và "docker compose up -d <tên>"). Phải khớp CHÍNH XÁC key dưới "services:" của
# từng file compose, nếu không health check sẽ luôn fail và script sẽ rollback oan.
AI_SERVICE_COMPOSE_SERVICE="ai-service"
# docker-compose.prod.yml -> services.backend
BACKEND_PROD_COMPOSE_SERVICE="backend"
# docker-compose.staging.yml -> services.backend-staging (tên KHÁC production!)
BACKEND_STAGING_COMPOSE_SERVICE="backend-staging"

# Tunnel: không có version để pull/rollback nên chỉ cần biết file + tên service
TUNNEL_COMPOSE_FILE="docker-compose.tunnel.yml"
TUNNEL_COMPOSE_SERVICE="tunnel"

# (Tuỳ chọn) endpoint HTTP để healthcheck chính xác hơn. Để trống nếu chưa có.
# LƯU Ý: chỉ được dùng khi service KHÔNG khai báo "healthcheck:" trong file compose.
# Compose của bạn (ai-service/prod/staging) ĐÃ có healthcheck -> để trống là đủ.
# Port ghi ở đây là port HOST (BACKEND_PORT / AI_SERVICE_PORT trong .env), KHÔNG phải SERVER_PORT.
AI_SERVICE_HEALTH_URL=""       # vd: http://localhost:8001/health
BACKEND_HEALTH_URL=""          # vd: http://localhost:8080/actuator/health (production)
BACKEND_STAGING_HEALTH_URL=""  # vd: http://localhost:8082/actuator/health (staging)

# Chờ healthy tối đa bao lâu sau khi deploy trước khi coi là fail -> rollback (giây)
HEALTH_CHECK_TIMEOUT=300
# Chờ tối đa bao lâu để xác nhận bản ĐANG CHẠY (trước khi deploy) có đang healthy không,
# dùng để quyết định có ghi nhận nó làm "bản ổn định" hay không (giây)
PRECHECK_TIMEOUT=20
# Khoảng nghỉ giữa mỗi lần poll (giây)
HEALTH_POLL_INTERVAL=5
# Nếu service không khai báo Docker healthcheck và không có HEALTH_URL: cần bao nhiêu lần
# poll liên tiếp thấy container "running, không restart" thì mới coi là healthy
HEALTH_STABLE_CHECKS=3

# File lưu "tag ổn định" cuối cùng của từng service, đặt cạnh .env trong thư mục deploy
STABLE_TAG_SUFFIX=".stable_tag"

# ==== Thông báo (notify admin) ====
# none | ntfy | telegram | discord | webhook | email  (có thể chỉ chọn 1; muốn gửi nhiều kênh,
# tự nhân bản hàm notify() hoặc gọi "notify" nhiều lần với method khác nhau)
NOTIFY_METHOD="none"

# --- ntfy.sh: khỏi cần tài khoản, chỉ cần tự đặt 1 "topic" bí mật và subscribe trên app ntfy ---
NOTIFY_NTFY_URL="https://ntfy.sh/REPLACE_WITH_YOUR_SECRET_TOPIC"

# --- Email qua SMTP (Gmail, Zoho, hoặc SMTP provider bất kỳ) - gửi bằng curl, không cần mailx/msmtp ---
NOTIFY_SMTP_HOST="smtp.gmail.com"
NOTIFY_SMTP_PORT="465"
NOTIFY_SMTP_USER=""                                                # email dùng để đăng nhập SMTP
NOTIFY_SMTP_PASS_FILE="/home/${SERVER_USER}/.secrets/smtp_pass"    # app password, lưu riêng file (không ghi thẳng vào script)
NOTIFY_EMAIL_FROM=""                                               # thường trùng NOTIFY_SMTP_USER
NOTIFY_EMAIL_TO=""                                                 # email admin nhận cảnh báo; nhiều người cách nhau dấu phẩy

# --- Telegram bot ---
NOTIFY_TELEGRAM_BOT_TOKEN=""
NOTIFY_TELEGRAM_CHAT_ID=""

# --- Discord webhook ---
NOTIFY_DISCORD_WEBHOOK_URL=""

# --- Webhook JSON chung (vd Slack incoming webhook, n8n, Make.com...) ---
NOTIFY_WEBHOOK_URL=""
############################################

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "::error:: Thiếu lệnh '$1' trên server. Xem phần 'Yêu cầu trên server' trong startup-deploy.md."
    notify "error" "startup-deploy: thiếu lệnh '$1', script dừng ngay từ đầu."
    exit 1
  fi
}

require_file() {
  if [ ! -f "$1" ]; then
    log "::error:: Thiếu file $1. Xem hướng dẫn trong startup-deploy.md để tạo."
    notify "error" "startup-deploy: thiếu file $1, script dừng ngay từ đầu."
    exit 1
  fi
}

# Cảnh báo sớm khi kênh notify được chọn nhưng thiếu cấu hình (thay vì im lặng không gửi)
check_notify_config() {
  case "$NOTIFY_METHOD" in
    none) ;;
    ntfy)
      [ -n "$NOTIFY_NTFY_URL" ] \
        || log "::warn:: NOTIFY_METHOD=ntfy nhưng NOTIFY_NTFY_URL đang rỗng -> sẽ không gửi được thông báo."
      ;;
    telegram)
      { [ -n "$NOTIFY_TELEGRAM_BOT_TOKEN" ] && [ -n "$NOTIFY_TELEGRAM_CHAT_ID" ]; } \
        || log "::warn:: NOTIFY_METHOD=telegram nhưng thiếu NOTIFY_TELEGRAM_BOT_TOKEN / NOTIFY_TELEGRAM_CHAT_ID."
      ;;
    discord)
      [ -n "$NOTIFY_DISCORD_WEBHOOK_URL" ] \
        || log "::warn:: NOTIFY_METHOD=discord nhưng NOTIFY_DISCORD_WEBHOOK_URL đang rỗng."
      ;;
    webhook)
      [ -n "$NOTIFY_WEBHOOK_URL" ] \
        || log "::warn:: NOTIFY_METHOD=webhook nhưng NOTIFY_WEBHOOK_URL đang rỗng."
      ;;
    email)
      { [ -n "$NOTIFY_SMTP_USER" ] && [ -n "$NOTIFY_EMAIL_FROM" ] && [ -n "$NOTIFY_EMAIL_TO" ]; } \
        || log "::warn:: NOTIFY_METHOD=email nhưng thiếu NOTIFY_SMTP_USER / NOTIFY_EMAIL_FROM / NOTIFY_EMAIL_TO."
      ;;
    *)
      log "::warn:: NOTIFY_METHOD='$NOTIFY_METHOD' không hợp lệ (chỉ nhận none|ntfy|telegram|discord|webhook|email) -> sẽ không gửi thông báo nào."
      ;;
  esac
}

# notify LEVEL MESSAGE   (level: info | warn | error — chỉ để hiển thị, không đổi hành vi gửi)
notify() {
  local level="$1" message="$2"
  [ "$NOTIFY_METHOD" = "none" ] && return 0

  local text
  text="[EnglishHub][$(hostname)][${level^^}] ${message}  ($(date '+%Y-%m-%d %H:%M:%S'))"

  case "$NOTIFY_METHOD" in
    ntfy)
      local priority="default"
      [ "$level" = "error" ] && priority="urgent"
      [ "$level" = "warn" ] && priority="high"
      curl -fsS \
        -H "Title: EnglishHub Deploy" \
        -H "Priority: ${priority}" \
        -H "Tags: ${level}" \
        -d "$message" \
        "$NOTIFY_NTFY_URL" >/dev/null 2>&1 \
        || log "::warn:: Gửi thông báo ntfy thất bại"
      ;;
    telegram)
      curl -fsS -X POST "https://api.telegram.org/bot${NOTIFY_TELEGRAM_BOT_TOKEN}/sendMessage" \
        --data-urlencode "chat_id=${NOTIFY_TELEGRAM_CHAT_ID}" \
        --data-urlencode "text=${text}" >/dev/null 2>&1 \
        || log "::warn:: Gửi Telegram thất bại"
      ;;
    discord)
      curl -fsS -H "Content-Type: application/json" \
        -d "$(jq -n --arg c "$text" '{content:$c}')" \
        "$NOTIFY_DISCORD_WEBHOOK_URL" >/dev/null 2>&1 \
        || log "::warn:: Gửi Discord thất bại"
      ;;
    webhook)
      curl -fsS -H "Content-Type: application/json" \
        -d "$(jq -n --arg t "$text" '{text:$t}')" \
        "$NOTIFY_WEBHOOK_URL" >/dev/null 2>&1 \
        || log "::warn:: Gửi webhook thất bại"
      ;;
    email)
      if [ ! -f "$NOTIFY_SMTP_PASS_FILE" ]; then
        log "::warn:: Thiếu file mật khẩu SMTP $NOTIFY_SMTP_PASS_FILE, bỏ qua gửi email."
      else
        local smtp_pass rcpt_args=() r
        smtp_pass=$(cat "$NOTIFY_SMTP_PASS_FILE")
        IFS=',' read -ra _email_rcpts <<< "$NOTIFY_EMAIL_TO"
        for r in "${_email_rcpts[@]}"; do
          rcpt_args+=(--mail-rcpt "$(echo "$r" | xargs)")
        done

        { \
          echo "From: ${NOTIFY_EMAIL_FROM}"; \
          echo "To: ${NOTIFY_EMAIL_TO}"; \
          echo "Subject: [EnglishHub][${level^^}] ${message:0:80}"; \
          echo "Content-Type: text/plain; charset=utf-8"; \
          echo; \
          echo "$text"; \
        } | curl -fsS --ssl-reqd \
              --url "smtps://${NOTIFY_SMTP_HOST}:${NOTIFY_SMTP_PORT}" \
              --mail-from "${NOTIFY_EMAIL_FROM}" \
              "${rcpt_args[@]}" \
              --user "${NOTIFY_SMTP_USER}:${smtp_pass}" \
              --upload-file - \
              >/dev/null 2>&1 \
          || log "::warn:: Gửi email thất bại"
      fi
      ;;
    *)
      log "::warn:: NOTIFY_METHOD='$NOTIFY_METHOD' không hợp lệ, bỏ qua thông báo."
      ;;
  esac
}

wait_for_network() {
  log "Đang chờ kết nối tới GitHub..."
  local waited=0
  until curl -fsS --max-time 5 https://api.github.com >/dev/null 2>&1; do
    if [ "$waited" -ge "$NETWORK_WAIT_TIMEOUT" ]; then
      log "::warn:: Không kết nối được GitHub sau ${NETWORK_WAIT_TIMEOUT}s. Sẽ chỉ khởi động lại version hiện tại (offline mode)."
      return 1
    fi
    sleep 5
    waited=$((waited + 5))
  done
  log "Đã kết nối GitHub."
  return 0
}

# Lấy head_sha của lần chạy CD thành công gần nhất trên 1 branch
latest_success_sha() {
  local workflow="$1" branch="$2"
  gh api "repos/${REPO}/actions/workflows/${workflow}/runs?branch=${branch}&status=success&event=push&per_page=1" \
    --jq '.workflow_runs[0].head_sha // empty' 2>/dev/null || true
}

docker_login_ghcr() {
  require_file "$GHCR_PAT_FILE"
  # Bỏ mọi khoảng trắng/xuống dòng thừa trong file token (dễ dính khi copy-paste)
  if ! tr -d '[:space:]' < "$GHCR_PAT_FILE" | docker login ghcr.io -u "$SERVER_USER" --password-stdin; then
    log "::warn:: docker login ghcr.io thất bại (token sai/hết hạn, hoặc mạng chưa sẵn sàng). Sẽ thử pull bằng cache local."
    return 1
  fi
  return 0
}

ensure_network() {
  docker network inspect "$NETWORK_NAME" >/dev/null 2>&1 && return 0
  log "Tạo docker network $NETWORK_NAME..."
  docker network create "$NETWORK_NAME" >/dev/null
}

start_tunnel() {
  if [ ! -f "$TUNNEL_DIR/$TUNNEL_COMPOSE_FILE" ]; then
    log "::error:: Không tìm thấy $TUNNEL_DIR/$TUNNEL_COMPOSE_FILE -> bỏ qua Cloudflare Tunnel (backend/staging có thể không truy cập được từ Internet)."
    notify "error" "startup-deploy: thiếu $TUNNEL_DIR/$TUNNEL_COMPOSE_FILE, bỏ qua Cloudflare Tunnel."
    return 1
  fi

  log "Khởi động Cloudflare Tunnel..."
  (cd "$TUNNEL_DIR" && docker compose -f "$TUNNEL_COMPOSE_FILE" up -d "$TUNNEL_COMPOSE_SERVICE") \
    || {
      log "::error:: Khởi động Cloudflare Tunnel thất bại."
      notify "error" "startup-deploy: Cloudflare Tunnel không khởi động được."
      return 1
    }
}

# Chạy "docker compose up -d" trong thư mục deploy, luôn kèm --no-build:
# image được build/pull trên CI rồi pull về server, KHÔNG build tại chỗ.
# $1 dir  $2 compose_file  $3... tham số thêm cho "up" (vd --pull always)
compose_up() {
  local dir="$1" compose_file="$2"
  shift 2
  (cd "$dir" && docker compose -f "$compose_file" up -d --no-build "$@")
}

# Đảm bảo image đã có mặt trong cache local, chưa có thì pull về.
ensure_image() {
  local ref="$1"
  docker image inspect "$ref" >/dev/null 2>&1 && return 0
  log "Image $ref chưa có trong cache local, đang pull..."
  docker pull "$ref"
}

# ---- Helpers đọc/ghi tag trong .env và file "stable tag" ----

read_current_tag() {
  local dir="$1" env_var="$2" line value
  if [ -f "$dir/.env" ]; then
    # Lấy dòng khai báo CUỐI CÙNG (nếu file bị ghi trùng nhiều dòng) rồi tách tag
    line=$(grep "^${env_var}=" "$dir/.env" 2>/dev/null | tail -n1)
    if [ -n "$line" ]; then
      value="${line#*=}"     # "TÊN_BIẾN=image:tag" -> "image:tag"
      echo "${value##*:}"    # "image:tag" -> "tag" (cắt ở dấu ":" CUỐI CÙNG)
      return 0
    fi
  fi
  echo ""
}

write_tag() {
  local dir="$1" env_var="$2" image="$3" tag="$4"
  [ -f "$dir/.env" ] || touch "$dir/.env"
  if grep -q "^${env_var}=" "$dir/.env"; then
    sed -i "s|^${env_var}=.*|${env_var}=${image}:${tag}|" "$dir/.env"
  else
    echo "${env_var}=${image}:${tag}" >> "$dir/.env"
  fi
}

read_stable_tag() {
  local dir="$1" f="${1}/${STABLE_TAG_SUFFIX}"
  [ -f "$f" ] && cat "$f" || echo ""
}

write_stable_tag() {
  local dir="$1" tag="$2"
  # Không ghi file .stable_tag rỗng: tag rỗng = "chưa có bản ổn định nào"
  [ -n "$tag" ] || return 0
  echo "$tag" > "${dir}/${STABLE_TAG_SUFFIX}"
}

# Kiểm tra 1 service có healthy không, poll tới khi healthy hoặc hết $timeout.
# Chỉ trả 0 khi thực sự thấy "healthy"/"ổn định đủ số lần"; mọi trạng thái khác
# (chưa chạy, starting, unhealthy thoáng qua...) đều tiếp tục chờ tới hết thời gian
# rồi mới trả 1 — tránh rollback vì 1 lần fail thoáng qua.
# $1 tên hiển thị  $2 thư mục  $3 file compose  $4 service name  $5 health_url(có thể rỗng)  $6 timeout(s)
wait_for_healthy() {
  local name="$1" dir="$2" compose_file="$3" service="$4" health_url="$5" timeout="$6"
  local waited=0 stable=0 cid status running restarting

  while [ "$waited" -lt "$timeout" ]; do
    cid=$(cd "$dir" && docker compose -f "$compose_file" ps -q "$service" 2>/dev/null || true)

    if [ -z "$cid" ]; then
      stable=0
    else
      status=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$cid" 2>/dev/null || echo "none")

      if [ "$status" = "healthy" ]; then
        log "[$name] Healthy (docker healthcheck)."
        return 0
      elif [ "$status" = "none" ]; then
        running=$(docker inspect --format='{{.State.Running}}' "$cid" 2>/dev/null || echo "false")
        restarting=$(docker inspect --format='{{.State.Restarting}}' "$cid" 2>/dev/null || echo "false")

        if [ "$running" = "true" ] && [ "$restarting" = "false" ]; then
          if [ -n "$health_url" ]; then
            if curl -fsS --max-time 5 "$health_url" >/dev/null 2>&1; then
              stable=$((stable + 1))
            else
              stable=0
            fi
          else
            stable=$((stable + 1))
          fi
          if [ "$stable" -ge "$HEALTH_STABLE_CHECKS" ]; then
            log "[$name] Healthy (container ổn định${health_url:+, health_url OK})."
            return 0
          fi
        else
          stable=0
        fi
      else
        # "starting" hoặc "unhealthy" theo docker healthcheck -> chưa kết luận, chờ tiếp
        stable=0
      fi
    fi

    sleep "$HEALTH_POLL_INTERVAL"
    waited=$((waited + HEALTH_POLL_INTERVAL))
  done

  log "::error:: [$name] Không healthy sau ${timeout}s."
  return 1
}

# Deploy 1 service với đầy đủ: ghi nhận bản ổn định trước khi deploy -> deploy ->
# health check theo timeout -> rollback về bản ổn định nếu fail -> notify ở các mốc quan trọng.
# $1 tên  $2 dir  $3 compose_file  $4 image  $5 env_var  $6 workflow  $7 branch
# $8 network_ok  $9 compose_service  $10 health_url  $11 timeout
deploy_service() {
  local name="$1" dir="$2" compose_file="$3" image="$4" env_var="$5"
  local workflow="$6" branch="$7" network_ok="$8" service="$9" health_url="${10}" timeout="${11}"

  if [ ! -d "$dir" ]; then
    log "::error:: [$name] Không tìm thấy thư mục $dir"
    notify "error" "$name: không tìm thấy thư mục $dir"
    return 1
  fi

  if [ ! -f "$dir/$compose_file" ]; then
    log "::error:: [$name] Không tìm thấy file compose $dir/$compose_file"
    notify "error" "$name: không tìm thấy file compose $dir/$compose_file"
    return 1
  fi

  # .env chứa các biến bắt buộc (DB_URL, JWT_SECRET...). Thiếu .env thì compose
  # chắc chắn fail -> dừng ngay, không chờ health check rồi rollback vô ích.
  if [ ! -f "$dir/.env" ]; then
    local example="" candidate
    for candidate in env.production.example env.ai-service.example env.example; do
      if [ -f "$dir/$candidate" ]; then
        example="$candidate"
        break
      fi
    done

    if [ -n "$example" ]; then
      log "::warn:: [$name] Chưa có $dir/.env -> tạo từ $example. KIỂM TRA LẠI các giá trị bắt buộc trong .env cho đúng server này."
      notify "warn" "$name: chưa có .env, đã tạo từ $example — cần kiểm tra lại giá trị."
      cp "$dir/$example" "$dir/.env"
    else
      log "::error:: [$name] Không tìm thấy $dir/.env (và không có file *example để tạo tạm). Chạy CD 1 lần hoặc tạo .env thủ công."
      notify "error" "$name: thiếu file .env trong $dir, không thể deploy."
      return 1
    fi
  fi

  local current_tag stable_tag target_sha changed
  current_tag=$(read_current_tag "$dir" "$env_var")
  stable_tag=$(read_stable_tag "$dir")

  # 1) Trước khi deploy: nếu bản hiện tại đang chạy VÀ đang healthy ngay bây giờ,
  #    ghi nhận nó làm "bản ổn định" (baseline để rollback về sau này).
  if [ -n "$current_tag" ]; then
    if wait_for_healthy "$name (pre-check)" "$dir" "$compose_file" "$service" "$health_url" "$PRECHECK_TIMEOUT"; then
      write_stable_tag "$dir" "$current_tag"
      stable_tag="$current_tag"
      log "[$name] Bản đang chạy ($current_tag) healthy -> ghi nhận làm bản ổn định."
    else
      log "[$name] Bản đang chạy ($current_tag) hiện không xác nhận được là healthy -> giữ nguyên bản ổn định đã ghi trước đó (${stable_tag:-<chưa có>})."
    fi
  fi

  # 2) Xác định version cần deploy
  target_sha=""
  if [ "$network_ok" = "true" ]; then
    target_sha=$(latest_success_sha "$workflow" "$branch")
  fi
  if [ -z "$target_sha" ]; then
    if [ -n "$current_tag" ]; then
      log "[$name] Không lấy được version mới nhất từ GitHub, giữ nguyên version hiện tại: $current_tag"
      target_sha="$current_tag"
    else
      log "::error:: [$name] Chưa từng deploy và không lấy được version từ GitHub. Bỏ qua."
      notify "error" "$name: chưa từng deploy và không lấy được version từ GitHub."
      return 1
    fi
  fi

  # 3) Deploy nếu có thay đổi, hoặc chỉ đảm bảo container đang chạy nếu không đổi
  changed="false"
  if [ "$target_sha" != "$current_tag" ]; then
    log "[$name] Có version mới: '${current_tag:-<chưa có>}' -> '$target_sha'. Đang pull & deploy..."
    if ! docker pull "${image}:${target_sha}"; then
      log "::error:: [$name] Pull image ${image}:${target_sha} thất bại, giữ nguyên version cũ."
      notify "error" "$name: pull image ${target_sha} thất bại, giữ nguyên bản $current_tag."
      # Chưa từng deploy + pull lỗi (vd mất mạng lúc boot lần đầu) -> không có gì để chạy
      if [ -z "$current_tag" ]; then
        log "::error:: [$name] Chưa từng deploy bản nào và cũng không pull được image -> không thể khởi động. Cần can thiệp thủ công."
        notify "error" "$name: chưa từng deploy và pull image thất bại, không thể khởi động."
        return 1
      fi
      compose_up "$dir" "$compose_file"
      target_sha="$current_tag"
    else
      write_tag "$dir" "$env_var" "$image" "$target_sha"
      compose_up "$dir" "$compose_file" --pull always
      changed="true"
      notify "info" "$name: đang deploy bản mới $target_sha (bản trước: ${current_tag:-<chưa có>})."
      log "[$name] Deploy xong -> $target_sha"
    fi
  else
    log "[$name] Đã ở version mới nhất ($target_sha). Đảm bảo container đang chạy..."
    # Image có thể đã bị xoá bởi "docker image prune" hoặc lần pull trước thất bại
    ensure_image "${image}:${target_sha}" \
      || log "::warn:: [$name] Không có image ${image}:${target_sha} trong cache local."
    compose_up "$dir" "$compose_file"
  fi

  # 4) Health check sau deploy trong $timeout giây
  if wait_for_healthy "$name" "$dir" "$compose_file" "$service" "$health_url" "$timeout"; then
    write_stable_tag "$dir" "$target_sha"
    [ "$changed" = "true" ] && notify "info" "$name: bản $target_sha healthy, đã cập nhật làm bản ổn định."
    log "[$name] Healthy. Bản ổn định hiện tại: $target_sha"
    return 0
  fi

  # 5) Unhealthy sau khi hết thời gian chờ -> xét rollback
  log "::error:: [$name] Unhealthy sau ${timeout}s kể từ khi deploy $target_sha."
  notify "warn" "$name: KHÔNG healthy sau ${timeout}s với bản $target_sha, đang kiểm tra rollback..."

  if [ -z "$stable_tag" ]; then
    log "::error:: [$name] Không có bản ổn định nào được ghi nhận trước đó -> GIỮ NGUYÊN bản hiện tại ($target_sha), KHÔNG rollback. Cần can thiệp thủ công."
    notify "error" "$name: KHÔNG CÓ bản ổn định để rollback! Đang giữ nguyên bản $target_sha (có thể đang lỗi). Cần kiểm tra thủ công NGAY."
    return 1
  fi

  if [ "$stable_tag" = "$target_sha" ]; then
    log "::error:: [$name] Bản 'ổn định' ghi nhận trùng với bản đang lỗi ($target_sha) -> rollback vô nghĩa. Cần can thiệp thủ công."
    notify "error" "$name: Bản ổn định đã ghi nhận trùng với bản đang lỗi ($target_sha), không thể rollback. Cần kiểm tra thủ công NGAY."
    return 1
  fi

  log "::warn:: [$name] Rollback về bản ổn định: $stable_tag"
  write_tag "$dir" "$env_var" "$image" "$stable_tag"
  ensure_image "${image}:${stable_tag}" \
    || log "::warn:: [$name] Không có sẵn image bản ổn định ${image}:${stable_tag} (pull thất bại), thử dùng cache nếu còn."
  compose_up "$dir" "$compose_file"

  if wait_for_healthy "$name" "$dir" "$compose_file" "$service" "$health_url" "$timeout"; then
    log "[$name] Rollback thành công, service healthy trở lại ở bản $stable_tag."
    notify "warn" "$name: Đã ROLLBACK về bản $stable_tag sau khi bản $target_sha unhealthy. Service đã healthy trở lại."
    return 0
  else
    log "::error:: [$name] Rollback xong nhưng VẪN unhealthy -> cần can thiệp thủ công ngay."
    notify "error" "$name: NGUY HIỂM — rollback về $stable_tag xong nhưng vẫn unhealthy! Cần can thiệp thủ công NGAY."
    return 1
  fi
}

############################################
# MAIN
############################################
mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true
log "=== Bắt đầu startup-deploy ==="

require_cmd docker
require_cmd curl
require_cmd gh
# jq chỉ cần cho notify dạng discord/webhook (escape JSON)
case "$NOTIFY_METHOD" in
  discord|webhook) require_cmd jq ;;
esac
check_notify_config

require_file "$GH_TOKEN_FILE"
# Xuất biến ngay khi gán, và bỏ mọi khoảng trắng/xuống dòng thừa trong file token
export GH_TOKEN
GH_TOKEN=$(tr -d '[:space:]' < "$GH_TOKEN_FILE")

EXIT_CODE=0

NETWORK_OK=true
wait_for_network || NETWORK_OK=false

docker_login_ghcr || true
ensure_network || {
  log "::warn:: Không có docker network $NETWORK_NAME — các service dùng network này (tunnel/backend/ai-service) có thể fail."
  notify "warn" "startup-deploy: không tạo được network $NETWORK_NAME."
  EXIT_CODE=1
}
start_tunnel || EXIT_CODE=1

# 1. AI service trước (tunnel không có version để pull/rollback nên chỉ up -d ở trên)
if ! deploy_service "AI Service" "$AI_SERVICE_DIR" "docker-compose.ai-service.yml" \
  "$AI_SERVICE_IMAGE" "AI_SERVICE_IMAGE" "cd-ai-service.yml" "$AI_SERVICE_BRANCH" "$NETWORK_OK" \
  "$AI_SERVICE_COMPOSE_SERVICE" "$AI_SERVICE_HEALTH_URL" "$HEALTH_CHECK_TIMEOUT"; then
  log "::warn:: AI Service kết thúc không healthy (dù đã thử rollback nếu có thể). Backend vẫn sẽ được thử deploy nhưng có thể lỗi do phụ thuộc AI Service."
  EXIT_CODE=1
fi

# 2. Backend production (tuỳ chọn)
if [ "$ENABLE_PRODUCTION" = "true" ]; then
  if ! deploy_service "Backend (production)" "$BACKEND_PROD_DIR" "docker-compose.prod.yml" \
    "$BACKEND_IMAGE" "BACKEND_IMAGE" "cd-backend.yml" "main" "$NETWORK_OK" \
    "$BACKEND_PROD_COMPOSE_SERVICE" "$BACKEND_HEALTH_URL" "$HEALTH_CHECK_TIMEOUT"; then
    EXIT_CODE=1
  fi
fi

# 3. Backend staging (tuỳ chọn)
if [ "$ENABLE_STAGING" = "true" ]; then
  if ! deploy_service "Backend (staging)" "$BACKEND_STAGING_DIR" "docker-compose.staging.yml" \
    "$BACKEND_IMAGE" "BACKEND_IMAGE" "cd-backend-development.yml" "staging" "$NETWORK_OK" \
    "$BACKEND_STAGING_COMPOSE_SERVICE" "$BACKEND_STAGING_HEALTH_URL" "$HEALTH_CHECK_TIMEOUT"; then
    EXIT_CODE=1
  fi
fi

docker image prune -f >/dev/null 2>&1 || true

if [ "$EXIT_CODE" -eq 0 ]; then
  log "=== Hoàn tất startup-deploy (tất cả service đã healthy) ==="
else
  log "::error:: === Hoàn tất startup-deploy NHƯNG có service không healthy — xem log/notify ở trên để biết chi tiết ==="
fi
exit "$EXIT_CODE"
