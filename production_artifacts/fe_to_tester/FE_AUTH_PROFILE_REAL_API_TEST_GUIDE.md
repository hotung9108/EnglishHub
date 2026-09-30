# Frontend to Tester: Real API Integration Guide for Auth & Shared Profile Subsystem

## 1. Scope & References
- **Scope Items**: `[FE-11]`, `[FE-19]`
- **Input Specifications**: `[BE-07]` API Auth, `[BE-14]` API User Profile
- **Git Branch**: `feat/frontend-auth-api`
- **Related Components**:
  - `frontend/src/pages/Profile.tsx` (Role-adaptive profile for Admin, Teacher, Student)
  - `frontend/src/pages/ForgotPassword.tsx` (Real OTP & Reset flow connected to backend)
  - `frontend/src/pages/ResetPassword.tsx` (Deep link password reset handler)
  - `frontend/src/pages/Settings.tsx` (System & User Preferences)
  - `frontend/src/contexts/AuthContext.tsx` & `frontend/src/pages/Login.tsx`
  - `backend/src/main/java/com/english_hub/core/modules/auth/...` (Backend Auth APIs & Store)

---

## 2. Completed Implementation Summary

### A. Role-Adaptive Profile (`Profile.tsx`)
- **Shared Component across Roles**:
  - `/admin/profile` & `/admin/accounts/profile` (Admin role)
  - `/teacher/profile` (Teacher role)
  - `/student/profile` (Student role)
- **Role Detection & Data Wiring**:
  - Fetches freshest data from `GET /api/v1/users/me` via `userService.getMyProfile()`.
  - Dynamically renders role badges ("Quản trị viên", "Giáo viên", "Học viên").
  - Role-specific fields:
    - **Teacher**: Specialization ("Chuyên môn giảng dạy"), Teacher code (`GV-xxx`).
    - **Student**: Date of Birth ("Ngày sinh"), Parent Phone ("SĐT Phụ huynh"), Student code (`HV-xxx`).
    - **Admin**: Department info ("Ban Quản trị Hệ thống"), Admin code (`AD-xxx`).
  - **Editable Profile**: Full Name, Phone, and Avatar (presets or custom URL) submitted to `PUT /api/v1/users/me` via `userService.updateMyProfile(...)`.
  - **Password Change**: Submits `PATCH /api/v1/users/me/password` via `userService.changePassword(...)` with strength rules and confirmation check.
  - **Zero Mock Fallbacks**: Removed hardcoded fake dates/phones; displays clean placeholder when unset.

### B. End-to-End Forgot / Reset Password Workflow
- **Backend Endpoints (`[BE-07]`)**:
  - `POST /api/v1/auth/forgot-password`: Generates secure 6-digit OTP and UUID reset token with 15-minute TTL stored in thread-safe `PasswordResetStore`. Returns `otpPreview` for QA/testing convenience.
  - `POST /api/v1/auth/reset-password`: Validates OTP and reset token, looks up account, encodes password with BCrypt, saves to database, and invalidates reset token.
  - Public permitAll access added in `ApiRoutePolicy.java`.
- **Frontend Pages**:
  - `ForgotPassword.tsx`:
    - Step 1: User enters email -> sends request to `authService.forgotPassword`.
    - Step 2: User enters 6-digit OTP received -> validates against token.
    - Step 3: User inputs new password with real-time strength meter -> calls `authService.resetPassword`.
    - Step 4: Success card with auto-countdown redirect to `/login`.
  - `ResetPassword.tsx`:
    - Reads `?token=...&email=...` query parameters from email link.
    - Directly prompts for new password and calls `authService.resetPassword`.

### C. Clean Elimination of Mock Data
- Removed fake simulation timeouts (`setTimeout` mock delays).
- Removed static demo account selection buttons.
- Removed fake fallback profile data.
- Login redirection derives destination dynamically from real authenticated role.

---

## 3. Test Cases for QA / Tester

### Test Case 1: Role-Adaptive Profile Loading & Updates
1. **Login as Teacher** (`teacher@eh.com` / `password123` or backend seeded teacher).
2. Click User Menu in TopBar -> Select "Hồ sơ cá nhân" (navigates to `/teacher/profile`).
3. Verify:
   - Header shows "Hồ sơ Giáo viên" and badge "Giáo viên".
   - ID starts with `GV-`.
   - Field "Chuyên môn giảng dạy" is displayed.
4. Modify "Họ và tên" -> Click "Lưu thông tin".
5. Verify toast success notification and TopBar avatar / name update immediately.
6. Repeat with **Student** (`student@eh.com`) -> navigates to `/student/profile`, displays "Ngày sinh", "SĐT Phụ huynh", and ID starts with `HV-`.

### Test Case 2: In-App Password Change via Profile
1. On `/teacher/profile`, switch to tab "Bảo mật & Đăng nhập" (`?tab=security`).
2. Input current password and a new password with < 8 characters -> verify error prompt.
3. Input valid current password and matching new password (>= 8 chars) -> Click "Cập nhật mật khẩu".
4. Verify success toast. Log out and log back in with the new password.

### Test Case 3: Forgot Password End-to-End Flow
1. Navigate to `/forgot-password`.
2. Enter registered email (e.g., `teacher@eh.com`) -> Click "Gửi mã xác nhận".
3. Check network tab (`POST /api/v1/auth/forgot-password` returns `200 OK` with `token` and `otpPreview`).
4. Enter 6-digit OTP in the verification grid.
5. Enter new password and confirm new password -> Click "Lưu mật khẩu mới".
6. Verify success page displays and redirects to `/login`.
7. Log in using the newly set password.

### Test Case 4: Deep Link Reset Password Flow
1. Open URL `/reset-password?token=<TOKEN_FROM_STEP_1>&email=teacher@eh.com`.
2. Enter new password -> Click "Đặt lại mật khẩu".
3. Verify password reset completes successfully.
