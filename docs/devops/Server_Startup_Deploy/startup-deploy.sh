#!/usr/bin/env bash
set -euo pipefail

############################################
# CONFIG - sửa các giá trị dưới đây cho đúng với server/repo của bạn
############################################
REPO="hotung9108/EnglishHub"        # owner/repo trên GitHub, vd: hotung9108/english-hub
SERVER_USER="pmtuan"          # user chạy docker trên server (vd: hotung9108)

GH_TOKEN_FILE="/home/${SERVER_USER}/.secrets/gh_token"     # PAT quyền "Actions: Read-only" trên repo
GHCR_PAT_FILE="/home/${SERVER_USER}/.secrets/ghcr_pat"     # PAT quyền "read:packages" để pull GHCR

LOG_FILE="/var/log/englishhub-startup.log"

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
# (đặt false nếu server không chạy backend production, hoặc muốn tự start nó thủ công)
ENABLE_PRODUCTION=true

# Có deploy backend staging khi khởi động server không (true/false)
ENABLE_STAGING=true

# Thời gian tối đa chờ mạng / GitHub API sẵn sàng khi mới boot (giây)
NETWORK_WAIT_TIMEOUT=120
# Thời gian tối đa chờ AI service healthy trước khi start backend (giây)
AI_HEALTH_TIMEOUT=180
############################################

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

require_file() {
  if [ ! -f "$1" ]; then
    log "::error:: Thiếu file $1. Xem hướng dẫn trong startup-deploy.md để tạo."
    exit 1
  fi
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
# $1 = tên file workflow CD (vd cd-ai-service.yml)
# $2 = branch (main / staging)
latest_success_sha() {
  local workflow="$1" branch="$2"
  gh api "repos/${REPO}/actions/workflows/${workflow}/runs?branch=${branch}&status=success&event=push&per_page=1" \
    --jq '.workflow_runs[0].head_sha // empty' 2>/dev/null || true
}

docker_login_ghcr() {
  require_file "$GHCR_PAT_FILE"
  cat "$GHCR_PAT_FILE" | docker login ghcr.io -u "$SERVER_USER" --password-stdin
}

ensure_network() {
  docker network inspect "$NETWORK_NAME" >/dev/null 2>&1 \
    || docker network create "$NETWORK_NAME" >/dev/null
}

start_tunnel() {
  log "Khởi động Cloudflare Tunnel..."
  (cd "$TUNNEL_DIR" && docker compose -f docker-compose.tunnel.yml up -d tunnel)
}

# Deploy 1 service nếu có version mới hơn version đang ghi trong .env,
# nếu không thì chỉ đảm bảo container đang chạy.
# $1 = tên hiển thị (log)       $2 = thư mục chứa docker-compose + .env
# $3 = tên file docker-compose  $4 = image name (không kèm tag)
# $5 = tên biến trong .env      $6 = workflow CD tương ứng
# $7 = branch                   $8 = network_ok (true/false)
deploy_if_outdated() {
  local name="$1" dir="$2" compose_file="$3" image="$4" env_var="$5" workflow="$6" branch="$7" network_ok="$8"

  cd "$dir"
  [ -f .env ] || touch .env

  local current_tag=""
  if grep -q "^${env_var}=" .env 2>/dev/null; then
    current_tag=$(grep "^${env_var}=" .env | cut -d= -f2 | cut -d: -f2)
  fi

  local target_sha=""
  if [ "$network_ok" = "true" ]; then
    target_sha=$(latest_success_sha "$workflow" "$branch")
  fi

  if [ -z "$target_sha" ]; then
    if [ -n "$current_tag" ]; then
      log "[$name] Không lấy được version mới nhất từ GitHub, giữ nguyên version hiện tại: $current_tag"
      target_sha="$current_tag"
    else
      log "::error:: [$name] Chưa từng deploy và không lấy được version từ GitHub. Bỏ qua."
      return 1
    fi
  fi

  if [ "$target_sha" = "$current_tag" ]; then
    log "[$name] Đã ở version mới nhất ($target_sha). Đảm bảo container đang chạy..."
    docker compose -f "$compose_file" up -d
    return 0
  fi

  log "[$name] Có version mới: '${current_tag:-<chưa có>}' -> '$target_sha'. Đang pull & deploy..."
  if ! docker pull "${image}:${target_sha}"; then
    log "::error:: [$name] Pull image ${image}:${target_sha} thất bại, giữ nguyên version cũ."
    docker compose -f "$compose_file" up -d
    return 1
  fi

  if grep -q "^${env_var}=" .env; then
    sed -i "s|^${env_var}=.*|${env_var}=${image}:${target_sha}|" .env
  else
    echo "${env_var}=${image}:${target_sha}" >> .env
  fi

  docker compose -f "$compose_file" up -d --pull always
  log "[$name] Deploy xong -> $target_sha"
}

wait_ai_service_healthy() {
  log "Chờ AI service healthy..."
  local waited=0 cid status running
  while [ "$waited" -lt "$AI_HEALTH_TIMEOUT" ]; do
    cid=$(cd "$AI_SERVICE_DIR" && docker compose -f docker-compose.ai-service.yml ps -q ai-service 2>/dev/null || true)
    if [ -n "$cid" ]; then
      status=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' "$cid" 2>/dev/null || echo "unknown")
      if [ "$status" = "healthy" ]; then
        log "AI service healthy."
        return 0
      fi
      if [ "$status" = "no-healthcheck" ]; then
        running=$(docker inspect --format='{{.State.Running}}' "$cid" 2>/dev/null || echo "false")
        if [ "$running" = "true" ]; then
          log "AI service đang chạy (không có healthcheck trong compose, coi như sẵn sàng)."
          return 0
        fi
      fi
    fi
    sleep 5
    waited=$((waited + 5))
  done
  log "::warn:: AI service chưa healthy sau ${AI_HEALTH_TIMEOUT}s, vẫn tiếp tục deploy backend."
}

############################################
# MAIN
############################################
mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true
log "=== Bắt đầu startup-deploy ==="

require_file "$GH_TOKEN_FILE"
export GH_TOKEN
GH_TOKEN=$(cat "$GH_TOKEN_FILE")

NETWORK_OK=true
wait_for_network || NETWORK_OK=false

docker_login_ghcr
ensure_network
start_tunnel

# 1. AI service trước
deploy_if_outdated "AI Service" "$AI_SERVICE_DIR" "docker-compose.ai-service.yml" \
  "$AI_SERVICE_IMAGE" "AI_SERVICE_IMAGE" "cd-ai-service.yml" "$AI_SERVICE_BRANCH" "$NETWORK_OK"

wait_ai_service_healthy

# 2. Backend production (tuỳ chọn)
if [ "$ENABLE_PRODUCTION" = "true" ]; then
  deploy_if_outdated "Backend (production)" "$BACKEND_PROD_DIR" "docker-compose.prod.yml" \
    "$BACKEND_IMAGE" "BACKEND_IMAGE" "cd-backend.yml" "main" "$NETWORK_OK"
fi

# 3. Backend staging (tuỳ chọn)
if [ "$ENABLE_STAGING" = "true" ]; then
  deploy_if_outdated "Backend (staging)" "$BACKEND_STAGING_DIR" "docker-compose.staging.yml" \
    "$BACKEND_IMAGE" "BACKEND_IMAGE" "cd-backend-development.yml" "staging" "$NETWORK_OK"
fi

docker image prune -f >/dev/null 2>&1 || true

log "=== Hoàn tất startup-deploy ==="
