---
name: daily-sync
description: A workflow to summarize the current project status by reading role-based tasks in .agents/tasks/ and generating an executive report.
---

# Daily Sync Workflow

When triggered via `/daily-sync`, execute the following steps to provide a status update for the EnglishHub project across all roles and team members.

## Steps:
1. **Read Task Files**: List and read all `.yaml` files in `.agents/tasks/`:
   - `.agents/tasks/pm/` (`active/` & `done/`)
   - `.agents/tasks/be-primary/` (`active/` & `done/`)
   - `.agents/tasks/be-secondary/` (`active/` & `done/`)
   - `.agents/tasks/fe-primary/` (`active/` & `done/`)
   - `.agents/tasks/fe-secondary/` (`active/` & `done/`)
   - `.agents/tasks/devops-primary/` (`active/` & `done/`)
   - `.agents/tasks/devops-secondary/` (`active/` & `done/`)
   - `.agents/tasks/tester/` (`active/` & `done/`)
   - `.agents/tasks/bugs/` (active vs fixed)

2. **Analyze by Member & Role**:
   - Map each directory to the team member via [.agents/rules/git-user-mapping.md](file:///d:/Codin/utc-code/HK4_1/Project1/EnglishHub/.agents/rules/git-user-mapping.md).
   - Summarize active vs completed tasks per member.
   - For bugs, count active (To Do / In Progress) vs Fixed. Highlight High/Critical priority bugs.

3. **Report Generation**: Output a clean Markdown table summarizing:
   - Progress per member: `Member (Role) | Active Tasks | Done Tasks | Current Focus`
   - Active bugs requiring attention.

4. **Action Items**: Suggest immediate next steps for each member today.
5. **Output**: Display the report directly in the chat interface.
