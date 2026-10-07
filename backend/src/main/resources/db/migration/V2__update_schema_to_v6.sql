-- ============================================================
-- V2: Update schema from V1 to current DB design (V6 on paper)
-- ============================================================

-- ============================================================
-- 1. CLASS MEMBERS
--    V6 removes member_type, status and DB-level business
--    uniqueness constraints.
-- ============================================================

DROP INDEX IF EXISTS uq_class_members_one_active_primary_per_student;

ALTER TABLE class_members
    DROP CONSTRAINT IF EXISTS uq_class_members_class_student;

ALTER TABLE class_members
    DROP COLUMN IF EXISTS member_type,
    DROP COLUMN IF EXISTS status;

DROP TYPE IF EXISTS class_member_type;
DROP TYPE IF EXISTS class_member_status;


-- ============================================================
-- 2. CLASSES
--    V1: VARCHAR(20)
--    V6: class_status ENUM NOT NULL DEFAULT 'ACTIVE'
-- ============================================================

CREATE TYPE class_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'COMPLETED',
    'CANCELLED'
);

ALTER TABLE classes
    ALTER COLUMN status DROP DEFAULT;

ALTER TABLE classes
    ALTER COLUMN status TYPE class_status
    USING status::class_status;

ALTER TABLE classes
    ALTER COLUMN status SET DEFAULT 'ACTIVE';

ALTER TABLE classes
    ALTER COLUMN status SET NOT NULL;


-- ============================================================
-- 3. ASSIGNMENTS
--    V6 removes teacher_id and introduces assignment status.
-- ============================================================

CREATE TYPE assignment_status AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'CLOSED'
);

ALTER TABLE assignments
    DROP CONSTRAINT IF EXISTS chk_assignments_open_before_close;

DROP INDEX IF EXISTS idx_assignments_teacher_id;

ALTER TABLE assignments
    DROP CONSTRAINT IF EXISTS assignments_teacher_id_fkey;

ALTER TABLE assignments
    DROP COLUMN IF EXISTS teacher_id;

ALTER TABLE assignments
    ADD COLUMN status assignment_status NOT NULL DEFAULT 'DRAFT';


-- ============================================================
-- 4. MODULES
--    V6 adds AI instruction.
-- ============================================================

ALTER TABLE modules
    ADD COLUMN ai_instruction TEXT;


-- ============================================================
-- 5. QUESTIONS
--    V6 requires correct_answer.
--    Content remains TEXT; correct_answer stores JSON TEXT.
-- ============================================================

ALTER TABLE questions
    ALTER COLUMN correct_answer SET NOT NULL;


-- ============================================================
-- 6. SUBMISSION MODULES
--    V6 removes audio_play_count.
-- ============================================================

ALTER TABLE submission_modules
    DROP COLUMN IF EXISTS audio_play_count;


-- ============================================================
-- 7. ANSWER ANNOTATIONS
--    Offset validation is handled by service layer in V6.
-- ============================================================

ALTER TABLE answer_annotations
    DROP CONSTRAINT IF EXISTS chk_answer_annotations_offsets;


-- ============================================================
-- 8. GRADING METHOD
--    V1: AUTO, AI, TEACHER_MANUAL
--    V6: AUTO, TEACHER_MANUAL
--
--    PostgreSQL ENUM values cannot simply be removed.
--    Replace the enum type.
-- ============================================================

ALTER TABLE gradings
    ALTER COLUMN method DROP DEFAULT;

ALTER TYPE grading_method RENAME TO grading_method_old;

CREATE TYPE grading_method AS ENUM (
    'AUTO',
    'TEACHER_MANUAL'
);

ALTER TABLE gradings
    ALTER COLUMN method TYPE grading_method
    USING method::text::grading_method;

DROP TYPE grading_method_old;


-- ============================================================
-- 9. GRADING STATUS
--    V6 adds AI_GRADED.
-- ============================================================

ALTER TYPE grading_status
    ADD VALUE IF NOT EXISTS 'AI_GRADED' BEFORE 'COMPLETED';


-- ============================================================
-- 10. GRADINGS
--     V6 removes ai_suggested_score
--     and adds AI transcript + instruction snapshot.
-- ============================================================

ALTER TABLE gradings
    DROP COLUMN IF EXISTS ai_suggested_score;

ALTER TABLE gradings
    ADD COLUMN ai_transcript JSONB,
    ADD COLUMN ai_instruction_snapshot TEXT;


-- ============================================================
-- 11. CRITERIA SCORES
--     Removed completely in V6.
-- ============================================================

DROP TABLE IF EXISTS criteria_scores;


-- ============================================================
-- 12. REFRESH TOKENS
--     V1 has a partial index for active tokens.
--     V6 uses a normal index.
-- ============================================================

DROP INDEX IF EXISTS idx_refresh_tokens_active;

CREATE INDEX idx_refresh_tokens_active
    ON refresh_tokens (user_id, expires_at);


-- ============================================================
-- 13. GRADING CHANGE LOGS
--     V6 uses ascending changed_at index.
-- ============================================================

DROP INDEX IF EXISTS idx_grading_change_logs_grading;

CREATE INDEX idx_grading_change_logs_grading
    ON grading_change_logs (grading_id, changed_at);


-- ============================================================
-- V2 migration complete.
-- ============================================================