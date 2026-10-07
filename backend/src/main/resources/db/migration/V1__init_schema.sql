-- V1__init_schema.sql
-- PostgreSQL
-- Website quản lý bài tập & chấm chữa bài tiếng Anh thông minh — Group 4
--
-- Schema: 17 tables
-- View ai_calibration_report is intentionally not created here because
-- the supplied design documents only specify that it exists and is based on
-- gradings JOIN submission_modules JOIN modules, but do not define its
-- columns/query. No unsupported view definition is invented.

BEGIN;

-- ============================================================================
-- 1. ENUM TYPES
-- ============================================================================

CREATE TYPE user_role AS ENUM (
    'ADMIN',
    'TEACHER',
    'STUDENT'
);

CREATE TYPE user_status AS ENUM (
    'ACTIVE',
    'LOCKED'
);

CREATE TYPE class_member_type AS ENUM (
    'PRIMARY',
    'SUPPLEMENTARY'
);

CREATE TYPE class_member_status AS ENUM (
    'ACTIVE',
    'ENDED'
);

CREATE TYPE module_skill AS ENUM (
    'READING',
    'LISTENING',
    'WRITING',
    'SPEAKING'
);

CREATE TYPE module_task_type AS ENUM (
    'QUIZ',
    'REWRITE',
    'RECORDING',
    'ESSAY'
);

CREATE TYPE upload_status AS ENUM (
    'UPLOADING',
    'PROCESSING',
    'READY',
    'FAILED'
);

CREATE TYPE question_type AS ENUM (
    'MULTIPLE_CHOICE',
    'SHORT_ANSWER'
);

CREATE TYPE submission_status AS ENUM (
    'IN_PROGRESS',
    'SUBMITTED',
    'GRADED'
);

CREATE TYPE annotation_source AS ENUM (
    'AI',
    'TEACHER'
);

CREATE TYPE review_status AS ENUM (
    'PENDING',
    'ACCEPTED',
    'REJECTED'
);

CREATE TYPE grading_method AS ENUM (
    'AUTO',
    'AI',
    'TEACHER_MANUAL'
);

CREATE TYPE grading_status AS ENUM (
    'PENDING',
    'COMPLETED',
    'FAILED'
);

-- ============================================================================
-- 2. USERS
-- ============================================================================

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    status user_status NOT NULL DEFAULT 'ACTIVE',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE INDEX idx_users_role
    ON users (role);

CREATE INDEX idx_users_status
    ON users (status);

-- ============================================================================
-- 3. TEACHER PROFILES
-- ============================================================================

CREATE TABLE teacher_profiles (
    user_id BIGINT PRIMARY KEY,
    specialization VARCHAR(150),

    CONSTRAINT fk_teacher_profiles_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
);

-- ============================================================================
-- 4. STUDENT PROFILES
-- ============================================================================

CREATE TABLE student_profiles (
    user_id BIGINT PRIMARY KEY,
    student_code VARCHAR(30),
    date_of_birth DATE,
    parent_phone VARCHAR(20),

    CONSTRAINT fk_student_profiles_user
        FOREIGN KEY (user_id)
        REFERENCES users (id),

    CONSTRAINT uq_student_profiles_student_code
        UNIQUE (student_code)
);

-- ============================================================================
-- 5. CLASSES
-- ============================================================================

CREATE TABLE classes (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    level VARCHAR(50),
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20),
    teacher_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_classes_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES teacher_profiles (user_id)
);

CREATE INDEX idx_classes_teacher_id
    ON classes (teacher_id);

-- ============================================================================
-- 6. CLASS MEMBERS
-- ============================================================================

CREATE TABLE class_members (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    member_type class_member_type NOT NULL,
    status class_member_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_class_members_class
        FOREIGN KEY (class_id)
        REFERENCES classes (id),

    CONSTRAINT fk_class_members_student
        FOREIGN KEY (student_id)
        REFERENCES student_profiles (user_id),

    CONSTRAINT uq_class_members_class_student
        UNIQUE (class_id, student_id)
);

CREATE INDEX idx_class_members_class_id
    ON class_members (class_id);

CREATE INDEX idx_class_members_student_id
    ON class_members (student_id);

-- Một học viên chỉ có tối đa một PRIMARY đang ACTIVE tại một thời điểm.
CREATE UNIQUE INDEX uq_class_members_one_active_primary_per_student
    ON class_members (student_id)
    WHERE member_type = 'PRIMARY'
      AND status = 'ACTIVE';

-- ============================================================================
-- 7. ASSIGNMENTS
-- ============================================================================

CREATE TABLE assignments (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    open_at TIMESTAMPTZ NOT NULL,
    close_at TIMESTAMPTZ NOT NULL,
    max_submissions INT,
    is_manually_closed BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_assignments_class
        FOREIGN KEY (class_id)
        REFERENCES classes (id),

    CONSTRAINT fk_assignments_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES teacher_profiles (user_id),

    CONSTRAINT chk_assignments_open_before_close
        CHECK (open_at < close_at)
);

CREATE INDEX idx_assignments_class_id
    ON assignments (class_id);

CREATE INDEX idx_assignments_teacher_id
    ON assignments (teacher_id);

-- ============================================================================
-- 8. MODULES
-- ============================================================================

CREATE TABLE modules (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT NOT NULL,
    skill module_skill NOT NULL,
    task_type module_task_type NOT NULL,
    order_index INT NOT NULL,
    instructions TEXT,
    max_score NUMERIC(5,2) NOT NULL DEFAULT 10,
    source_audio_storage_key VARCHAR(255),
    source_audio_duration_seconds INT,
    source_audio_mime_type VARCHAR(50),
    source_audio_upload_status upload_status,

    CONSTRAINT fk_modules_assignment
        FOREIGN KEY (assignment_id)
        REFERENCES assignments (id)
        ON DELETE CASCADE,

    CONSTRAINT uq_modules_assignment_order
        UNIQUE (assignment_id, order_index)
);

CREATE INDEX idx_modules_assignment_id
    ON modules (assignment_id);

-- ============================================================================
-- 9. QUESTIONS
-- ============================================================================

CREATE TABLE questions (
    id BIGSERIAL PRIMARY KEY,
    module_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    question_type question_type NOT NULL,
    correct_answer TEXT,
    score NUMERIC(5,2) NOT NULL DEFAULT 1,
    order_index INT NOT NULL,

    CONSTRAINT fk_questions_module
        FOREIGN KEY (module_id)
        REFERENCES modules (id)
        ON DELETE CASCADE
);

CREATE INDEX idx_questions_module_id
    ON questions (module_id);

CREATE UNIQUE INDEX uq_questions_module_order
    ON questions (module_id, order_index);

-- ============================================================================
-- 10. SUBMISSIONS
-- ============================================================================

CREATE TABLE submissions (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    attempt_number INT NOT NULL,
    submitted_at TIMESTAMPTZ,
    status submission_status NOT NULL DEFAULT 'IN_PROGRESS',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_submissions_assignment
        FOREIGN KEY (assignment_id)
        REFERENCES assignments (id),

    CONSTRAINT fk_submissions_student
        FOREIGN KEY (student_id)
        REFERENCES student_profiles (user_id),

    CONSTRAINT uq_submissions_assignment_student_attempt
        UNIQUE (assignment_id, student_id, attempt_number)
);

CREATE INDEX idx_submissions_assignment_id
    ON submissions (assignment_id);

CREATE INDEX idx_submissions_student_id
    ON submissions (student_id);

-- ============================================================================
-- 11. SUBMISSION MODULES
-- ============================================================================

CREATE TABLE submission_modules (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT NOT NULL,
    module_id BIGINT NOT NULL,
    status submission_status NOT NULL DEFAULT 'IN_PROGRESS',
    audio_play_count INT NOT NULL DEFAULT 0,

    CONSTRAINT fk_submission_modules_submission
        FOREIGN KEY (submission_id)
        REFERENCES submissions (id)
        ON DELETE CASCADE,

    CONSTRAINT fk_submission_modules_module
        FOREIGN KEY (module_id)
        REFERENCES modules (id),

    CONSTRAINT uq_submission_modules_submission_module
        UNIQUE (submission_id, module_id)
);

CREATE INDEX idx_submission_modules_submission_id
    ON submission_modules (submission_id);

CREATE INDEX idx_submission_modules_module_id
    ON submission_modules (module_id);

-- ============================================================================
-- 12. ANSWERS
-- ============================================================================

CREATE TABLE answers (
    id BIGSERIAL PRIMARY KEY,
    submission_module_id BIGINT NOT NULL,
    question_id BIGINT,
    content TEXT,
    audio_storage_key VARCHAR(255),
    audio_duration_seconds INT,
    audio_file_size_bytes BIGINT,
    audio_mime_type VARCHAR(50),
    audio_upload_status upload_status,
    doc_storage_key VARCHAR(255),
    doc_mime_type VARCHAR(50),
    doc_file_size_bytes BIGINT,
    doc_upload_status upload_status,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_answers_submission_module
        FOREIGN KEY (submission_module_id)
        REFERENCES submission_modules (id)
        ON DELETE CASCADE,

    CONSTRAINT fk_answers_question
        FOREIGN KEY (question_id)
        REFERENCES questions (id)
);

CREATE INDEX idx_answers_submission_module_id
    ON answers (submission_module_id);

CREATE INDEX idx_answers_question_id
    ON answers (question_id);

-- Ràng buộc "đúng 1 trong 3 nguồn dữ liệu" được xử lý ở service layer
-- theo tài liệu thiết kế, không áp CHECK tại database.

-- ============================================================================
-- 13. ANSWER ANNOTATIONS
-- ============================================================================

CREATE TABLE answer_annotations (
    id BIGSERIAL PRIMARY KEY,
    answer_id BIGINT NOT NULL,
    source annotation_source NOT NULL,
    start_offset INT NOT NULL,
    end_offset INT NOT NULL,
    error_type VARCHAR(50),
    comment TEXT,
    suggested_fix TEXT,
    review_status review_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_answer_annotations_answer
        FOREIGN KEY (answer_id)
        REFERENCES answers (id)
        ON DELETE CASCADE,

    CONSTRAINT chk_answer_annotations_offsets
        CHECK (end_offset >= start_offset)
);

CREATE INDEX idx_answer_annotations_answer_id
    ON answer_annotations (answer_id);

-- ============================================================================
-- 14. GRADINGS
-- ============================================================================

CREATE TABLE gradings (
    id BIGSERIAL PRIMARY KEY,
    submission_module_id BIGINT NOT NULL,
    method grading_method NOT NULL,
    status grading_status NOT NULL DEFAULT 'PENDING',
    ai_suggested_score NUMERIC(5,2),
    ai_feedback TEXT,
    final_score NUMERIC(5,2),
    final_feedback TEXT,
    max_score_snapshot NUMERIC(5,2),
    is_plagiarism_flagged BOOLEAN NOT NULL DEFAULT FALSE,
    plagiarism_score NUMERIC(5,2),
    reviewed_by BIGINT,
    reviewed_at TIMESTAMPTZ,
    graded_at TIMESTAMPTZ,

    CONSTRAINT fk_gradings_submission_module
        FOREIGN KEY (submission_module_id)
        REFERENCES submission_modules (id)
        ON DELETE CASCADE,

    CONSTRAINT fk_gradings_reviewed_by
        FOREIGN KEY (reviewed_by)
        REFERENCES teacher_profiles (user_id),

    CONSTRAINT uq_gradings_submission_module
        UNIQUE (submission_module_id)
);

CREATE INDEX idx_gradings_reviewed_by
    ON gradings (reviewed_by);

CREATE INDEX idx_gradings_status
    ON gradings (status);

-- ============================================================================
-- 15. CRITERIA SCORES
-- ============================================================================

CREATE TABLE criteria_scores (
    id BIGSERIAL PRIMARY KEY,
    grading_id BIGINT NOT NULL,
    criteria_name VARCHAR(100) NOT NULL,
    score NUMERIC(5,2) NOT NULL,
    feedback TEXT,
    review_status review_status NOT NULL DEFAULT 'PENDING',

    CONSTRAINT fk_criteria_scores_grading
        FOREIGN KEY (grading_id)
        REFERENCES gradings (id)
        ON DELETE CASCADE
);

CREATE INDEX idx_criteria_scores_grading_id
    ON criteria_scores (grading_id);

-- ============================================================================
-- 16. REFRESH TOKENS
-- ============================================================================

CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    user_agent VARCHAR(255),
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id)
        REFERENCES users (id),

    CONSTRAINT uq_refresh_tokens_token_hash
        UNIQUE (token_hash)
);

CREATE INDEX idx_refresh_tokens_user_id
    ON refresh_tokens (user_id);

CREATE INDEX idx_refresh_tokens_active
    ON refresh_tokens (user_id, expires_at)
    WHERE revoked_at IS NULL;

-- ============================================================================
-- 17. STUDENT EVALUATIONS
-- ============================================================================

CREATE TABLE student_evaluations (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_student_evaluations_student
        FOREIGN KEY (student_id)
        REFERENCES student_profiles (user_id),

    CONSTRAINT fk_student_evaluations_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES teacher_profiles (user_id),

    CONSTRAINT fk_student_evaluations_class
        FOREIGN KEY (class_id)
        REFERENCES classes (id)
);

CREATE INDEX idx_student_evaluations_student_id
    ON student_evaluations (student_id);

CREATE INDEX idx_student_evaluations_teacher_id
    ON student_evaluations (teacher_id);

CREATE INDEX idx_student_evaluations_class_id
    ON student_evaluations (class_id);

-- ============================================================================
-- 18. GRADING CHANGE LOGS
-- ============================================================================

CREATE TABLE grading_change_logs (
    id BIGSERIAL PRIMARY KEY,
    grading_id BIGINT NOT NULL,
    changed_by BIGINT NOT NULL,
    old_score NUMERIC(5,2),
    new_score NUMERIC(5,2),
    note TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_grading_change_logs_grading
        FOREIGN KEY (grading_id)
        REFERENCES gradings (id),

    CONSTRAINT fk_grading_change_logs_changed_by
        FOREIGN KEY (changed_by)
        REFERENCES teacher_profiles (user_id)
);

CREATE INDEX idx_grading_change_logs_grading_id_changed_at
    ON grading_change_logs (grading_id, changed_at DESC);

CREATE INDEX idx_grading_change_logs_changed_by
    ON grading_change_logs (changed_by);

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Không có bảng branches theo thiết kế FINAL.
--
-- 2. Không có adjustment_note trên gradings.
--    Lịch sử sửa điểm nằm ở grading_change_logs; service layer tự insert
--    một dòng mỗi lần cập nhật gradings.final_score.
--
-- 3. Không tạo trigger audit cho grading_change_logs.
--
-- 4. Không tạo CHECK cho quy tắc độc quyền content/audio/doc trong answers;
--    tài liệu thiết kế quy định validation này ở service layer.
--
-- 5. Không thêm enum NEEDS_REVIEW cho grading_status vì tài liệu chốt
--    PENDING / COMPLETED / FAILED.
--
-- 6. View ai_calibration_report chưa được định nghĩa trong tài liệu cung cấp.
--    Cần dùng SQL definition đã thống nhất trước khi thêm vào migration.

COMMIT;
