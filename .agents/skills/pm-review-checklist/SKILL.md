---
name: pm-review-checklist
description: A checklist skill for the PM agent to ensure all requirements are met before approving a feature to Done.
---

# PM Review Checklist

Before moving a task to `done/` or approving a feature for release, the `@pm` agent (`hotung9108`) must verify the following:

## Checklist
1. [ ] **Requirements Met**: Does the feature fulfill all requirements specified in the spec (`docs/features/`)?
2. [ ] **AI Accuracy**: If it's a grading feature, has the AI output been tested and verified for reasonable accuracy?
3. [ ] **User Experience**: Is the flow intuitive for the target user (Teacher, Student, Admin)?
4. [ ] **QA Passed**: Is there a passing test report in `production_artifacts/test_reports/`?
5. [ ] **No Open Critical Bugs**: Verify that all related bugs in `.agents/tasks/bugs/` are marked as `Fixed`.

## Action
Only when all items are checked off can the `@pm` formally accept the feature and ensure the task file is moved to the target role's `done/` folder (e.g. `.agents/tasks/{role}/done/`).
