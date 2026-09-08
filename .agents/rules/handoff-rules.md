---
name: handoff-rules
description: Detailed rules for transferring deliverables between agents in the EnglishHub project.
---

# Handoff Rules

To ensure a smooth transition between different stages of development, all agents must adhere to the following handoff protocol using the `production_artifacts/` directory.

## 1. PM to Developer (@pm -> @fe / @be)
- **Artifact**: Requirement Specification (Markdown).
- **Location**: `production_artifacts/pm_to_dev/`
- **Action**: Update `tasks/board.yaml` status to `Ready for Dev`.

## 2. Backend to Frontend (@be -> @fe)
- **Artifact**: API Contract Updates.
- **Location**: `docs/api-contract.md`
- **Action**: Notify `@fe` that the API is ready for consumption.

## 3. Developer to Tester (@fe / @be -> @tester)
- **Artifact**: Build/Test Instructions.
- **Location**: `production_artifacts/fe_to_tester/` or `production_artifacts/be_to_tester/`
- **Action**: Update `tasks/board.yaml` status to `In Review`.

## 4. Tester to Dev / DevOps (@tester -> @fe / @be / @devops)
- **Artifact**: Test Reports / Bug Reports.
- **Location**: `production_artifacts/test_reports/`
- **Action**: 
  - If Passed: Update `tasks/board.yaml` to `Done` (Ready for DevOps).
  - If Failed: Update `tasks/board.yaml` to `To Do` / `In Progress` and assign back to the developer.
