# Auth — Forgot/Reset Password Hardening (EmailJS delivery + session revocation) — Testing Instructions

**Task:** BE-TASK-33 · **Owner:** @be-secondary · **Branch:** `develop`
**Related audit items:** `BE-SEC-01` / `BUG-01` (P0 — OTP leaked in HTTP response)

## 1. What changed

### 1.1 OTP is no longer returned in the HTTP response (BREAKING)
- `ForgotPasswordResponse` is now `{ "message": string, "email": string }` — the **`debugOtp` field has been removed**.
- The 6-digit OTP and the deep-link token are delivered **by email only**.
- The OTP/token are **no longer written to the application log**.

### 1.2 Real email delivery via EmailJS
- New provider-agnostic port: `common/email/EmailService.java`.
- New implementation: `infrastructure/email/EmailJsEmailService.java` (EmailJS REST `POST /api/v1.0/email/send`).
- New wiring: `infrastructure/email/EmailConfiguration.java` (+ `EmailJsProperties`, `UnavailableEmailService` fallback).
- Failure behaviour: if EmailJS is unreachable or returns non-2xx, `forgot-password` responds **`502 Bad Gateway`** with `{"error":"Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau."}`. It never reports success for an email that was not sent.

### 1.3 Refresh sessions are revoked on password reset
- New port method `RefreshTokenRepository.revokeAllByUserId(Long userId)` implemented as a single bulk `UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = ? AND revoked_at IS NULL`.
- `AuthService.resetPassword` now revokes **all active sessions** for the user after the password is saved.
- Effect: previously issued **refresh tokens stop working** (any device must log in again with the new password).
- ⚠️ Residual risk (accepted): stateless **access tokens** remain valid until they expire (`app.security.access-token-ttl-seconds`, default 900s = 15 min).

### 1.4 Config keys added
| Key | Env var | Default (base) | Default (dev) |
|-----|---------|----------------|---------------|
| `app.email.enabled` | `EMAIL_ENABLED` | `false` | `true` |
| `app.email.emailjs.base-url` | `EMAILJS_BASE_URL` | `https://api.emailjs.com` | same |
| `app.email.emailjs.service-id` | `EMAILJS_SERVICE_ID` | *(empty)* | *(empty)* |
| `app.email.emailjs.password-reset-template-id` | `EMAILJS_PASSWORD_RESET_TEMPLATE_ID` | *(empty)* | *(empty)* |
| `app.email.emailjs.public-key` | `EMAILJS_PUBLIC_KEY` | *(empty)* | *(empty)* |
| `app.email.emailjs.private-key` | `EMAILJS_PRIVATE_KEY` | *(empty)* | *(empty)* |
| `app.email.emailjs.timeout-seconds` | `EMAILJS_TIMEOUT_SECONDS` | `10` | same |
| `app.frontend.reset-password-url` | `FRONTEND_RESET_PASSWORD_URL` | `http://localhost:5173/reset-password` | same |

When `app.email.enabled=false`, `forgot-password` returns **`500`** `{"error":"Dịch vụ email chưa được cấu hình."}` (fallback bean) — it does **not** silently succeed.

## 2. EmailJS prerequisites (verify before testing delivery)
1. EmailJS account with a connected email service + a template exposing the variables:
   `to_email`, `otp`, `reset_url`, `ttl_minutes`.
2. **Account → Security → "Allow non-browser applications" must be ON** — otherwise EmailJS rejects server-side calls (no browser `Origin`).
3. `EMAILJS_SERVICE_ID`, `EMAILJS_PASSWORD_RESET_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_PRIVATE_KEY` exported in the environment.
4. EmailJS rate limit is **1 request/second** — do not fire parallel `forgot-password` calls in tests.

## 3. How to run
```bash
docker compose -f docker-compose.dev.yml up -d
cd backend
EMAIL_ENABLED=true \
EMAILJS_SERVICE_ID=... EMAILJS_PASSWORD_RESET_TEMPLATE_ID=... \
EMAILJS_PUBLIC_KEY=... EMAILJS_PRIVATE_KEY=... \
./gradlew bootRun --args='--spring.profiles.active=dev'
```

## 4. Test scenarios

### A. Forgot / reset happy path
| # | Scenario | Expected |
|---|----------|----------|
| A1 | `POST /api/v1/auth/forgot-password {"email":"<valid>"}` | `200` `{"message":"Mã xác thực đã được gửi đến email của bạn.","email":"<valid>"}` — **no `debugOtp` key** |
| A2 | Response body | contains **only** `message` and `email` fields |
| A3 | Email inbox | receives the 6-digit OTP and a reset link containing `?email=...&token=...` |
| A4 | Application log | contains `Password reset email dispatched for [<email>]` and **never** the OTP or token |
| A5 | `POST /api/v1/auth/reset-password {"email":"<valid>","otp":"<from email>","newPassword":"NewPass123!"}` | `200` `"...thành công..."` |
| A6 | Login with the new password | `200` |
| A7 | Re-use the same OTP | `400` invalid/expired (single-use) |
| A8 | Reset via the emailed link token (deep link `ResetPassword.tsx`) | `200` |

### B. Session revocation
| # | Scenario | Expected |
|---|----------|----------|
| B1 | Login on client 1 and client 2 → reset password → `POST /auth/refresh` with **each** old refresh token | `401` for both (`Refresh token không hợp lệ.` / revoked) |
| B2 | Login again with the new password | `200`, new refresh token works |
| B3 | DB check: `SELECT count(*) FROM refresh_tokens WHERE user_id = ? AND revoked_at IS NULL` after reset | `0` |
| B4 | Reset with an invalid OTP | sessions are **not** revoked (verify count unchanged) |

### C. Email failure handling
| # | Scenario | Expected |
|---|----------|----------|
| C1 | Wrong `EMAILJS_PRIVATE_KEY` (provider rejects) | `502` `{"error":"Không thể gửi email đặt lại mật khẩu..."}` |
| C2 | `EMAIL_ENABLED=false` | `500` `{"error":"Dịch vụ email chưa được cấu hình."}` |
| C3 | Simulate provider down (block `api.emailjs.com`) | `502` within ~10s, no OTP/token in logs |

### D. Regression
| # | Scenario | Expected |
|---|----------|----------|
| D1 | `forgot-password` for an unknown email | `404` `Tài khoản với email này không tồn tại trong hệ thống.` (unchanged — anti-enumeration is out of scope) |
| D2 | `forgot-password` for a `LOCKED` account | `403` `Tài khoản đã bị khoá.` |
| D3 | `newPassword` shorter than 8 chars | `400` |
| D4 | Login / refresh / logout | unchanged |

## 5. Automated tests
- `AuthServiceTest` (updated + new): `forgotPasswordSendsOtpEmailForExistingUser`, `forgotPasswordRejectsUnknownEmail`, `resetPasswordUpdatesPasswordWhenOtpIsValid`, `resetPasswordRevokesEveryActiveSession`, `resetPasswordDoesNotRevokeSessionsWhenChallengeIsInvalid`.
- `EmailJsEmailServiceTest` (new): payload shape, `502` on provider rejection, `502` on unreachable provider.
- Full suite: `./gradlew test` → **BUILD SUCCESSFUL** (verified by @be-secondary, 2026-10-17).

## 6. ⚠️ Cross-team dependency — @fe-primary
Removing `debugOtp` **breaks the current FE autofill path**:
- `frontend/src/pages/ForgotPassword.tsx:83-84` and `:141-142` read `res.debugOtp` and autofill the OTP inputs.
- `frontend/src/api/__tests__/hooks-and-services.test.ts:76` mocks `otpPreview`.
These must be updated so the user reads the OTP from their inbox. Until then, the FE's "autofill" button is a no-op (it will not crash).

## 7. Not in this change (follow-up candidates)
- Rate limiting / OTP attempt limiting on `forgot-password`.
- Hashing the OTP/token at rest in `PasswordResetStore` (currently in-memory + plaintext, lost on restart).
- Revoking sessions for the other two password-change paths (`UserProfileService.changePassword`, `UserCrudService.update` admin reset).
- Immediate access-token invalidation (token-version / jti denylist).
- Anti-enumeration: generic response for unknown emails.
