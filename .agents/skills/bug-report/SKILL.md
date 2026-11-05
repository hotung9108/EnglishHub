---
name: bug-report
description: Skill for logging and tracking bugs effectively using Trello and GitHub issues.
---

# Bug Reporting Skill

Use this skill when you need to report a bug found during testing or development.

## Bug Report Protocol
Bugs in EnglishHub are tracked via:
1. **GitHub Issues**: Logged with the label `bug` and linking to the affected component.
2. **Trello Cards**: Created on board `Project1` with tag `[<ROLE>-<NUM>][ISSUE #<NUM>] <Mô tả lỗi>` and label `Bug`.
3. **Test Reports**: Documented in `production_artifacts/test_reports/QA-<NUM>/` with full reproduction steps.

## Bug Format Example
```markdown
### Bug Description
[Bug] AI grading returns 500 error for long audio files

### Environment
- Branch: feature/BE-74-audio-upload
- Staging / Local: Local Docker

### Steps to Reproduce
1. Upload an audio file > 5MB in the Speaking assignment.
2. Click "Submit for Grading".

### Expected Behavior
The system should process the file or return a 413 Payload Too Large error gracefully.

### Actual Behavior
The server crashes with a 500 Internal Server Error.
```

## Instructions for Agents
1. **Identify**: Clearly identify the bug and gather exact reproduction steps, logs, and screenshots.
2. **Log**: Post the issue on GitHub / Trello card or update the PR review comment with changes requested.
3. **Assign**: Assign the bug to the relevant role (`@be-primary`, `@be-secondary`, `@fe-primary`, `@devops-*`) based on [.agents/rules/git-user-mapping.md](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/.agents/rules/git-user-mapping.md).
4. **Resolve**: When fixed and verified by QA (`@tester`), close the issue and update the Trello card.
