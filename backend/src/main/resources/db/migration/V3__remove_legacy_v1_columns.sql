-- V3: Remove legacy columns that are not part of the V6 schema.

ALTER TABLE assignments
    DROP COLUMN is_manually_closed;

ALTER TABLE gradings
    DROP COLUMN is_plagiarism_flagged,
    DROP COLUMN plagiarism_score;
