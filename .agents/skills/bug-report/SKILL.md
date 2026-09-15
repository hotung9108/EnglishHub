---
name: bug-report
description: Skill for logging and tracking bugs effectively in .agents/tasks/bugs/ using file-based issue tracking.
---

# Bug Reporting Skill

Use this skill when you need to report a bug found during testing or development.

## Bug Report Format
When logging a new bug, create a **NEW YAML file** in `.agents/tasks/bugs/`, for example `.agents/tasks/bugs/BUG-1.yaml`.

```yaml
id: BUG-1
title: "[Bug] AI grading returns 500 error for long audio files"
assignee: "@be-primary"
status: "To Do"
priority: "High"
description: |
  **Steps to Reproduce:**
  1. Upload an audio file > 5MB in the Speaking assignment.
  2. Click "Submit for Grading".
  
  **Expected Behavior:** The system should process the file or return a file size error gracefully.
  
  **Actual Behavior:** The server crashes with a 500 Internal Server Error.
```

## Instructions for Agents
1. **Identify**: Clearly identify the bug and gather reproduction steps.
2. **Log**: Create a new file in `.agents/tasks/bugs/BUG-X.yaml`.
3. **Assign**: Assign the bug to the relevant role (`@be-primary`, `@be-secondary`, `@fe-primary`, `@devops-*`) based on [.agents/rules/git-user-mapping.md](file:///d:/Codin/utc-code/HK4_1/Project1/EnglishHub/.agents/rules/git-user-mapping.md).
4. **Resolve**: When fixed and verified by QA (`@tester`), update the status inside the file to `Fixed`.
