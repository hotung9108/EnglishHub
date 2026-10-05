# EnglishHub - Comprehensive Test Suite (dev & staging)

## Overview
Centralized test suite covering black-box, white-box, API, E2E, Selenium UI, and performance. Supports TEST_ENV=dev|staging.

## Quick start
- npm run test:env:check
- TEST_ENV=dev npm run selenium:dev (or scripts/run-selenium-dev.bat)
- TEST_ENV=staging npm run selenium:staging

## Structure
- config/: env configs
- common/: shared utils/constants
- black-box/: functional & API black-box
- white-box/: structure-based specs
- selenium/: POM-based UI automation
- api/: REST API tests
- e2e/: cross-service
- performance/: load scenarios
- fixtures/: test data
- docs/: test plan/matrix/guide
- scripts/: runners
