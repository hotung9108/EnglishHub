---
name: daily-sync
description: A workflow to summarize the current project status by reading the file-based task tracking directories and generating a report.
---

# Daily Sync Workflow

When triggered via `/daily-sync`, execute the following steps to provide a status update for the EnglishHub project.

## Steps:
1. **Read Task Files**: List and read all `.yaml` files in the following directories:
   - `tasks/active/` (active tasks)
   - `tasks/done/` (completed tasks)
   - `tasks/bugs/` (all bugs)
2. **Analyze**:
   - Count the total number of tasks in active vs done.
   - For bugs, count how many are active (To Do / In Progress) vs Fixed.
   - Identify any active tasks or bugs that are blocked or have been `In Progress` for an unusually long time.
   - Highlight high-priority active bugs.
3. **Report Generation**: Create a clear, concise summary report outlining the current sprint's progress by aggregating data from all these individual files.
4. **Action Items**: Suggest the next immediate actions for each agent (e.g., `@be-primary`, `@fe-secondary`) based on their assigned active tasks and bugs.
5. **Output**: Display the report to the user in the chat interface. Do not save it as a file unless requested.
