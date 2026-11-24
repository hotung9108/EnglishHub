#!/usr/bin/env bash
# ==============================================================================
# [OPS-46] Post-Deploy Smoke Test for Audio Download & Presigned Streaming
# Target: GET /api/v1/modules/{id}/audio-download-url
# Verifies:
#   1. Authentication: 401 Unauthorized when missing token (or 403 on restricted proxy).
#   2. Authorization: 403 Forbidden when caller lacks class/module read access.
#   3. Presigned URL Retrieval: 200 OK + JSON downloadUrl for authorized caller (or 404 if no audio).
#   4. Storage Streaming: 200 OK or 206 Partial Content when streaming from presigned URL.
# ==============================================================================
set -euo pipefail

BASE_URL="${1:-${APP_OPENAPI_SERVER_URL:-https://api-staging.hotung9108.me}}"
BASE_URL="${BASE_URL%/}"
MODULE_ID="${2:-${SMOKE_TEST_MODULE_ID:-1}}"
STUDENT_TOKEN="${3:-${SMOKE_TEST_STUDENT_TOKEN:-}}"
TEACHER_TOKEN="${4:-${SMOKE_TEST_TEACHER_TOKEN:-}}"
UNAUTHORIZED_TOKEN="${5:-${SMOKE_TEST_UNAUTHORIZED_TOKEN:-}}"

echo "=========================================================="
echo "[OPS-46] Audio Smoke Test (Presigned Architecture)"
echo "Target Base URL: $BASE_URL"
echo "Module ID:       $MODULE_ID"
echo "=========================================================="

FAILED=0

# Helper function to check curl status code and headers
check_endpoint() {
  local desc="$1"
  local expected_status="$2"
  shift 2
  local headers_file
  headers_file=$(mktemp)
  local body_file
  body_file=$(mktemp)

  local http_code
  http_code=$(curl -s -o "$body_file" -D "$headers_file" -w "%{http_code}" "$@")

  if [ "$http_code" -eq "$expected_status" ]; then
    echo "  [PASS] $desc (HTTP $http_code)"
  else
    echo "  [FAIL] $desc - Expected HTTP $expected_status, got $http_code"
    cat "$headers_file"
    FAILED=1
  fi

  rm -f "$headers_file" "$body_file"
}

# 1. Unauthenticated request -> must return 401 Unauthorized
echo "[Test 1/4] Checking unauthenticated access..."
headers_file=$(mktemp)
body_file=$(mktemp)
http_code=$(curl -s -o "$body_file" -D "$headers_file" -w "%{http_code}" \
  "$BASE_URL/api/v1/modules/$MODULE_ID/audio-download-url")

if [ "$http_code" -eq 401 ]; then
  echo "  [PASS] Unauthenticated request rejected with HTTP 401 Unauthorized"
elif [ "$http_code" -eq 403 ]; then
  echo "  [PASS] Unauthenticated request rejected with HTTP 403 Forbidden (Firewall/Proxy policy)"
else
  echo "  [FAIL] Unauthenticated request expected HTTP 401, got $http_code"
  cat "$headers_file"
  FAILED=1
fi
rm -f "$headers_file" "$body_file"

# 2. Unauthorized request (if token provided) -> must return 403 Forbidden
if [ -n "$UNAUTHORIZED_TOKEN" ]; then
  echo "[Test 2/4] Checking forbidden access..."
  check_endpoint "Unauthorized user rejected with 403" 403 \
    -H "Authorization: Bearer $UNAUTHORIZED_TOKEN" \
    "$BASE_URL/api/v1/modules/$MODULE_ID/audio-download-url"
else
  echo "[Test 2/4] Skipping unauthorized user test (no UNAUTHORIZED_TOKEN provided)."
fi

# 3. Authorized request for download URL -> 200 OK or 404 Not Found
DOWNLOAD_URL=""
TOKEN="${STUDENT_TOKEN:-$TEACHER_TOKEN}"
if [ -n "$TOKEN" ]; then
  echo "[Test 3/4] Checking authorized audio download URL retrieval..."
  headers_file=$(mktemp)
  body_file=$(mktemp)

  http_code=$(curl -s -o "$body_file" -D "$headers_file" -w "%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/v1/modules/$MODULE_ID/audio-download-url")

  if [ "$http_code" -eq 200 ]; then
    echo "  [PASS] Authorized audio download URL returned HTTP 200"
    DOWNLOAD_URL=$(grep -o '"downloadUrl":"[^"]*' "$body_file" | cut -d'"' -f4 || true)
    if [ -n "$DOWNLOAD_URL" ]; then
      echo "  [PASS] Successfully retrieved presigned downloadUrl"
    else
      echo "  [WARN] Could not parse downloadUrl field from response JSON"
    fi
  elif [ "$http_code" -eq 404 ]; then
    echo "  [NOTICE] Module $MODULE_ID has no audio or does not exist (HTTP 404). Auth verified."
  else
    echo "  [FAIL] Expected HTTP 200 or 404, got $http_code"
    cat "$headers_file"
    FAILED=1
  fi

  # 4. Storage direct streaming & Range request test
  echo "[Test 4/4] Checking Storage streaming via Presigned URL..."
  if [ -n "$DOWNLOAD_URL" ]; then
    range_headers_file=$(mktemp)
    range_body_file=$(mktemp)

    range_code=$(curl -s -o "$range_body_file" -D "$range_headers_file" -w "%{http_code}" \
      -H "Range: bytes=0-1023" \
      "$DOWNLOAD_URL")

    if [ "$range_code" -eq 206 ]; then
      echo "  [PASS] Storage streaming returned HTTP 206 Partial Content"
      if grep -iq "content-range" "$range_headers_file"; then
        echo "  [PASS] Content-Range header correctly formatted"
      fi
    elif [ "$range_code" -eq 200 ]; then
      echo "  [PASS] Storage returned HTTP 200 OK (Full stream)"
    else
      echo "  [FAIL] Storage streaming expected HTTP 206 or 200, got $range_code"
      FAILED=1
    fi
    rm -f "$range_headers_file" "$range_body_file"
  else
    echo "  [NOTICE] No audio downloadUrl available to test streaming (Module $MODULE_ID has no audio or returned 404)."
  fi

  rm -f "$headers_file" "$body_file"
else
  echo "[Test 3/4 & 4/4] Skipping authorized & storage streaming tests (no token provided in environment)."
fi

echo "=========================================================="
if [ "$FAILED" -eq 0 ]; then
  echo "[OPS-46] Audio smoke test completed successfully!"
  exit 0
else
  echo "[OPS-46] Audio smoke test FAILED!"
  exit 1
fi
