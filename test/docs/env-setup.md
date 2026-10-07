# Test Environment Setup - dev & staging

## Dev
Services expected: Frontend http://localhost:5173, Backend http://localhost:8080/api/v1, AI http://localhost:8000

## Staging
Update test/config/staging.json with actual URLs/creds.

## Run
- TEST_ENV=dev npm run selenium:dev
- TEST_ENV=staging npm run selenium:staging
