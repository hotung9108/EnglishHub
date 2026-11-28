\set ON_ERROR_STOP on

SELECT CASE
           WHEN lower(current_database()) ~ '(production|prod|live)' THEN 'true'
           ELSE 'false'
       END AS be92_has_unsafe_marker
\gset

\if :be92_has_unsafe_marker
    DO $$
    DECLARE
        unsafe_marker text := substring(lower(current_database()) FROM '(production|prod|live)');
    BEGIN
        RAISE EXCEPTION 'Từ chối database "%": tên chứa marker nguy hiểm "%".',
            current_database(), unsafe_marker;
    END
    $$;
\endif

-- Chỉ đọc biến token sau guard; biến chưa định nghĩa nghĩa là dry-run, chuỗi rỗng là lỗi.
\if :{?BE92_CONFIRM_DELETE}
    SELECT CASE WHEN :'BE92_CONFIRM_DELETE' = '' THEN 'true' ELSE 'false' END
               AS be92_token_is_empty,
           CASE
               WHEN :'BE92_CONFIRM_DELETE' = 'DELETE_BE92_DATA:' || current_database() THEN 'true'
               ELSE 'false'
           END AS be92_token_is_valid,
           CASE
               WHEN left(:'BE92_CONFIRM_DELETE', length('DELETE_BE92_DATA:')) = 'DELETE_BE92_DATA:'
                    AND :'BE92_CONFIRM_DELETE' <> 'DELETE_BE92_DATA:'
                   THEN 'true'
               ELSE 'false'
           END AS be92_token_has_db_name
    \gset

    \if :be92_token_is_empty
        DO $$
        BEGIN
            RAISE EXCEPTION 'BE92_CONFIRM_DELETE được truyền nhưng rỗng; cần token chính xác DELETE_BE92_DATA:% cho database này.',
                current_database();
        END
        $$;
    \else
        \if :be92_token_is_valid
            \set BE92_DELETE_REQUESTED true
        \else
            \if :be92_token_has_db_name
                DO $$
                BEGIN
                    RAISE EXCEPTION 'BE92_CONFIRM_DELETE có tên database khác; database hiện tại là "%", cần token DELETE_BE92_DATA:%.',
                        current_database(), current_database();
                END
                $$;
            \else
                DO $$
                BEGIN
                    RAISE EXCEPTION 'BE92_CONFIRM_DELETE sai hoặc sai hoa thường; cần token chính xác DELETE_BE92_DATA:% cho database này.',
                        current_database();
                END
                $$;
            \endif
        \endif
    \endif
\else
    \set BE92_DELETE_REQUESTED false
\endif

-- Kiểm tra đủ 16 bảng và 14 sequence cần thiết trong schema public.
WITH expected_objects(object_type, object_name) AS (
    VALUES
        ('table', 'users'),
        ('table', 'teacher_profiles'),
        ('table', 'student_profiles'),
        ('table', 'classes'),
        ('table', 'class_members'),
        ('table', 'assignments'),
        ('table', 'modules'),
        ('table', 'questions'),
        ('table', 'submissions'),
        ('table', 'submission_modules'),
        ('table', 'answers'),
        ('table', 'answer_annotations'),
        ('table', 'gradings'),
        ('table', 'refresh_tokens'),
        ('table', 'student_evaluations'),
        ('table', 'grading_change_logs'),
        ('sequence', 'users_id_seq'),
        ('sequence', 'classes_id_seq'),
        ('sequence', 'class_members_id_seq'),
        ('sequence', 'assignments_id_seq'),
        ('sequence', 'modules_id_seq'),
        ('sequence', 'questions_id_seq'),
        ('sequence', 'submissions_id_seq'),
        ('sequence', 'submission_modules_id_seq'),
        ('sequence', 'answers_id_seq'),
        ('sequence', 'answer_annotations_id_seq'),
        ('sequence', 'gradings_id_seq'),
        ('sequence', 'refresh_tokens_id_seq'),
        ('sequence', 'student_evaluations_id_seq'),
        ('sequence', 'grading_change_logs_id_seq')
), missing_objects AS (
    SELECT expected.object_type, expected.object_name
    FROM expected_objects AS expected
    WHERE NOT EXISTS (
        SELECT 1
        FROM pg_catalog.pg_class AS c
        JOIN pg_catalog.pg_namespace AS n
            ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = expected.object_name
          AND (
              (expected.object_type = 'table' AND c.relkind IN ('r', 'p'))
              OR (expected.object_type = 'sequence' AND c.relkind = 'S')
          )
    )
), preflight AS (
    SELECT count(*) AS missing_count,
           coalesce(
               string_agg(
                   object_type || ' public.' || object_name,
                   ', ' ORDER BY object_type, object_name
               ),
               ''
           ) AS missing_list
    FROM missing_objects
)
SELECT CASE WHEN missing_count = 0 THEN 'true' ELSE 'false' END AS be92_preflight_ok,
       format(
           'BEGIN RAISE EXCEPTION %L; END',
           'Preflight thất bại; thiếu các đối tượng bắt buộc: ' || missing_list
       ) AS be92_preflight_raise_body
FROM preflight
\gset

\if :be92_preflight_ok
    \echo Preflight OK: đủ bảng và sequence yêu cầu.
\else
    DO :'be92_preflight_raise_body';
\endif

\if :BE92_DELETE_REQUESTED
    DO $$
    DECLARE
        other_sessions bigint;
    BEGIN
        SELECT count(*) INTO other_sessions
        FROM pg_catalog.pg_stat_activity
        WHERE datname = current_database()
          AND pid <> pg_backend_pid();

        IF other_sessions > 0 THEN
            RAISE EXCEPTION 'Từ chối xóa: database còn % session khác.', other_sessions;
        END IF;
    END
    $$;

BEGIN;
-- Một kết nối có thể đến sau guard. Giới hạn thời gian chờ mỗi lock.
SET LOCAL lock_timeout = '2s';

DO $$
BEGIN
    IF to_regclass('public.flyway_schema_history') IS NULL THEN
        RAISE EXCEPTION 'Thiếu public.flyway_schema_history; không thể chụp lịch sử Flyway.';
    END IF;
END
$$;

CREATE TEMP TABLE be92_flyway_before AS
TABLE public.flyway_schema_history;

TRUNCATE TABLE
  public.grading_change_logs,
  public.student_evaluations,
  public.answer_annotations,
  public.gradings,
  public.answers,
  public.class_members,
  public.refresh_tokens,
  public.submission_modules,
  public.submissions,
  public.questions,
  public.modules,
  public.assignments,
  public.classes,
  public.teacher_profiles,
  public.student_profiles,
  public.users
RESTART IDENTITY RESTRICT;

DO $$
DECLARE
    table_name text;
    sequence_name text;
    row_count bigint;
    sequence_last_value bigint;
    sequence_is_called boolean;
    sequence_start bigint;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'grading_change_logs', 'student_evaluations', 'answer_annotations',
        'gradings', 'answers', 'class_members', 'refresh_tokens',
        'submission_modules', 'submissions', 'questions', 'modules',
        'assignments', 'classes', 'teacher_profiles', 'student_profiles', 'users'
    ] LOOP
        EXECUTE format('SELECT count(*) FROM public.%I', table_name) INTO row_count;
        IF row_count <> 0 THEN
            RAISE EXCEPTION 'Hậu kiểm thất bại: public.% còn % dòng.', table_name, row_count;
        END IF;
    END LOOP;

    FOREACH sequence_name IN ARRAY ARRAY[
        'grading_change_logs_id_seq', 'student_evaluations_id_seq',
        'answer_annotations_id_seq', 'gradings_id_seq', 'answers_id_seq',
        'class_members_id_seq', 'refresh_tokens_id_seq', 'submission_modules_id_seq',
        'submissions_id_seq', 'questions_id_seq', 'modules_id_seq',
        'assignments_id_seq', 'classes_id_seq', 'users_id_seq'
    ] LOOP
        SELECT seqstart INTO STRICT sequence_start
        FROM pg_catalog.pg_sequence
        WHERE seqrelid = format('public.%I', sequence_name)::regclass;

        EXECUTE format('SELECT last_value, is_called FROM public.%I', sequence_name)
            INTO sequence_last_value, sequence_is_called;

        IF sequence_last_value IS DISTINCT FROM sequence_start
            OR sequence_is_called IS DISTINCT FROM false THEN
            RAISE EXCEPTION 'Hậu kiểm thất bại: public.% có last_value=%, is_called=%, kỳ vọng last_value=%, is_called=false.',
                sequence_name, sequence_last_value, sequence_is_called, sequence_start;
        END IF;
    END LOOP;

    IF (SELECT count(*) FROM public.flyway_schema_history)
        <> (SELECT count(*) FROM pg_temp.be92_flyway_before)
        OR EXISTS (TABLE public.flyway_schema_history EXCEPT ALL TABLE pg_temp.be92_flyway_before)
        OR EXISTS (TABLE pg_temp.be92_flyway_before EXCEPT ALL TABLE public.flyway_schema_history) THEN
        RAISE EXCEPTION 'Hậu kiểm thất bại: public.flyway_schema_history khác bản chụp.';
    END IF;
END
$$;

COMMIT;
\echo Đã làm sạch 16 bảng và đặt lại 14 sequence.
\else
-- Dry-run: đếm chính xác các dòng trong cùng một truy vấn chỉ đọc.
\echo Chế độ dry-run: số dòng hiện tại của 16 bảng nghiệp vụ.
SELECT 'users' AS table_name, count(*) AS row_count FROM public.users
UNION ALL
SELECT 'teacher_profiles', count(*) FROM public.teacher_profiles
UNION ALL
SELECT 'student_profiles', count(*) FROM public.student_profiles
UNION ALL
SELECT 'classes', count(*) FROM public.classes
UNION ALL
SELECT 'class_members', count(*) FROM public.class_members
UNION ALL
SELECT 'assignments', count(*) FROM public.assignments
UNION ALL
SELECT 'modules', count(*) FROM public.modules
UNION ALL
SELECT 'questions', count(*) FROM public.questions
UNION ALL
SELECT 'submissions', count(*) FROM public.submissions
UNION ALL
SELECT 'submission_modules', count(*) FROM public.submission_modules
UNION ALL
SELECT 'answers', count(*) FROM public.answers
UNION ALL
SELECT 'answer_annotations', count(*) FROM public.answer_annotations
UNION ALL
SELECT 'gradings', count(*) FROM public.gradings
UNION ALL
SELECT 'refresh_tokens', count(*) FROM public.refresh_tokens
UNION ALL
SELECT 'student_evaluations', count(*) FROM public.student_evaluations
UNION ALL
SELECT 'grading_change_logs', count(*) FROM public.grading_change_logs;
\endif
