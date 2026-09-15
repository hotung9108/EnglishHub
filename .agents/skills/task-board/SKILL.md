---
name: task-board
description: Skill for reading and updating the project task tracking files in .agents/tasks/ using a role-based folder structure.
---

# Task Board Management Skill

This skill provides instructions on how to interact with the role-based task tracking system in `.agents/tasks/`.

## Board Structure
To prevent Git merge conflicts between team members working concurrently, each role owns its dedicated directory:

```text
.agents/tasks/
├── pm/                 # Product Manager (hotung9108) -> active/ & done/
├── be-primary/         # Backend Primary (doanthaison2706) -> active/ & done/
├── be-secondary/       # Backend Secondary (tuanpham21105) -> active/ & done/
├── fe-primary/         # Frontend Primary (Maloque18705) -> active/ & done/
├── fe-secondary/       # Frontend Secondary -> active/ & done/
├── devops-primary/     # DevOps Primary (tuanpham21105) -> active/ & done/
├── devops-secondary/   # DevOps Secondary (hotung9108) -> active/ & done/
├── tester/             # QA / Tester (Zawn-Tsu) -> active/ & done/
└── bugs/               # Common Bug Reports (BUG-X.yaml)
```

## How to Use This Skill
1. **Identify User Role**: Run `git config user.name` or check `.agents/rules/git-user-mapping.md` to identify the current member's role and directory.
2. **Read Active Tasks**: Check `.agents/tasks/{role}/active/` for active tasks.
3. **Create New Task**:
   - PM creates tasks directly in the target role's directory, e.g. `.agents/tasks/be-primary/active/BE-TASK-2.yaml`.
4. **Update Status**:
   - Modify the YAML file in-place (e.g. change `status: "In Progress"`).
5. **Moving to Done**:
   - When finished, move the task file from `.agents/tasks/{role}/active/` to `.agents/tasks/{role}/done/`.

## Task File Format Example
```yaml
id: BE-TASK-1
title: "Implement AI Grading for Writing"
assignee: "@be-primary"
status: "In Progress"
priority: "High"
description: "Integrate with AI API to grade writing submissions."
```
