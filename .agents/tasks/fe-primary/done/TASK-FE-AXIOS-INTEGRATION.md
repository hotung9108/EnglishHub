---
id: TASK-FE-AXIOS-INTEGRATION
title: "Axios Integration, Interceptors, Base Services, and Base Hooks with SOLID Architecture"
role: fe-primary
assignee: Maloque18705
status: "Done"
created_at: 2026-09-28T13:30:00+07:00
updated_at: 2026-09-28T14:02:00+07:00
completed_at: 2026-09-28T14:02:00+07:00
priority: P0
tags: [frontend, axios, interceptor, base-service, base-hook, solid, environment-config]
---

# TASK-FE-AXIOS-INTEGRATION: Axios Integration, Interceptors, Base Services, and Base Hooks with SOLID Architecture

## Objective
Integrate Axios into EnglishHub frontend following `.agents/rules/frontend-environment-config-rules.md` and SOLID principles:
- Centralized, immutable environment configuration (`src/config/`).
- Shared Axios client with request & response interceptors (Bearer auth, 401 refresh token queue/mutex, error normalization).
- Token storage abstraction (`ITokenStorage` / `LocalStorageTokenStorage`).
- Base classes and interfaces for services (`BaseApiService`, `ICrudService`, `IHttpClient`).
- Base custom hooks (`useAsync`, `useQuery`, `useMutation`).
- Concrete domain services and hooks demonstrating end-to-end usage.
- Comprehensive unit tests and DoD verification.

## Implementation Details
1. **Environment Configuration (`src/config/`)**:
   - Built `environment.ts`, `development.ts`, `staging.ts`, `production.ts`, and `types.ts`.
   - Single Source of Truth imported via `@/config/environment`.
   - Immutable (`Object.freeze(...)`, `as const`), strictly typed, zero business logic, zero secrets.
2. **Path Alias (`@/*`)**:
   - Configured `vite.config.ts` and `tsconfig.app.json` with `@` pointing to `src/`.
3. **Core API & Interceptors (`src/api/core/`)**:
   - `client.ts`: Shared singleton `apiClient` and adapter `httpClient` implementing `IHttpClient`.
   - `interceptors.ts`:
     - Request interceptor: attaches Bearer token from `ITokenStorage`, sets default JSON headers, supports `skipAuth`.
     - Response interceptor: handles 401 Unauthorized via `TokenRefreshManager` with concurrency mutex and queue, retries failed requests upon refresh, triggers `auth:expired` event upon token revocation/expiry, prevents infinite loops on auth endpoints.
     - Error mapping: maps backend responses (`{ error: string }` / `{ message: string }`) into typed errors (`UnauthorizedError`, `ForbiddenError`, `ValidationError`, `NotFoundError`, `ConflictError`, `NetworkError`, `TimeoutError`).
   - `token-storage.ts`: `ITokenStorage` interface with `LocalStorageTokenStorage` and `MemoryTokenStorage` implementations.
   - `base-api.service.ts`: `BaseApiService<T, TCreate, TUpdate, ID>` implementing `ICrudService` adhering to SOLID.
4. **Interfaces (`src/api/interfaces/`)**:
   - `http.interface.ts`: Granular interfaces (`IHttpClient`, `IReadService`, `ICreateService`, `IUpdateService`, `IPatchService`, `IDeleteService`, `ICrudService`).
   - `token.interface.ts`: `ITokenStorage`.
5. **Concrete Domain Services (`src/api/services/`)**:
   - `auth.service.ts`: `login`, `refresh`, `logout`, session helpers.
   - `user.service.ts`: `getMyProfile`, `updateMyProfile`, `changePassword`, admin user management extending `BaseApiService`.
   - `class.service.ts`: class management extending `BaseApiService` with `getMembers`, `addMember`, `removeMember`.
6. **Base Custom Hooks (`src/hooks/core/`)**:
   - `useAsync`: Handles execution, abort controller, state (`isLoading`, `isError`, `isSuccess`, `data`, `error`), reset, cancel.
   - `useQuery`: Auto-fetch on mount/param change, refetch, data shaping (`transform`), lifecycle callbacks (`onSuccess`, `onError`).
   - `useMutation`: Imperative mutation execution (`mutate`, `mutateAsync`), state, reset, callbacks.
   - `useCurrentUser`, `useClasses`: Concrete hooks demonstrating service consumption.
7. **Verification & DoD**:
   - `10/10` unit tests passing (`npm test`).
   - `0` lint errors (`npm run lint`).
   - `0` typescript compilation errors (`tsc -b && vite build`).
   - QA test guide created at `production_artifacts/fe_to_tester/FE_AXIOS_BASE_SERVICES_TEST_GUIDE.md`.
