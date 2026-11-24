-- V5: Increase document MIME type length to support DOCX.

ALTER TABLE answers
    ALTER COLUMN doc_mime_type TYPE VARCHAR(255);
