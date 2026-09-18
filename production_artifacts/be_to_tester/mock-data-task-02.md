# Task 2 — Mock Classes and Class Members

## Run

From `backend/`:

```bash
./gradlew bootRun --args='--spring.profiles.active=dev,seed'
```

The shared `seed` profile runs Task 1 first (`@Order(1)`) and Task 2 second
(`@Order(2)`). Task 2 reads the teacher and student profiles created by Task 1.

## Expected result

- `classes`: 6 rows — 4 `ACTIVE`, 1 `COMPLETED`, and 1 `CANCELLED`.
- Exactly 1 class has `teacher_id IS NULL`; every other teacher ID references a
  row in `teacher_profiles`.
- Every non-cancelled class has 15–20 members.
- The cancelled class has 1 member.
- Every student ID references a row in `student_profiles`.
- There are no duplicate `(class_id, student_id)` pairs.
- The completed class has `end_date < CURRENT_DATE`.

## Re-run check

Run the command twice. Task 2 truncates only `class_members` and `classes` with
`RESTART IDENTITY CASCADE`; it does not truncate `users` or either profile
table. Class IDs should start at 1 again on the second run.

The `docs/Datamock/` folder is reference-only and is intentionally excluded
from the implementation commit.
