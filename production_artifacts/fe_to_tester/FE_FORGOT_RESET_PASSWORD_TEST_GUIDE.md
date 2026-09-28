# EnglishHub - Forgot & Reset Password Frontend Testing Guide

## 1. Overview
This document guides the QA / Tester Agent (`@tester`) in verifying the newly implemented **Forgot Password** and **Reset Password** flows in EnglishHub.

- **Primary Route**: `/forgot-password`
- **Direct Token Reset Route**: `/reset-password?token={token}&email={email}`
- **Entry Points**:
  - Direct navigation to `/forgot-password`
  - "Quên mật khẩu?" link on `/login`
  - Direct link from email notification (`/reset-password?token=eh-sec-9812&email=teacher@eh.com`)

---

## 2. Key Features Implemented

### A. 4-Stage Intuitive Password Recovery Workflow (`/forgot-password`)
1. **Stage 1: Email Request (`request`)**:
   - Clean, branded layout synchronized with `/login` (EnglishHub Identity & Security Showcase).
   - Email format validation (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`).
   - Quick Demo Account selector pills (`teacher@eh.com`, `student@eh.com`, `admin@eh.com`) for rapid testing.
   - Bilingual support (Vietnamese / English toggle in top right).
   - "Quay lại đăng nhập" back navigation link.
2. **Stage 2: 6-Digit OTP Verification (`verify`)**:
   - 6 individual auto-advancing, backspace-aware digit input boxes.
   - Clipboard paste support (pastes 6 continuous digits automatically across all boxes).
   - Simulated test inbox card showing the generated OTP code (`849201`) with a one-click "Tự động điền mã" helper.
   - 60-second resend countdown timer with "Gửi lại mã" action.
   - Change email button allowing users to edit target email without starting over.
3. **Stage 3: New Password Creation (`reset`)**:
   - Password strength meter (0-100% calculation based on length, lowercase, uppercase, numbers, and special symbols).
   - Dynamic criteria checklist with live green check indicators:
     - Tối thiểu 8 ký tự
     - Có cả chữ hoa & chữ thường
     - Có ít nhất 1 chữ số
     - Có ít nhất 1 ký tự đặc biệt (!@#$%^&*...)
     - Mật khẩu xác nhận trùng khớp
   - Show / Hide toggle for both password fields.
4. **Stage 4: Success & Auto-Redirect (`success`)**:
   - Celebration checkmark animation.
   - 5-second countdown timer with auto-redirect to `/login`.
   - "Đăng nhập ngay" immediate action button.

### B. Direct Email Token Recovery (`/reset-password`)
- Handles users clicking direct password recovery links sent via email.
- URL parameters: `?token=...&email=...`.
- Displays security token validation banner.
- Direct entry into the password reset form with live strength meter & criteria checklist.
- Auto-redirects to `/login` upon successful update.

---

## 3. Test Cases for Manual & Automated Verification

| Test ID | Scenario | Expected Result | Status |
|---|---|---|---|
| **TC-FP-01** | Click "Quên mật khẩu?" on `/login` | Navigates to `/forgot-password`, page displays 4-step progress bar | PASS |
| **TC-FP-02** | Submit empty or invalid email | Shows error alert "Vui lòng nhập địa chỉ email hợp lệ" | PASS |
| **TC-FP-03** | Click Quick Demo pill (`teacher@eh.com`) & submit | Moves to Step 2 (OTP Verification), displays masked email | PASS |
| **TC-FP-04** | Use "Tự động điền mã" button | Populates 6 digit boxes with the simulated OTP code | PASS |
| **TC-FP-05** | Enter incorrect OTP code and submit | Shows error message "Mã xác minh không chính xác" | PASS |
| **TC-FP-06** | Submit valid OTP | Moves to Step 3 (New Password Setup) | PASS |
| **TC-FP-07** | Type weak password (e.g. `12345`) | Strength meter shows "Yếu", checklist items remain unchecked | PASS |
| **TC-FP-08** | Type strong matching password (`Admin@2026!`) | Strength meter shows "Mạnh & An toàn" / "Cực kỳ mạnh", all 5 checklist items turn green | PASS |
| **TC-FP-09** | Submit new password | Moves to Step 4 (Success card) and auto-redirects to `/login` | PASS |
| **TC-FP-10** | Visit direct token link `/reset-password?token=eh-sec-9812&email=teacher@eh.com` | Renders token reset view with valid token banner and target email | PASS |
| **TC-FP-11** | Toggle language button (EN / VI) | All text across headers, labels, placeholders, and checklist switches smoothly | PASS |

---

## 4. Environment & Build Validation
- **Lint Check**: `npm run lint` -> 0 errors, 0 warnings.
- **TypeScript & Build**: `tsc -b && vite build` -> Passed with 0 errors.
- **CSS Architecture**: Dedicated styles in `src/styles/forgot-password.css`, zero inline styles, uses CSS variables conforming to `convention-fe.md`.
