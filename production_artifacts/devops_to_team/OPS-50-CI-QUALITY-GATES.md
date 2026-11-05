# Production Deliverable: OPS-50 CI Quality Gates & GitHub Rulesets

- **Task**: `[OPS-50] Xây dựng CI Quality Gates, Linter PR và cấu hình GitHub Ruleset bảo vệ nhánh`
- **Trello Card**: [https://trello.com/c/f9jq2eAU](https://trello.com/c/f9jq2eAU)
- **Author**: Hồ Việt Tùng (`@hotung9108` - DevOps & PM)
- **Target Integration**: `develop`

---

## 1. Summary of Changes

### 1.1. GitHub Rulesets & Branch Safety
- **`delete_branch_on_merge: false`**: Configured at repository level to prevent automatic source branch deletion upon merging PRs.
- **`IMMUTABLE-CORE-BRANCHES` (Ruleset ID: 26606359)**:
  - Applied to: `main`, `develop`, `staging`.
  - Rules: `deletion`, `non_fast_forward`.
  - Bypass actors: `[]` (0 bypass actors, 100% deletion protection).
- **`PROTECT-develop`, `PROJECT-staging`, `PROTECT-main`**:
  - Maintained 100% of existing review, status check, and merge method requirements.
  - Added Admin (`hotung9108`) to bypass actors for pull request rules.
  - Normal collaborators (`write` role) CANNOT self-merge; they require at least 1 approval from Tester (`@Zawn-Tsu`) or Admin.

### 1.2. CI/CD Workflows & Gates
1. **`.github/pull_request_template.md`**:
   - Standardized template enforcing Trello card link, GitHub issue reference, and DoD checklist.
2. **`.github/workflows/pr-convention-lint.yml`**:
   - Automated gate validating PR titles against Conventional Commits (`type(ROLE-NUM): desc`).
   - Validates source branch naming (`feature/ROLE-NUM-slug` or `fix/ROLE-NUM-slug`).
3. **`backend/build.gradle` & `.github/workflows/ci-backend.yml`**:
   - Applied JaCoCo plugin with minimum 80% coverage verification (`jacocoTestCoverageVerification`).
   - Generates and uploads JaCoCo XML/HTML reports as workflow artifacts.
4. **`frontend/vitest.config.ts` & `.github/workflows/ci-frontend.yml`**:
   - Expanded Vitest coverage across core pages and utilities.
   - Enforces 80% threshold and uploads Vitest coverage reports.
5. **`ai-service/requirements.txt` & `.github/workflows/ci-ai-service.yml`**:
   - Added `pytest-cov>=5.0.0` and `ruff>=0.4.0`.
   - Enforces Ruff linting and Pytest coverage gate (`--cov-fail-under=80`).
6. **`.github/workflows/security-scan.yml`**:
   - Preserves TruffleHog OSS secret scanning.
   - Adds frontend `npm audit` dependency security audit.
   - Adds automated Flyway migration filename format and integrity validation.
7. **`.github/workflows/staging-smoke-check.yml`**:
   - Automated post-deploy smoke check verifying Actuator `/actuator/health`, AI service `/health`, and frontend root.

---

## 2. Verification Summary
- **Frontend**: ESLint passed (`eslint .`), TypeScript typecheck passed (`tsc -b`), Vitest passed 752/752 tests with > 90% coverage. Vite production build passed.
- **Backend**: Gradle tasks compilation verified (`jacocoTestReport`, `jacocoTestCoverageVerification` active).
- **Rulesets**: Live verification confirmed `IMMUTABLE-CORE-BRANCHES` has 0 bypass actors, and core PR rulesets have Admin merge authority.
