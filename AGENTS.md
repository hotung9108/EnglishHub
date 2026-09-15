---
name: EnglishHub AGENTS rules
description: General rules, conventions, git flow, DoD, and handoff rules for the EnglishHub project.
---

# EnglishHub Project Guidelines

This file contains the general rules, conventions, Definition of Done (DoD), and handoff procedures for all agents working on the **EnglishHub** project.

## 1. Project Overview
**EnglishHub** is a web-based platform for managing English assignments and grading. 
- **Core Features**: Teacher assignment creation, opening/closing exercises, AI-assisted grading and correction (Listening, Speaking, Reading, Writing).
- **Student Features**: Submitting assignments, reviewing corrections, tracking online results.
- **Management Features**: Basic management of students, classes, scores, and an Admin module for account management.

## 2. Agent Handoff Rules & Production Artifacts
We use a shared `production_artifacts/` directory for passing deliverables between roles.
- **@pm** creates requirement specs (`docs/features/*.md`) and drops summarized tasks into `production_artifacts/pm_to_dev/`.
- **@be-primary** and **@be-secondary** read from `production_artifacts/pm_to_dev/`, implement APIs following DDD, and place backend testing instructions in `production_artifacts/be_to_tester/`. (Note: Formal `docs/api-contract.md` will be published once backend stabilizes).
- **@fe-primary** and **@fe-secondary** implement UI/UX and integrate APIs following `convention-fe.md`, and drop build/test instructions in `production_artifacts/fe_to_tester/`.
- **@tester** reads from `be_to_tester` and `fe_to_tester`, writes automated tests or manual test reports, and drops results in `production_artifacts/test_reports/`.
- **@devops-primary** and **@devops-secondary** pick up verified code, manage staging/production environments, and handle CI/CD deployment logic.

Always update the appropriate task tracking file in `.agents/tasks/{role}/active/`, `.agents/tasks/{role}/done/`, or `.agents/tasks/bugs/` (using the `task-board` skill). Member mapping is defined in [.agents/rules/git-user-mapping.md](file:///d:/Codin/utc-code/HK4_1/Project1/EnglishHub/.agents/rules/git-user-mapping.md).

## 3. Git Flow
- `main`: Production-ready code.
- `develop`: Integration branch for features.
- `feature/*`: For new features (e.g., `feature/ai-grading`).
- `bugfix/*`: For fixing bugs.
Commit messages must follow Conventional Commits (e.g., `feat(grading): add AI grading integration`).

## 4. Definition of Done (DoD)
- Code compiles and runs without errors.
- Unit tests are written and passing (Code coverage > 80%).
- Code has been linted and formatted.
- Task file is moved from `.agents/tasks/{role}/active/` to `.agents/tasks/{role}/done/` to reflect the `Done` status.
- Relevant documentation (`docs/`) is updated.
- Necessary artifacts are placed in `production_artifacts/` for the next agent.
