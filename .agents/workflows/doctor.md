---
name: doctor
description: Self-verification workflow validating Git conventions, frontend types & linting, and backend test suites before opening PR.
---

# Project Doctor Workflow

When triggered via `/doctor`, execute the following self-verification checks directly in the workspace to validate code health before opening a Pull Request:

## Steps:
1. **Git Conventions & Cleanliness Check**:
   - Check current branch name with `git rev-parse --abbrev-ref HEAD`.
     - Valid patterns: `feature/<ROLE>-<NUM>-<slug>`, `fix/<ROLE>-<NUM>-<slug>`, `develop`, `main`, `staging`, `docs/<slug>`.
   - Check working tree status with `git status --porcelain`.
   - Verify latest commit matches Conventional Commits (`type(ROLE-NUM): description`).

2. **Frontend Quality Check (if frontend files modified)**:
   - Run in `frontend/`:
     ```bash
     npm run test:ui:types
     npm run lint
     npm run test:ui
     ```

3. **Backend Quality Check (if backend files modified)**:
   - Run in `backend/`:
     ```bash
     ./gradlew classes
     ./gradlew test
     ```

4. **AI Service Quality Check (if ai-service files modified)**:
   - Run in `ai-service/`:
     ```bash
     pytest tests/ -q
     ```

5. **Output Scorecard**:
   - Present a clean markdown scorecard showing PASS/FAIL for each check.
   - If all checks pass: `STATUS: READY FOR PULL REQUEST (100% QUALITY GATE COMPLIANT)`.
