---
name: task-board
description: Skill for reading and updating the project task tracking files in the tasks/ directory using a file-based structure.
---

# Task Board Management Skill

This skill provides instructions on how to interact with the task tracking system in the `tasks/` directory.

## Board Structure
The project uses a File-Based Issue Tracking structure. Instead of one large YAML file, **every task is a separate YAML file**.
- `tasks/active/`: Contains files for active tasks (To Do, In Progress, In Review, Ready for Dev). Example: `tasks/active/FE-TASK-1.yaml`.
- `tasks/done/`: Contains files for completed tasks (Done). Example: `tasks/done/PM-TASK-1.yaml`.
- `tasks/bugs/`: Contains files for both active and fixed bugs. Example: `tasks/bugs/BUG-1.yaml`.

Example content for a task file (`tasks/active/BE-TASK-1.yaml`):
```yaml
id: BE-TASK-1
title: "Implement AI Grading for Writing"
assignee: "@be-primary"
status: "To Do"
priority: "High"
description: "Integrate with AI API to grade writing submissions."
```

## How to use this skill
When asked to read the board, check task status, or update a task/bug:
1. Use directory listing to see all files in `tasks/active/`, `tasks/done/`, or `tasks/bugs/`.
2. To create a new task, create a NEW `.yaml` file in `tasks/active/` with the filename matching the Task ID.
3. To update a task/bug, modify its corresponding `.yaml` file.
4. Always maintain valid YAML syntax.

## Rules
- **Moving to Done:** When a task is marked as "Done", you MUST use file moving commands to move the file from `tasks/active/` to `tasks/done/`.
- **Moving Fixed Bugs:** When a bug is fixed/resolved, update its status inside the file to `Fixed`. Leave it in the `tasks/bugs/` directory.
- **Never** delete a task file completely unless explicitly told to. If cancelled, mark status as "Cancelled".
- When an agent completes their part of a task and places their deliverable in `production_artifacts/`, they MUST update the task status and assignee inside the task file.
