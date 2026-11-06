---
name: pm-review-checklist
description: A checklist skill for the PM agent to ensure all requirements are met before approving a feature to Done.
---

# PM Review Checklist

Before approving a feature for release or confirming sprint completion, the `@pm` agent (`hotung9108`) must verify the following:

## Checklist
1. [ ] **Requirements Met**: Does the feature fulfill all requirements specified in the living spec (`docs/features/`)?
2. [ ] **AI Accuracy**: If it's a grading feature, has the AI output been tested and verified for reasonable accuracy?
3. [ ] **User Experience**: Is the flow intuitive for the target user (Teacher, Student, Admin)?
4. [ ] **QA Passed**: Is there a passing test report in `production_artifacts/test_reports/` and has `@Zawn-Tsu` approved the PR?
5. [ ] **Quality Gates Compliant**: Has Project Doctor (`/doctor`) passed with 0 errors?
6. [ ] **No Open Critical Bugs**: Verify that all related bugs or blocker issues on Trello/GitHub are resolved.

## Action
Only when all items are checked off can the `@pm` formally accept the feature and confirm the Trello card is ready for closing in `Done (Sprint X)`.
