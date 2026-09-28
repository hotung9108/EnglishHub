---
id: TASK-FE-FORGOT-RESET-PASSWORD
title: "Review and Design Logical & Practical Forgot and Reset Password Flow"
role: fe-primary
assignee: Maloque18705
status: "Done"
created_at: 2026-09-27T18:30:00+07:00
updated_at: 2026-09-27T19:00:00+07:00
priority: P0
tags: [frontend, auth, forgot-password, reset-password, security, otp-verification, password-strength]
---

# TASK-FE-FORGOT-RESET-PASSWORD: Review and Design Logical & Practical Forgot and Reset Password Flow

## Objective
Review, design, and implement an intuitive, secure, and practical Forgot Password and Reset Password workflow for EnglishHub. The feature is seamlessly integrated with the existing authentication ecosystem (`Login.tsx`, `login.css`), provides realistic email/OTP verification, features a real-time password strength meter, and strictly adheres to `convention-fe.md` (no inline styles, TypeScript strict mode, bilingual support).

## Deliverables & Results
1. **Types & Interfaces (`types/auth-flow.types.ts`)**:
   - `ForgotPasswordStep` ('request' | 'verify' | 'reset' | 'success')
   - `PasswordStrength` (score, label, color, percent)
   - `PasswordCriteria` (hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial, isMatching)
2. **Styles (`styles/forgot-password.css`)**:
   - 4-step progress indicator bar with active/completed markers.
   - Quick demo account selector pills.
   - Simulated test inbox card for OTP codes.
   - 6-digit OTP input grid with auto-focus and paste handling.
   - Real-time password strength bar & criteria checklist with dynamic green badges.
   - Success celebration card with redirect countdown.
3. **Components & Routes**:
   - `pages/ForgotPassword.tsx`: Complete 4-step guided recovery flow.
   - `pages/ResetPassword.tsx`: Direct email token URL handler (`/reset-password?token=...&email=...`).
   - `pages/Login.tsx`: Linked "Quên mật khẩu?" directly to `/forgot-password`.
   - `App.tsx`: Registered routes for `/forgot-password` and `/reset-password`.
4. **Verification & Quality Assurance**:
   - `npm run lint`: Passed with 0 errors.
   - `npm run build`: Passed with 0 errors.
   - Automated browser test via `browser_subagent`: Verified complete flow and recorded demonstration video.
   - Testing guide created: `production_artifacts/fe_to_tester/FE_FORGOT_RESET_PASSWORD_TEST_GUIDE.md`.
