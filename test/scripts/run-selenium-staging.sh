#!/bin/sh
export TEST_ENV=staging
cd "$(dirname "$0")/../selenium" || exit 1
npm test
