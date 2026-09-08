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
- **@be-primary** and **@be-secondary** read from `production_artifacts/pm_to_dev/`, implement APIs, update `docs/api-contract.md`, and place backend testing instructions in `production_artifacts/be_to_tester/`.
- **@fe-primary** and **@fe-secondary** read from `docs/api-contract.md` and UI mocks, implement the frontend, and drop build/test instructions in `production_artifacts/fe_to_tester/`.
- **@tester** reads from `be_to_tester` and `fe_to_tester`, writes automated tests or manual test reports, and drops results in `production_artifacts/test_reports/`.
- **@devops-primary** and **@devops-secondary** pick up verified code, manage staging/production environments, and handle CI/CD deployment logic.

Always update the appropriate task tracking file in `tasks/active/`, `tasks/done/`, or `tasks/bugs/` (using the `task-board` skill) to reflect the current state of tasks when a handoff occurs.

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
- Task file is moved from `tasks/active/` to `tasks/done/` to reflect the `Done` status.
- Relevant documentation (`docs/`) is updated.
- Necessary artifacts are placed in `production_artifacts/` for the next agent.
