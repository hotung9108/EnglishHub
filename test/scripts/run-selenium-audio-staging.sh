#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../selenium" || exit 1
# Current Speaking recording and Listening playback cases.
node run.js DO_007 DO_011
