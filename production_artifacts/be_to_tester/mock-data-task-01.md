# Task 1 — Mock Users and Profiles

## Run

From `backend/`:

```bash
./gradlew bootRun --args='--spring.profiles.active=dev,seed'
```

The `seed` profile is required. Each run truncates the seed tables and their
dependent rows with `RESTART IDENTITY CASCADE`, then recreates the data.

## Expected result

- `users`: 3 `ADMIN`, 8 `TEACHER`, 80 `STUDENT`.
- Exactly 4 users are `LOCKED`, and every locked user is a `STUDENT`.
- `teacher_profiles`: 8 rows, each linked to a `TEACHER`.
- `student_profiles`: 80 rows, each linked to a `STUDENT`.
- `student_code` values are unique and use the `SV000001` format.
- Email addresses are unique; admins use `@utc-polyglot.edu.vn`, teachers and
  students use `@gmail.com`.
- `date_of_birth` and `parent_phone` each have 12 null rows, selected
  independently.
- All generated student birth dates represent ages 15–25 on the run date.
- The common plaintext password is `Password123!` and is stored as BCrypt.

## Re-run check

Run the command twice. The second run must complete without a duplicate-key or
foreign-key error, and the runtime log must again show IDs beginning at 1.

The `docs/Datamock/` folder is reference-only and is intentionally excluded
from the implementation commit.
