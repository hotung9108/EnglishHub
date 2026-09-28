---
id: TASK-FE-SETTINGS-PROFILE
title: "Design and Implement Comprehensive Personal Settings & Profile Page for Admin, Teacher, and Student"
role: fe-primary
assignee: Maloque18705
status: "Done"
created_at: 2026-09-27T23:16:00+07:00
updated_at: 2026-09-28T00:04:00+07:00
completed_at: 2026-09-28T00:04:00+07:00
priority: P0
tags: [frontend, settings, profile, admin, teacher, student, rbac, ui-tokens, responsive, i18n]
---

# TASK-FE-SETTINGS-PROFILE: Personal Settings & Profile Page for Admin, Teacher, and Student

## Objective
Design and implement a unified, modern, role-tailored Personal Settings & Profile page for all 3 user roles (Admin, Teacher, Student) in EnglishHub. Strictly adhere to:
1. `convention-fe.md`: React 19, TypeScript strict mode (no `any`), pure CSS variables / design tokens from `src/styles/index.css`, zero ad-hoc inline styles, fully responsive across desktop, tablet, and mobile.
2. EnglishHub visual aesthetics: Clean, cohesive styling with micro-interactions, pill badges, elevation cards, and smooth transitions.
3. Role specialization:
   - **Admin**: Staff ID, department, security alerts, session timeouts, system audit logs, maintenance mode simulation.
   - **Teacher**: Teacher ID, subjects/skills (IELTS/TOEIC/Speaking/Writing), academic bio, meeting room URL, AI grading assistant toggles, submission alert preferences.
   - **Student**: Student ID, enrolled class, target IELTS band, learning goals (daily practice minutes), audio autoplay, IPA phonetic pronunciation display, deadline alerts.
4. Comprehensive settings tabs:
   - **Profile (Hồ sơ cá nhân)**: Avatar management (custom upload/preset/delete), identity fields, contact info, editable fields with live state synchronization.
   - **Security (Bảo mật)**: Password change with real-time strength meter & criteria validation, 2FA toggle, active sessions list with device logout.
   - **Notifications (Thông báo)**: Role-specific email & push notification toggles.
   - **Preferences (Tùy chọn)**: Theme, language switcher (VI/EN synchronized with `LanguageContext`), font scaling, and role-specific operational preferences.
5. Navigation integration:
   - Route registration in `App.tsx` for `/admin/settings`, `/teacher/settings`, `/student/settings`, and backward-compatible `/admin/accounts/profile`.
   - Update `Sidebar.tsx` footer link to route dynamically to `/${role}/settings`.
   - Update `TopBar.tsx` user chip with interactive dropdown menu for quick profile access and logout.
6. Local persistence & AuthContext synchronization:
   - Updates to user profile dynamically sync with `AuthContext` and persist in `localStorage`.

## DoD Checklist
- [x] Task file tracked in `.agents/tasks/fe-primary/done/`.
- [x] TypeScript compiles cleanly with zero errors (`npm run build`).
- [x] ESLint passes with zero warnings (`npm run lint`).
- [x] CSS adheres strictly to design tokens in `src/styles/settings.css` (no inline styles).
- [x] Full bilingual i18n support (VI and EN).
- [x] Visual verification across Admin, Teacher, and Student roles with redesigned Hero Card.
- [x] Test guide documented in `production_artifacts/fe_to_tester/FE_SETTINGS_PROFILE_TEST_GUIDE.md`.
