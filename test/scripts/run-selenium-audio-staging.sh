#!/usr/bin/env bash
# ==============================================================================
# [QA-36] Staging Selenium E2E Test for Speaking Recording & Listening Playback
# ==============================================================================
set -euo pipefail

export TEST_ENV=staging
cd "$(dirname "$0")/../selenium" || exit 1

echo "=========================================================="
echo "[QA-36] Running Selenium Staging Audio Pipeline E2E..."
echo "  - Case QA30-015: Listening playback & short-answer submission"
echo "  - Case QA30-016: Speaking real microphone recording & upload verification"
echo "=========================================================="

npm run test:student:audio
echo "[QA-36] Audio pipeline E2E tests completed successfully!"
