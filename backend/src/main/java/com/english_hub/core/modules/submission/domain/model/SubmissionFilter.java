package com.english_hub.core.modules.submission.domain.model;

/** Optional filters for paginated submission listing. Null fields are ignored. */
public record SubmissionFilter(Long assignmentId, Long studentId, SubmissionStatus status) {
}