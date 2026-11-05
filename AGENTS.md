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
We use a shared `production_artifacts/` directory and Spec-Driven Development (SDD) for passing deliverables between roles. Comprehensive Trello and GitHub synchronization rules are defined in [docs/guidelines/TRELLO_GITHUB_CONVENTION.md](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/docs/guidelines/TRELLO_GITHUB_CONVENTION.md), [docs/guidelines/DEVELOPER_DOCTOR_GUIDE.md](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/docs/guidelines/DEVELOPER_DOCTOR_GUIDE.md), and [.agents/rules/trello-github-rules.md](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/.agents/rules/trello-github-rules.md).
- **@pm** creates requirement specs (`docs/features/*.md`), creates cards on Trello (`Product Backlog` -> `Sprint Backlog`), and drops summarized tasks into `production_artifacts/pm_to_dev/`.
- **@be-primary** and **@be-secondary** read from `production_artifacts/pm_to_dev/`, implement APIs following DDD (`convention-be.md`), develop/integrate AI capabilities following `convention-ai.md`, run Project Doctor (`/doctor`), and place backend testing instructions in `production_artifacts/be_to_tester/`.
- **@fe-primary** and **@fe-secondary** implement UI/UX and integrate APIs following `convention-fe.md`, run Project Doctor, and drop build/test instructions in `production_artifacts/fe_to_tester/`.
- **@tester** reads from `be_to_tester` and `fe_to_tester`, verifies against requirements, writes test reports in `production_artifacts/test_reports/`. **Only @tester has the authority to approve PRs and move Trello cards to `Done (Sprint X)`**.
- **@devops-primary** and **@devops-secondary** manage staging/production environments, GitHub Rulesets (`IMMUTABLE-CORE-BRANCHES`), and CI/CD quality gates.

Tasks and backlogs are managed exclusively on Trello board `Project1` and GitHub PRs. Member mapping is defined in [.agents/rules/git-user-mapping.md](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/.agents/rules/git-user-mapping.md).

## 3. Git Flow & Conventions
Detailed conventions are codified in [docs/guidelines/TRELLO_GITHUB_CONVENTION.md](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/docs/guidelines/TRELLO_GITHUB_CONVENTION.md):
- `main`: Production-ready code.
- `staging`: Staging pre-production environment.
- `develop`: Integration branch for features and fixes.
- `feature/<ROLE>-<NUMBER>-<slug>`: For new features (e.g., `feature/FE-40-teacher-grading-studio`).
- `fix/<ROLE>-<NUMBER>-<slug>`: For bugfixes (e.g., `fix/BE-64-soft-deleted-account-token-issuance`).
- `docs/<slug>`: For documentation updates.
Commit messages must follow Conventional Commits (e.g., `feat(BE-66): dispatch auto grading when final submit finalizes modules`).

## 4. Definition of Done (DoD)
A task is ONLY considered Done when:
- Project Doctor (`/doctor`) passes 100% Quality Gates.
- Code compiles and runs without errors.
- Unit tests are written and passing (Code coverage > 80%).
- Code has been linted and formatted.
- Pull Request targeting `develop` is opened and linked to the Trello card.
- Trello card is moved to `Review` (automatically via GitHub Actions or manually) with a comment calling `@Zawn-Tsu` to test.
- **Tester (`@Zawn-Tsu`) has re-tested, confirmed pass, approved the PR, and moved the Trello card to `Done (Sprint X)`**.
- Relevant documentation (`docs/`) is updated.
- Necessary artifacts are placed in `production_artifacts/` for the next agent.
- Strictly follow [.agents/private/rules/no-auto-commit-push.md](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/.agents/private/rules/no-auto-commit-push.md): NEVER commit or push without explicit user command.
