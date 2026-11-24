---
name: task-board
description: Skill for reading and querying project tasks and sprint status from Trello and living specifications.
---

# Task Board Management Skill

This skill provides instructions on how to interact with the project task tracking system in EnglishHub.

## Single Source of Truth
Tasks, sprints, and issues are managed exclusively on:
1. **Trello Board `Project1`**: `Product Backlog`, `Sprint Backlog`, `Ongoing`, `Review`, `Done (Sprint X)`.
2. **GitHub Pull Requests & Issues**: Linking feature branches (`feature/ROLE-NUM-*`) to develop.
3. **Living Feature Specs**: `docs/features/` and task briefings in `production_artifacts/pm_to_dev/`.

## How to Use This Skill
1. **Identify User Role**: Run `git config user.name` or check [.agents/rules/git-user-mapping.md](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/.agents/rules/git-user-mapping.md) to identify the current member's role and assigned branch prefix.
2. **Read Active Tasks**:
   - Check Trello `Ongoing` or `Sprint Backlog` list for assigned cards.
   - Read briefing in `production_artifacts/pm_to_dev/`.
3. **Self-Verification**:
   - Run Project Doctor (`/doctor`).
4. **Moving to Review**:
   - Open PR targeting `develop` with title `feat(ROLE-NUM): ...`.
   - The automated GitHub Actions Trello Bot (`.github/workflows/trello-sync.yml`) moves the card to `Review` and tags `@zawntsu`.
5. **Moving to Done**:
   - Only `@tester` (`Zawn-Tsu`) has authority to approve the PR and move the card to `Done (Sprint X)`.
