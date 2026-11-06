---
name: daily-sync
description: A workflow to summarize the current project status, active PRs, handoffs, and sprint focus across all team members.
---

# Daily Sync Workflow

When triggered via `/daily-sync`, execute the following steps to provide an executive status update for the EnglishHub project across all roles and team members.

## Steps:
1. **Analyze Repository State & Git Status**:
   - Check current branch, unmerged branches, and recent commits.
   - If Trello MCP is available, query cards in `Ongoing` and `Review` lists on board `Project1`.
   - If GitHub MCP is available, query open Pull Requests targeting `develop`.

2. **Inspect Production Artifacts & Handoffs**:
   - Check latest specs and briefings in `production_artifacts/pm_to_dev/`.
   - Check pending developer handoffs in `production_artifacts/be_to_tester/` and `production_artifacts/fe_to_tester/`.
   - Check latest test reports and bug validations in `production_artifacts/test_reports/`.

3. **Analyze by Member & Role**:
   - Map active items to team members via [.agents/rules/git-user-mapping.md](file:///D:/Codin/utc-code/HK4_1/Project1/EnglishHub/.agents/rules/git-user-mapping.md).
   - Identify which cards are currently in `Ongoing`, which are in `Review` waiting for `@Zawn-Tsu`, and which have been verified to `Done`.

4. **Report Generation**: Output a clean Markdown table summarizing:
   - Progress per member: `Member (Role) | Active Branch / PR | Current Focus | Handoff Status`
   - Review Queue: PRs waiting for QA approval.
   - Blocker / Bug Alert: Any reported regressions or blockers.

5. **Action Items**: Recommend top priority action items for the team today.
