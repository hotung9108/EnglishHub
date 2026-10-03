---
id: TASK-FE-AUTH-PROFILE-REAL-API
title: "Real API Integration for Auth & Shared Profile Subsystems (FE-11, FE-19)"
role: fe-primary
assignee: Maloque18705
status: "Done"
created_at: 2026-09-30T16:00:00+07:00
updated_at: 2026-09-30T17:00:00+07:00
completed_at: 2026-09-30T17:00:00+07:00
priority: P0
tags: [frontend, auth, profile, real-api, role-adaptive, forgot-password, reset-password]
---

# TASK-FE-AUTH-PROFILE-REAL-API: Real API Integration for Auth & Shared Profile Subsystems

## 1. Context & Objective
Verify and complete real API integration for Authentication & Shared pages subsystem (Scope: `[FE-11]`, `[FE-19]`).
Inputs: `[BE-07]` API Auth, `[BE-14]` API User Profile.
Outputs: Auth and shared pages running entirely with real data and backend endpoints, with `Profile.tsx` shared and tailored for all 3 roles (Admin, Teacher, Student).

## 2. Definition of Done (DoD) Fulfillment
- [x] **Profile.tsx shared across all 3 roles**:
  - Dynamically switches role badge, ID prefix (`AD-xxx`, `GV-xxx`, `HV-xxx`), and fields (Teacher: specialization; Student: DOB & parent phone; Admin: department).
  - Fetches from `userService.getMyProfile()` (`GET /api/v1/users/me`).
  - Updates profile via `userService.updateMyProfile()` (`PUT /api/v1/users/me`).
  - Changes password via `userService.changePassword()` (`PATCH /api/v1/users/me/password`).
  - Navigable from TopBar and Sidebar for Admin, Teacher, and Student (`/admin/profile`, `/teacher/profile`, `/student/profile`).
- [x] **Forgot / Reset Password works end-to-end with real Auth API**:
  - Implemented backend endpoints: `POST /api/v1/auth/forgot-password` and `POST /api/v1/auth/reset-password`.
  - Configured `PasswordResetStore` with 15-minute TTL and single-use verification.
  - Added public permitAll in `ApiRoutePolicy.java`.
  - Connected `ForgotPassword.tsx` and `ResetPassword.tsx` to `authService.forgotPassword` and `authService.resetPassword`.
- [x] **All mock data eliminated**:
  - Removed simulated timeouts, demo pills, fake OTP generators, and static fallback data.
- [x] **Validation & Quality**:
  - Frontend: `npm run lint` (0 errors), `npm run build` (0 errors), `npm test` (16 passed, 0 failed).
  - Backend: `com.english_hub.core.modules.auth.*` unit tests (100% passed).
- [x] **Artifacts**:
  - Test guide dropped at `production_artifacts/fe_to_tester/FE_AUTH_PROFILE_REAL_API_TEST_GUIDE.md`.
