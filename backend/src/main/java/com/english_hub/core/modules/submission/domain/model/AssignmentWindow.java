package com.english_hub.core.modules.submission.domain.model;

import java.time.OffsetDateTime;

/**
 * Read model of an assignment's start eligibility: its window, max-submissions
 * limit and deletion flag. Owned by the submission context via a read port.
 */
public record AssignmentWindow(
		Long assignmentId,
		Long classId,
		AssignmentStatus status,
		OffsetDateTime openAt,
		OffsetDateTime closeAt,
		Integer maxSubmissions,
		boolean deleted) {
}