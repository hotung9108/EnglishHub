---
name: handoff-rules
description: Detailed rules for transferring deliverables between agents in the EnglishHub project using role-based tasks.
---

# Handoff Rules

To ensure a smooth transition between different stages of development and prevent Git merge conflicts, all agents must adhere to the following handoff protocol using `production_artifacts/` and `.agents/tasks/{role}/`.

## 1. PM to Developer (@pm -> @fe-* / @be-*)
- **Artifact**: Requirement Specification (Markdown).
- **Location**: `production_artifacts/pm_to_dev/` (and specs in `docs/features/`).
- **Action**: Create the corresponding task file in the developer's active folder, e.g., `.agents/tasks/be-primary/active/BE-TASK-X.yaml` with `status: "To Do"`.

## 2. Backend to Frontend (@be-* -> @fe-*)
- **Artifact**: DTO specifications and endpoint details. (Official API contract in `docs/api-contract.md` will follow when backend core is completed).
- **Location**: `production_artifacts/be_to_tester/` or shared code interfaces.
- **Action**: Notify `@fe-*` that endpoints are ready for integration.

## 3. Developer to Tester (@fe-* / @be-* -> @tester)
- **Artifact**: Build/Test Instructions.
- **Location**: `production_artifacts/fe_to_tester/` or `production_artifacts/be_to_tester/`.
- **Action**: Update developer's task `status: "In Review"`.

## 4. Tester to Dev / DevOps (@tester -> @fe-* / @be-* / @devops-*)
- **Artifact**: Test Reports / Bug Reports.
- **Location**: `production_artifacts/test_reports/` and `.agents/tasks/bugs/BUG-X.yaml`.
- **Action**: 
  - If Passed: Move the task file from `.agents/tasks/{role}/active/` to `.agents/tasks/{role}/done/`.
  - If Failed: Log bug in `.agents/tasks/bugs/BUG-X.yaml` or set task status back to `In Progress` with reproduction steps.

## 5. Verified Code to DevOps (@tester -> @devops-*)
- **Artifact**: Verified release candidate ready for deployment.
- **Action**: DevOps pulls the code, tests containers via `docker-compose.prod.yml`, and verifies the CD deployment pipeline.
