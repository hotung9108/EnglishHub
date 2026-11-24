# Staging latency optimization (BUG-24 / BE-TASK-18) — tester handoff

## Scope

Backend-only performance work for `Home Server (VN) → Neon PostgreSQL (Singapore)`.
No API contract changed: same endpoints, same request/response shapes, same
authorization rules and messages.

Branch: `fix/OPS-40-query-optimize`

## What changed

| # | Change | Effect |
| - | ------ | ------ |
| 1 | New `application-prod.properties` (profile `prod` was active but had no file) | `show-sql`/`format_sql` off, `open-in-view=false`, log `INFO`/`WARN`, Hikari `12/2`, `keepalive-time=60s`, `max-lifetime=600s`, gzip on |
| 2 | Caffeine L1 cache `users` (TTL 5 min) | Authenticated requests stop paying 1–2 round-trips for the user + profile |
| 3 | Caffeine L1 cache `class-access` (TTL 1 min) | Class permission checks stop hitting the DB on every request |
| 4 | `ClassRepository.findAccess` — one native query (`classes` + `EXISTS class_members`) | Replaces `class.findById` + `classMember.exists` (2 round-trips → 1) |
| 5 | `COUNT(*) OVER ()` in `AssignmentJpaAdapter.findPage` | List pagination: `COUNT` + `SELECT` → 1 round-trip |
| 6 | `env.production.example`: `prepareThreshold=0&tcpKeepAlive=true` | PgBouncer transaction-mode safety + NAT keepalive |

### Cache invalidation (correctness-critical)

- `users` evicted on `userRepository.save(...)` and `deleteById(...)`.
- `class-access` evicted (all entries) on class `save`/`deleteById` and class-member `save`/`deleteById`.
- `users` entries are immutable snapshots; callers get `User.copy()`.

## Regression checks (must all still pass — behaviour identical)

1. **Authorization matrix for assignments** (`GET /api/v1/classes/{classId}/assignments`):
   - Owner teacher → `200`
   - Student who is a class member → `200`
   - Student not a member → `403`
   - Other teacher → `403`
   - Admin → `403`
   - Unknown `classId` → `404` with `{"error":"Không tìm thấy lớp học."}`
2. **Pagination**: `page`/`limit` still slice correctly and `pagination.total`
   reflects **all** matching rows (not just the current page). Verify with
   `limit=2` over 3 assignments: page 1 → 2 items, total 3; page 2 → 1 item, total 3.
3. **Status filter**: `?status=PUBLISHED` returns only published rows and `total`
   counts only published rows.
4. **Writes invalidate cache**:
   - Lock a user via admin API → that user's next request gets `401` immediately
     (not after TTL).
   - Add a student to a class via API → the student can immediately read the
     class's assignments.
   - Remove the member → access lost immediately.
5. **Empty class** → `data: []`, `pagination.total: 0`.
6. **Soft-deleted assignments** still excluded from list and `total`.

## Automated tests

```bash
cd backend
./gradlew test
```

Relevant suites:

```bash
./gradlew test \
  --tests '*AssignmentServiceTest' \
  --tests '*AssignmentApiIntegrationTest' \
  --tests '*AuthenticatedUserProviderTest' \
  --tests '*UserSnapshotCacheTest' \
  --tests '*ClassApiIntegrationTest'
```

- `AssignmentApiIntegrationTest` now asserts pagination `total` across pages, with
  a status filter, for an empty page, and `404` for an unknown class.
- `UserSnapshotCacheTest` proves the cache wiring: repeated lookups hit the
  repository once, negative (missing user) results are cached, eviction forces a reload.

Note: the Gradle `test` task disables caching (`app.cache.enabled=false`,
`spring.cache.type=none`) so `@Transactional` tests stay deterministic.
`UserSnapshotCacheTest` opts back in via `@SpringBootTest(properties=...)`.

## Performance verification (the actual goal)

Measure on staging **before** (current deployed image) and **after** deploy, per
endpoint, cache cold (> 1 min idle) and cache warm:

| Endpoint | Metric |
| --- | --- |
| `GET /api/v1/classes/{id}/assignments` | p50, p95, req/s |
| `GET /api/v1/assignments/{id}` | p50, p95 |
| `GET /api/v1/classes/{id}/members` | p50, p95 |
| `GET /api/v1/submission-modules/{id}/status` | p50, p95 |

Expected (per BUG-24 §4): 450–580ms → **~200–250ms**, 6–7 DB round-trips → **2**
(warm). If p95 is still > 200ms, report the numbers — the next step is folding the
`skills` query into the page query (1 round-trip) before considering Redis.

Also verify the deployed container no longer prints SQL per request:

```bash
docker logs englishhub-backend-staging --tail 50
```

(No `Hibernate: select ...` lines expected.)

## Deployment notes

The backend image must be rebuilt and pushed; the home server `.env` needs
`&prepareThreshold=0&tcpKeepAlive=true` appended to `DB_URL`. `@devops-primary`
owns that step.
