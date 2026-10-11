#!/bin/sh
export TEST_ENV=dev
export SELENIUM_BASE_URL=http://localhost:5173
cd "$(dirname "$0")/../selenium" || exit 1
npm test
