id: TASK-FE-27-USER-SERVICE-HOOK
title: "[FE-27] Tạo service & hook cho API User"
role: fe-primary
assignee: doanthaison2706
status: "Done"
created_at: 2026-09-28T20:27:06+07:00
updated_at: 2026-09-28T20:27:06+07:00
completed_at: 2026-09-28T20:27:06+07:00
priority: P0
tags: [frontend, user-api, service, hook, api-client]
---

# TASK-FE-27-USER-SERVICE-HOOK: [FE-27] Tạo service & hook cho API User

## 1. Context & Objective
Create a typed frontend service and hook for the backend User API, following the shared `httpClient`/`apiClient` pattern and existing frontend structure.

Scope:
- Own profile: `GET` and `PUT /users/me`, and `PATCH /users/me/password`.
- Admin user management: list/create users, update/delete a user, and update user status under `/admin/users`.
- `useUsers`: paginated list and filters, loading/error/refetch state, and create/update/delete actions.

## 2. Definition of Done (DoD) Fulfillment
- [x] **Typed UserService**: Implements the profile and admin user API operations in `frontend/src/api/services/user.service.ts` through the shared HTTP client.
- [x] **User list hook**: `frontend/src/hooks/useUsers.ts` manages filters, pagination, request cancellation/stale results, mutations, and refetch after changes.
- [x] **Query utilities and service coverage**: List parameter and pagination utilities are in `frontend/src/hooks/useUsers.utils.ts`; service routes and list query behavior are covered in `frontend/src/api/__tests__/hooks-and-services.test.ts`.
- [x] **Validation & Quality**: The frontend test suite, lint, and build passed during task verification.
