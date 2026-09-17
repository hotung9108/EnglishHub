# BE-TASK-4 — Auth APIs: Testing Instructions & Validation Results

## Status
Implemented ✅ — login / refresh / logout (per `.agents/plans/auth-implementation-plan.md`)
> **Scope note:** the task title mentions "register". Registration is **NOT** part of the approved plan (scope = login, refresh, logout) and is **not** implemented — confirm with PM if a register API is required.

## What was added/changed
- **Endpoints** (base path `/api/v1/auth`):
  - `POST /api/v1/auth/login`    — public
  - `POST /api/v1/auth/refresh`  — public
  - `POST /api/v1/auth/logout`   — authenticated (JWT required)
- **Swagger UI** (SpringDoc `springdoc-openapi-starter-webmvc-ui:3.1.0`):
  - `GET /swagger-ui/index.html`, `GET /v3/api-docs` — public
  - Spec defines a **HTTP bearer (JWT) security scheme** + global `security` requirement → use the **Authorize** button to paste an access token.
- **Security**: JWT access token HS256 (existing `security/JwtTokenService`); refresh tokens stored as **SHA-256 hex** in `refresh_tokens.token_hash` (never plaintext); `SecurityConfig` permits `/swagger-ui/**`, `/v3/api-docs/**`, `/swagger-resources/**`, `/webjars/**`.
- **Bugs found & fixed during integration** (pgjdbc quirks — these are also latent in the `features/user` module, see note below):
  1. Reading `timestamptz` with `getObject(col, Instant.class)` → `07006/DataIntegrityViolation` 500. Fixed in `JdbcAuthUserRepository` + `JdbcRefreshTokenRepository` row mappers → `getObject(col, OffsetDateTime.class).toInstant()`.
  2. Binding `java.time.Instant` into `timestamptz` INSERT → `07006` 500. Fixed in `JdbcRefreshTokenRepository.create(...)` → `.atOffset(ZoneOffset.UTC)`.
  - ⚠️ **Note for `@be-primary`/user-module owners:** `features/user/.../JdbcUserRepository` binds `updatedAt = Instant` the same way — expected to fail with the same 07006 on insert. Needs the same `OffsetDateTime` fix.

## How to run the backend (dev)
1. Postgres running: `docker compose -f docker-compose.dev.yml up -d` (defaults `appdb` / `devuser` / `devpassword` on `localhost:5432`).
2. `cd backend && ./gradlew bootRun --args='--spring.profiles.active=dev'`  → http://localhost:8080
3. Swagger UI: http://localhost:8080/swagger-ui/index.html
4. Test accounts (inserted manually into local DB, password = `Secret01`, BCrypt):
   - `auth.validate@englishhub.dev` — TEACHER, ACTIVE
   - `auth.locked@englishhub.dev` — TEACHER, LOCKED (for the 403 case)

## Validation results (live, all passed)
| # | Scenario | Expected | Actual |
|---|----------|----------|--------|
| 1 | Login valid | 200 + access token + refresh token + user | 200 ✅ |
| 2 | `/api/v1/users/me` no token | 401 `{"error":"Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn."}` | 401 ✅ |
| 3 | `/users/me` with access token | 200 | 200 ✅ |
| 4 | Tampered access token | 401 (entry point, not 403) | 401 ✅ |
| 5 | Login wrong password | 401 `Email hoặc mật khẩu không chính xác.` | 401 ✅ |
| 6 | Login unknown email | 404 `Tài khoản không tồn tại.` | 404 ✅ |
| 7 | Login blank fields | 400 `Vui lòng nhập email và mật khẩu.` | 400 ✅ |
| 8 | Login LOCKED account | 403 `Tài khoản đã bị khoá.` | 403 ✅ |
| 9 | Refresh valid token | 200 + new access token | 200 ✅ |
| 10 | Logout (authenticated) | 200 `Đăng xuất thành công.` | 200 ✅ |
| 11 | Refresh with revoked token | 401 `Phiên đăng nhập đã bị thu hồi...` | 401 ✅ |
| 12 | Logout without access token | 401 | 401 ✅ |
| 13 | Swagger UI / api-docs without token | 200, spec has `bearerAuth` scheme + global security | 200 ✅ |
| 14 | No raw refresh token in DB | `token_hash` never equals the client token | ✅ (0 matches) |
| 15 | `token_hash` format | 64-char SHA-256 hex | ✅ |
| 16 | Expired access token (TTL=2s) | 401 from entry point | 401 ✅ |
| 17 | Expired refresh token (TTL=2s) | 401 `Refresh token đã hết hạn...` | 401 ✅ |
| 18 | `./gradlew test` | BUILD SUCCESSFUL | ✅ (incl. OpenApiConfigTest) |

## Suggested tester focus
- Re-run #1–#11 above against a fresh env.
- Swagger: open UI without a token (works), authorize with the access token from login, call `/api/v1/users/me`.
- Confirm refresh token reuse after logout/revoke (rotation is not implemented — reuse of an *active* token is allowed; that's per spec).