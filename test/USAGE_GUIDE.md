# EnglishHub Test Suite - Complete Usage Guide

## 1. Overview
Comprehensive testing for EnglishHub supporting dev and staging environments. Covers Black-box, White-box, API, E2E, Selenium UI, and Performance testing.

## 2. Prerequisites
- Node.js 20+ and npm
- Services running for target environment
  - Dev: Frontend(5173), Backend(8080), AI(8000), PostgreSQL, MinIO (via docker-compose.dev.yml)
  - Staging: Accessible staging URLs

## 3. Environment Configuration
Set TEST_ENV=dev or TEST_ENV=staging. Config files in test/config/.

## 4. Running Tests
### Selenium UI (Page Object Model)
`ash
# Dev (headed by default)
TEST_ENV=dev npm run selenium:dev
# Windows
.\test\scripts\run-selenium-dev.bat
`

### Check environment
`ash
cd test && npm run test:env:check
`

## 5. Test Organization
See README.md and STRUCTURE_SUMMARY.md for details.
