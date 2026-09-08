---
name: pm-review-checklist
description: A checklist skill for the PM agent to ensure all requirements are met before closing a feature.
---

# PM Review Checklist

Before moving a task to `Done` or approving a feature for production, the `@pm` agent must verify the following:

## Checklist
1. [ ] **Requirements Met**: Does the feature fulfill all requirements specified in the original Use Case (`docs/features/`)?
2. [ ] **AI Accuracy**: If it's a grading feature, has the AI output been tested and verified for reasonable accuracy?
3. [ ] **User Experience**: Is the flow intuitive for the target user (Teacher, Student, Admin)?
4. [ ] **Documentation**: Are the user guides or API contracts updated accordingly?
5. [ ] **QA Passed**: Is there a passing test report in `production_artifacts/test_reports/`?

## Action
Only when all items are checked off can the `@pm` formally accept the feature and ensure `tasks/board.yaml` reflects the final state.
