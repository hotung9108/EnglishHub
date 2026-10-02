id: TASK-FE-32-GRADING-SERVICE-HOOK
title: "[FE-32] Tạo service & hook cho API Grading"
role: fe-primary
assignee: doanthaison2706
status: "Done"
created_at: 2026-10-01T20:27:06+07:00
updated_at: 2026-10-01T20:27:06+07:00
completed_at: 2026-10-01T20:27:06+07:00
priority: P0
tags: [frontend, grading-api, service, hook, api-client]
---

# TASK-FE-32-GRADING-SERVICE-HOOK: [FE-32] Tạo service & hook cho API Grading

## 1. Context & Objective
Create a typed frontend grading service and hooks for the backend Grading API (#48–#57), using the shared `httpClient`/`apiClient` pattern. Scope is service and hooks only; page/UI integration is excluded.

## 2. Definition of Done (DoD) Fulfillment
- [x] **Grading service**: Implements the ten Grading API operations (#48–#57) in `frontend/src/api/services/grading.service.ts`, with request/response types and service tests.
- [x] **Teacher hook**: `useGrading` loads a grading by submission module, submits a grade and refetches, and exposes AI analysis without polling.
- [x] **Student-safe result**: `getStudentGradingResult` checks for `COMPLETED` before loading details and returns only the seven approved result fields; `useStudentGradingResult` exposes that result without raw grading details.
- [x] **Validation & Quality**: `npm test` passed (37 tests); lint and build passed.
- [x] **Real API verification**: T20–T24 passed. Teacher 9 graded grading 5; the API reported `COMPLETED`, score 16, and a change log. Student 23 received the matching score and feedback through the safe result helper, with only the allowlisted fields.
