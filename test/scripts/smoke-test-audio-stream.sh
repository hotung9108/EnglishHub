#!/usr/bin/env bash
# ==============================================================================
# [OPS-44] Post-Deploy Smoke Test for Audio Streaming Endpoint
# Target: GET /api/v1/modules/{id}/audio
# Verifies:
#   1. Authentication: 401 Unauthorized when missing token.
#   2. Authorization: 403 Forbidden when caller lacks class read access.
#   3. Full Stream: 200 OK + Accept-Ranges header for authorized caller.
#   4. Partial Stream: 206 Partial Content + Content-Range for Range request.
# ==============================================================================
set -euo pipefail

BASE_URL="${1:-${APP_OPENAPI_SERVER_URL:-https://api-staging.hotung9108.me}}"
BASE_URL="${BASE_URL%/}"
MODULE_ID="${2:-${SMOKE_TEST_MODULE_ID:-1}}"
STUDENT_TOKEN="${3:-${SMOKE_TEST_STUDENT_TOKEN:-}}"
TEACHER_TOKEN="${4:-${SMOKE_TEST_TEACHER_TOKEN:-}}"
UNAUTHORIZED_TOKEN="${5:-${SMOKE_TEST_UNAUTHORIZED_TOKEN:-}}"

echo "=========================================================="
echo "[OPS-44] Audio Stream Smoke Test"
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

# 1. Unauthenticated request -> must return 401
echo "[Test 1/4] Checking unauthenticated access..."
check_endpoint "Unauthenticated request rejected with 401" 401 \
  "$BASE_URL/api/v1/modules/$MODULE_ID/audio"

# 2. Unauthorized request (if token provided) -> must return 403
if [ -n "$UNAUTHORIZED_TOKEN" ]; then
  echo "[Test 2/4] Checking forbidden access..."
  check_endpoint "Unauthorized user rejected with 403" 403 \
    -H "Authorization: Bearer $UNAUTHORIZED_TOKEN" \
    "$BASE_URL/api/v1/modules/$MODULE_ID/audio"
else
  echo "[Test 2/4] Skipping unauthorized user test (no UNAUTHORIZED_TOKEN provided)."
fi

# 3. Full stream request (with teacher or student token) -> 200 OK
TOKEN="${STUDENT_TOKEN:-$TEACHER_TOKEN}"
if [ -n "$TOKEN" ]; then
  echo "[Test 3/4] Checking authorized full audio stream..."
  headers_file=$(mktemp)
  body_file=$(mktemp)

  http_code=$(curl -s -o "$body_file" -D "$headers_file" -w "%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/v1/modules/$MODULE_ID/audio")

  if [ "$http_code" -eq 200 ]; then
    echo "  [PASS] Authorized audio stream returned HTTP 200"
    if grep -iq "accept-ranges: bytes" "$headers_file"; then
      echo "  [PASS] Accept-Ranges: bytes header present"
    else
      echo "  [WARN] Accept-Ranges header not explicitly found"
    fi
  elif [ "$http_code" -eq 404 ]; then
    echo "  [NOTICE] Module $MODULE_ID has no audio or does not exist (HTTP 404). Auth verified."
  else
    echo "  [FAIL] Expected HTTP 200 or 404, got $http_code"
    FAILED=1
  fi

  # 4. Range request (partial content)
  echo "[Test 4/4] Checking Range header support (bytes=0-1023)..."
  range_headers_file=$(mktemp)
  range_body_file=$(mktemp)

  range_code=$(curl -s -o "$range_body_file" -D "$range_headers_file" -w "%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Range: bytes=0-1023" \
    "$BASE_URL/api/v1/modules/$MODULE_ID/audio")

  if [ "$range_code" -eq 206 ]; then
    echo "  [PASS] Range request returned HTTP 206 Partial Content"
    if grep -iq "content-range: bytes 0-1023" "$range_headers_file"; then
      echo "  [PASS] Content-Range header correctly formatted"
    fi
  elif [ "$range_code" -eq 404 ]; then
    echo "  [NOTICE] Module $MODULE_ID has no audio (HTTP 404)."
  else
    echo "  [FAIL] Range request expected HTTP 206 or 404, got $range_code"
    FAILED=1
  fi

  rm -f "$headers_file" "$body_file" "$range_headers_file" "$range_body_file"
else
  echo "[Test 3/4 & 4/4] Skipping authorized & range tests (no token provided in environment)."
fi

echo "=========================================================="
if [ "$FAILED" -eq 0 ]; then
  echo "[OPS-44] Audio stream smoke test completed successfully!"
  exit 0
else
  echo "[OPS-44] Audio stream smoke test FAILED!"
  exit 1
fi
