-- V4: Convert JSON text columns to JSONB.
-- Essay answers are wrapped as JSON strings because their content is plain text.

ALTER TABLE answers
    ALTER COLUMN content TYPE JSONB
    USING CASE
        WHEN content IS NULL THEN NULL
        WHEN question_id IS NULL THEN to_jsonb(content)
        ELSE content::jsonb
    END;

ALTER TABLE questions
    ALTER COLUMN correct_answer TYPE JSONB
    USING correct_answer::jsonb;
