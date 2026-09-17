# Authentication API Implementation Plan

> **Stack:** Java 21 · Spring Boot 4.1.1 · Spring Security · JWT (custom HS256, no jjwt)
> **Persistence:** JDBC (`NamedParameterJdbcTemplate`) — NOT Spring Data JPA entities
> **Build:** Gradle (`backend/build.gradle`)
> **Scope:** Login, Token Refresh, Logout
> **Base path:** `/api/v1/auth/*` (consistent with existing `/api/v1/users`)

---

## Pre-implementation Checklist

Confirm the following before starting any phase:

- [x] Database connection is configured and reachable (see `application.properties` / `docker-compose.dev.yml`)
- [x] `users` table exists — `id`, `full_name`, `email`, `password_hash`, `role`, `status`, `is_deleted` (already in `V1__init_schema.sql`)
- [x] `refresh_tokens` table exists — `id`, `user_id`, **`token_hash`**, `expires_at`, `revoked_at`, `user_agent`, `ip_address` (already in `V1__init_schema.sql`)
- [x] JWT secret / issuer / access-token TTL defined in `application.properties` (`app.security.*`)
- [ ] `app.security.refresh-token-ttl-seconds` added to `application.properties` (see Phase 2)
- [x] Spring Security dependency present in `build.gradle` — **no jjwt needed**, no new auth library
- [x] Phase 1 already implemented in `com.english_hub.backend.security` (verify only, see Phase 1)

---

## Phase 1 — Security Chain (VERIFY · mostly exists)

Almost everything is already implemented and working. **Do not re-write it.**

### Already present (verify each)
1. **JWT utility — `security/JwtTokenService.java`**
   - `createAccessToken(long userId, UserRole role)` → HS256 JWT with `sub`, `role`, `iss`, `iat`, `exp`
   - `parse(String token)` → `Optional<JwtPrincipal>`, constant-time signature check, issuer + expiry validation
2. **JWT filter — `security/JwtAuthenticationFilter.java`** (`OncePerRequestFilter`) — reads `Authorization: Bearer <token>`, validates, sets `SecurityContext`
3. **Custom `AuthenticationEntryPoint` — `security/ApiAuthenticationEntryPoint.java`** — returns `401` with `{ "error": "Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn." }`
4. **Filter chain — `security/SecurityConfig.java`** — stateless, CSRF disabled, JWT filter registered before `UsernamePasswordAuthenticationFilter`, custom entry point + access-denied handler wired
5. **Password encoder bean** — `BCryptPasswordEncoder` exposed in `SecurityConfig`

### Required change
6. **Register auth routes in `SecurityConfig`** — add to `authorizeHttpRequests`:
   ```java
   .requestMatchers("/api/v1/auth/login", "/api/v1/auth/refresh").permitAll()
   ```
   `/api/v1/auth/logout` stays authenticated (default rule). `/actuator/health` and `/error` remain `permitAll`.

### Expected outputs after Phase 1
- App starts without errors
- Protected route without token → `401` with the VN message (never `403`)
- `/api/v1/auth/login` and `/api/v1/auth/refresh` reachable without a token

---

## Phase 2 — Data Layer (JDBC, not JPA)

Follow the existing JDBC pattern set by `features/user/infrastructure/persistence/JdbcUserRepository.java`. Auth lives in a new bounded context `com.english_hub.backend.features.auth`.

### 2.1 `UserRepository` — add `findByEmail`

In `features/user/domain/repository/UserRepository.java` (interface) + `JdbcUserRepository` (impl):

```java
Optional<User> findByEmail(String email);   // WHERE LOWER(email) = LOWER(:email) AND is_deleted = FALSE
```
- Must return the **full** `User` model (including `passwordHash`, `role`, `status`) for login
- **Must exclude soft-deleted users** (`is_deleted = FALSE`)

### 2.2 New `RefreshTokenRepository` (auth context)

- **Domain model** — `features/auth/domain/model/RefreshToken.java` (record): `id`, `userId`, `tokenHash`, `expiresAt`, `revokedAt`, `userAgent`, `ipAddress`
- **Port** — `features/auth/domain/repository/RefreshTokenRepository.java`:
  ```java
  Optional<RefreshToken> findByTokenHash(String tokenHash);
  long create(long userId, String tokenHash, Instant expiresAt, String userAgent, String ipAddress);
  int revokeByTokenHash(String tokenHash);
  ```
- **Adapter** — `features/auth/infrastructure/persistence/JdbcRefreshTokenRepository.java` (`@Repository`, `NamedParameterJdbcTemplate`)

### 2.3 Token storage rule — hash, never plaintext

- Client receives a random token: `UUID.randomUUID().toString()`
- **Database stores only the hash**: `SHA-256(token)` (hex) in `token_hash`
- All lookups (`findByTokenHash`, `revokeByTokenHash`) hash the incoming token first
- Justification: schema column is `token_hash` with a UNIQUE constraint — the plan's old `token` column does not exist

### 2.4 Config — refresh token TTL

Add to `application.properties`:
```properties
app.security.refresh-token-ttl-seconds=${REFRESH_TOKEN_TTL_SECONDS:604800}
```
Use this (injected like `access-token-ttl-seconds`) to compute absolute `expires_at`.

### Expected outputs after Phase 2
- `findByEmail` returns a user w/ hash & status; deleted users are excluded
- Refresh token rows store SHA-256 hash, unique per token
- Both repositories compile and are injectable; a manual JDBC test can read a user by email and read/write refresh token rows

---

## Phase 3 — `POST /api/v1/auth/login` (permitAll)

### What to implement

1. **Request DTO** — `features/auth/interfaces/rest/dto/LoginRequest.java`: `email`, `password`
2. **Response DTO** — `AuthResponse.java`: `message`, `accessToken`, `refreshToken`, `user` (`id`, `fullName`, `email`, `role`)
3. **Service** — `features/auth/application/service/AuthService.java`, logic in order:
   - Require both `email` and `password` present → `400` (`ApiException.badRequest`)
   - `userRepository.findByEmail(email)` → `404` if not found
   - `passwordEncoder.matches(raw, user.passwordHash())` → `401` if mismatch (never plaintext compare)
   - `user.status() == LOCKED` → `403`
   - Generate access token: `jwtTokenService.createAccessToken(user.id(), user.role())`
   - Generate refresh token: `UUID.randomUUID().toString()`; persist **SHA-256 hash** via `RefreshTokenRepository.create(userId, hash, now + ttl, userAgent, ipAddress)` (read `user_agent` + `ip` from `HttpServletRequest`)
   - Return `200` with tokens + user info
   - **No try/catch — `GlobalExceptionHandler` already returns `500`** for unexpected errors
4. **Controller** — `features/auth/interfaces/rest/AuthController.java`: `POST /api/v1/auth/login` (no auth)

### Expected outputs after Phase 3
- All six response cases return correct status + body
- A `refresh_tokens` row (with `token_hash`) appears after successful login
- Password comparison always uses the encoder

---

## Phase 4 — `POST /api/v1/auth/refresh` (permitAll)

### What to implement

1. **Request DTO** — `RefreshRequest.java`: `refreshToken`
2. **Service method** — `AuthService.refresh(...)`, logic in order:
   - Require `refreshToken` present → `400`
   - Hash token → `findByTokenHash` → `401` ("Refresh token không hợp lệ.") if not found
   - `revokedAt != null` → `401` ("Phiên đăng nhập đã bị thu hồi, vui lòng đăng nhập lại.")
   - `expiresAt.isBefore(now)` → `401` ("Refresh token đã hết hạn, vui lòng đăng nhập lại.")
   - Generate a new access token for the token's `userId` and return it
   - **No try/catch — rely on `GlobalExceptionHandler`**
3. **Controller** — `POST /api/v1/auth/refresh` (no auth)

### Expected outputs after Phase 4
- All five cases return correct status + body
- Valid non-expired non-revoked token → new access token that passes `JwtTokenService.parse`
- Expired / revoked tokens rejected with distinct `401` messages

---

## Phase 5 — `POST /api/v1/auth/logout` (authenticated)

### What to implement

1. **Request DTO** — `LogoutRequest.java`: `refreshToken`
2. **Service method** — `AuthService.logout(...)`, logic in order:
   - JWT filter already rejects missing/invalid access token → `401` before the controller (entry point, not controller)
   - Require `refreshToken` present → `400`
   - Hash token → `findByTokenHash` → `404` if not found
   - `revokeByTokenHash(tokenHash)` sets `revoked_at = now()`; persist
   - Return `200`
   - **No try/catch — rely on `GlobalExceptionHandler`**
3. **Controller** — `POST /api/v1/auth/logout`, **requires** authentication

### Expected outputs after Phase 5
- Logout without valid access token → `401` from the security chain
- Successful logout populates `revoked_at` on that row
- Reusing the same refresh token on `/api/v1/auth/refresh` after logout → `401` ("Phiên đăng nhập đã bị thu hồi")
- Prefer `revokeByTokenHash` (single token) over the existing `UserRepository.revokeActiveRefreshTokens` (revokes ALL)

---

## Phase 6 — Integration Validation

No new features. Run the full flow:

1. Login → access token + refresh token
2. Access token on a protected route → success
3. Refresh → new access token
4. Expired / tampered access token → `401` from entry point (not `403`)
5. Logout → `200`, `revoked_at` set
6. Refresh with revoked token → `401` with correct message
7. All `400` / `401` / `403` / `404` / `500` cases reachable and shaped correctly

### Expected outputs after Phase 6
- All documented codes/bodies match the spec exactly
- No endpoint returns `403` in place of `401` for JWT failures
- No plaintext passwords or refresh tokens appear in logs, DB, or responses

---

## Notes for the Agent

| Topic | Note |
|---|---|
| File paths & names | Base path is `/api/v1/auth/*`. New code goes in `com.english_hub.backend.features.auth` (DDD: `domain/`, `application/`, `infrastructure/persistence/`, `interfaces/rest/dto/`). |
| Persistence | **JDBC** (`NamedParameterJdbcTemplate`), mirror `JdbcUserRepository`. Do NOT introduce JPA entities/repositories for auth. |
| JWT | Use the existing `security/JwtTokenService`. **No jjwt dependency** — the custom HS256 implementation is already tested and used. |
| `users` columns | Password column is `password_hash` (not `password`). Login must also filter `is_deleted = FALSE`. |
| `refresh_tokens` columns | Column is `token_hash` (not `token`). Always store **SHA-256 hash** of the client token; never the raw token. |
| Custom `AuthenticationEntryPoint` | Already registered in `SecurityConfig`. If JWT errors ever surface as `403`, the entry point is mis-wired — do not revert to default. |
| Password encoding | All comparisons go through the `PasswordEncoder` bean. Never compare raw strings. |
| Refresh token format | `UUID.randomUUID().toString()`; only the hash is persisted. Original value is returned once at login. |
| Access token expiry | Short (default 900s), from `app.security.access-token-ttl-seconds`. Never hardcode. |
| Refresh token expiry | Add `app.security.refresh-token-ttl-seconds` (default 604800s / 7 days). Store absolute `expires_at`, not a duration. |
| `users.status` | Only `LOCKED` is gated (→ `403`). Other statuses are not blocked at this layer. |
| Response envelope | Errors use key `"error"`; success uses `"message"`. Matches current `ApiError` / `MessageResponse`. Keep consistent — do not mix with `common-conventions.md` envelope without a team decision. |
| 500 handling | Do **not** wrap service methods in try/catch. `GlobalExceptionHandler.handleUnexpectedException` already returns `500` `{ "error": "Lỗi máy chủ." }`. |
| Logout scope | Revoke only the provided refresh token via `revokeByTokenHash`. Do not call `revokeActiveRefreshTokens(userId)` (that revokes all sessions). |