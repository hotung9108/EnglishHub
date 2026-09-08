---
name: bug-report
description: Skill for logging and tracking bugs effectively using the file-based issue tracking system.
---

# Bug Reporting Skill

Use this skill when you need to report a bug found during testing or development.

## Bug Report Format
When logging a new bug, create a **NEW YAML file** in the `tasks/bugs/` directory, for example `tasks/bugs/BUG-1.yaml`.

Use the following structure for the file content:

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
1. **Identify**: Clearly identify the bug and gather necessary logs or reproduction steps.
2. **Log**: Create a new file in `tasks/bugs/BUG-X.yaml`. Ensure the ID and filename follow the `BUG-X` format and are unique.
3. **Assign**: Assign the bug to the relevant agent (e.g., `@fe-primary`, `@be-secondary`, or `@devops`) and set an appropriate priority (`Low`, `Medium`, `High`, `Critical`).
4. **Resolve**: When a bug is successfully fixed and verified, modify the file to change the status to `Fixed`.
