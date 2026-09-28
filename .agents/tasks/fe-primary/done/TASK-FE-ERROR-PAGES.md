---
id: TASK-FE-ERROR-PAGES
title: "Design and Implement Error 404 & Error 403 Pages Synchronized with EnglishHub UI Tokens"
role: fe-primary
assignee: Maloque18705
status: "Done"
created_at: 2026-09-27T17:35:00+07:00
updated_at: 2026-09-27T17:56:00+07:00
completed_at: 2026-09-27T17:56:00+07:00
priority: P0
tags: [frontend, error-pages, 404, 403, rbac, ui-tokens, responsive, i18n]
---

# TASK-FE-ERROR-PAGES: Design and Implement Error 404 & Error 403 Pages

## Objective
Design and implement clean, focused, and responsive Error 404 (Not Found) and Error 403 (Forbidden / Access Denied) pages for EnglishHub, adhering strictly to:
1. `convention-fe.md`: React 19, TypeScript strict mode, CSS variables / Design Tokens, i18n support, no ad-hoc inline styles, mobile/tablet responsive.
2. User preferences: Clean minimal layout on standard light background, displaying strictly the core error message and graphic, without suggestions/search/metadata, and with only the "Quay về trang chủ" action button.
3. Role-Based Access Control (RBAC): Seamless integration with `ProtectedRoute.tsx` to redirect unauthorized role attempts to `/403`.
4. Wildcard routing in `App.tsx` (`path="*"`) to catch invalid URLs and render the 404 page.

## Key Features & Deliverables
1. **Locale Updates (`src/locales/common.ts`)**:
   - Vietnamese (`commonVi`) and English (`commonEn`) translation keys for 404 and 403 pages.
2. **Styles (`src/styles/error-pages.css`)**:
   - Pure CSS variables from `src/styles/index.css`.
   - Responsive centering, card elevation, animated visual elements (Compass for 404, ShieldAlert for 403).
   - Mobile breakpoint optimizations.
3. **Components & Pages (`src/pages/NotFound.tsx`, `src/pages/Forbidden.tsx`)**:
   - `NotFound.tsx`: Big 404 visual, title, description, and single "Quay về trang chủ" button.
   - `Forbidden.tsx`: Big 403 visual, title, description, and single "Quay về trang chủ" button.
4. **Router & Guard Integration (`src/App.tsx`, `src/components/auth/ProtectedRoute.tsx`, `src/main.tsx`)**:
   - `ProtectedRoute.tsx` redirects unauthorized roles to `/403`.
   - `App.tsx` registers `/404`, `/not-found`, `/403`, `/unauthorized`, and wildcard `*`.
   - Global `LanguageProvider` lifted to app level for seamless i18n.
5. **Testing & Handoff**:
   - Test guide placed in `production_artifacts/fe_to_tester/FE_ERROR_PAGES_TEST_GUIDE.md`.
   - Verified via browser visual captures for both 404 and 403 pages.

## Definition of Done (DoD) Checklist
- [x] Code adheres strictly to `convention-fe.md` (no inline styles, CSS variables, React 19).
- [x] TypeScript builds without errors.
- [x] 404 Not Found & 403 Forbidden verified visually in the browser.
- [x] RBAC guard redirect verified.
- [x] Task file updated in `.agents/tasks/fe-primary/done/`.
- [x] Test guide documented in `production_artifacts/fe_to_tester/`.
