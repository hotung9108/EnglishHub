# FE-AXIOS-INTEGRATION: Testing & Architecture Guide

## Overview
This document details the architectural integration of **Axios**, request/response **interceptors**, **Base Services**, and **Base Custom Hooks** for EnglishHub frontend adhering to:
- `.agents/rules/frontend-environment-config-rules.md`
- **SOLID Principles** (SRP, OCP, LSP, ISP, DIP)
- **React 19** and **TypeScript Strict Mode**

---

## 1. Directory Structure

```text
frontend/src/
├── config/
│   ├── environment.ts        # Immutable application configuration (Single Source of Truth)
│   ├── development.ts        # Development environment config
│   ├── staging.ts            # Staging environment config
│   ├── production.ts         # Production environment config
│   ├── types.ts              # EnvironmentConfig interfaces
│   └── index.ts              # Public config barrel
│
├── api/
│   ├── core/
│   │   ├── client.ts         # Axios singleton `apiClient` & `httpClient: IHttpClient`
│   │   ├── interceptors.ts   # Request (Bearer auth) & Response (401 Refresh Queue Mutex)
│   │   ├── token-storage.ts  # ITokenStorage with LocalStorage & Memory implementations
│   │   ├── errors.ts         # Strongly typed errors: Unauthorized, Forbidden, Validation, etc.
│   │   ├── types.ts          # ApiRequestConfig, ApiResponse, PaginatedResult
│   │   └── base-api.service.ts # BaseApiService<T, TCreate, TUpdate, ID>
│   │
│   ├── interfaces/
│   │   ├── http.interface.ts # IHttpClient, IReadService, ICreateService, ICrudService
│   │   └── token.interface.ts # ITokenStorage
│   │
│   ├── services/
│   │   ├── auth.service.ts   # AuthService (login, refresh, logout, session management)
│   │   ├── user.service.ts   # UserService (profile, password change, admin user CRUD)
│   │   ├── class.service.ts  # ClassService (CRUD + getMembers, addMember, removeMember)
│   │   └── index.ts
│   │
│   ├── __tests__/
│   │   ├── api-core.test.ts          # Unit tests for config, storage, errors, interceptors
│   │   └── hooks-and-services.test.ts # Unit tests for services & 401 concurrent mutex
│   │
│   └── index.ts              # Public API barrel export
│
└── hooks/
    ├── core/
    │   ├── useAsync.ts       # Base hook for arbitrary async operations (with abort support)
    │   ├── useQuery.ts       # Base data-fetching hook (auto-fetch, params, caching, refetch)
    │   ├── useMutation.ts    # Base mutation hook (mutate, mutateAsync, lifecycle callbacks)
    │   ├── useApi.ts         # Wrapper helpers
    │   ├── types.ts          # Hook interfaces (QueryState, MutationState, options)
    │   └── index.ts
    │
    ├── useCurrentUser.ts     # Concrete hook consuming UserService
    ├── useClasses.ts         # Concrete hook consuming ClassService
    ├── useAuth.ts            # Context-backed auth hook
    └── index.ts
```

---

## 2. Key Features & Design Patterns

### 2.1. Environment Configuration Rules Compliance
- All application configurations are located in `src/config/`.
- Entry point is strictly `@/config/environment`.
- Configuration is **immutable** (`Object.freeze(...)`, `as const`).
- Contains **no secrets** (only public config: `baseUrl`, `timeout`, token storage keys).
- No direct `axios.create` in services/hooks/components.

### 2.2. Token Refresh Mutex & Queue (Concurrency-Safe)
- When access token expires and an API returns `401 Unauthorized`:
  1. The first request triggers `POST /api/v1/auth/refresh` using the stored refresh token.
  2. Any subsequent concurrent 401 requests are automatically suspended into a `failedQueue`.
  3. Once the refresh call succeeds, the new access token is persisted in `tokenStorage`, and all queued requests are retried seamlessly with the new Bearer token.
  4. If the refresh token is missing, expired, or revoked, all queued requests are rejected, tokens are wiped, and an `auth:expired` event is broadcasted so the UI automatically logs out.
  5. Auth endpoints (`/auth/login`, `/auth/refresh`, `/auth/logout`) and requests with `_retry: true` or `skipAuth: true` are excluded to prevent infinite loops.

### 2.3. SOLID Implementation Summary
- **Single Responsibility (SRP)**:
  - `TokenStorage`: ONLY token persistence.
  - `BaseApiService`: ONLY REST resource communication.
  - `useQuery` / `useMutation`: ONLY React state and lifecycle.
- **Open/Closed (OCP)**:
  - New API domains extend `BaseApiService` without modifying base logic.
  - Hooks accept transforms, options, and callbacks.
- **Liskov Substitution (LSP)**:
  - `MemoryTokenStorage` can substitute for `LocalStorageTokenStorage` seamlessly in tests or SSR.
  - Subclasses of `BaseApiService` conform to `ICrudService`.
- **Interface Segregation (ISP)**:
  - Granular interfaces (`IHttpClient`, `IReadService`, `ICreateService`, `IUpdateService`, `IDeleteService`, `ICrudService`).
- **Dependency Inversion (DIP)**:
  - `BaseApiService` and domain services accept an injected `IHttpClient`, defaulting to `httpClient`. Unit tests can inject mock clients with 0 network calls.

---

## 3. How to Test & Verify

### 3.1. Automated Unit Tests
Run the complete unit test suite via:
```bash
cd frontend
npm test
```
**Expected Result**:
- `10/10` tests passing.
- Validates immutability, memory storage, typed error parsing, BaseApiService CRUD, request interceptor token attachment, `skipAuth` flag, and concurrent 401 refresh token mutex.

### 3.2. Lint & Type Check
```bash
npm run lint
npm run build
```
**Expected Result**:
- `0` lint errors (`eslint .`).
- `0` typescript compilation errors (`tsc -b && vite build`).
