---
id: TASK-FE-SPA-ROUTING-FALLBACK
title: "Fix SPA Fallback Routing on Vercel Hosting (404 on Refresh/Direct URL Access)"
role: fe-primary
assignee: Maloque18705
status: "Done"
created_at: 2026-10-16T23:20:00+07:00
updated_at: 2026-10-16T23:25:00+07:00
completed_at: 2026-10-16T23:25:00+07:00
priority: High
tags: [frontend, devops, hosting, vercel, spa, routing, 404, fallback]
---

# TASK-FE-SPA-ROUTING-FALLBACK: Fix SPA Fallback Routing on Vercel Hosting

## 1. Problem Description
- Bug reports from QA-29 (`QA29-039`, `QA29-042`) identified that hard refreshing (F5 / Ctrl+R) or opening direct sub-paths (e.g. `/teacher/profile`, `/teacher/classes/126/progress`) returned a generic hosting error: `404: NOT_FOUND This page could not be found`.
- While client-side navigation via React Router worked seamlessly, Vercel edge lacked SPA fallback rules to rewrite sub-routes to `index.html`.

## 2. Solution Implemented
1. **Added `frontend/vercel.json`**:
   - Defined `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }` to route all non-static requests to `index.html`.
   - Preserves static asset routing and ensures backend API at `api-staging.hotung9108.me` remains unaffected.
2. **Updated DevOps Documentation**:
   - Updated `docs/devops/HOTUNG9108_ME_SETUP_GUIDE.md` (Step 5) with instructions regarding Vercel SPA rewrites.
3. **Prepared QA Handoff**:
   - Created `production_artifacts/fe_to_tester/FE_SPA_ROUTING_FALLBACK_TEST_GUIDE.md` detailing retest scenarios (TC-SPA-01 to TC-SPA-05).

## 3. Verification
- `npm run build` executed successfully without errors.
- `npm run test` passed 99/99 test cases.
