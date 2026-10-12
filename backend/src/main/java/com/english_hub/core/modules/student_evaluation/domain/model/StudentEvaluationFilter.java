package com.english_hub.core.modules.student_evaluation.domain.model;

import java.time.Instant;

public record StudentEvaluationFilter(
		long studentId,
		Long classId,
		Long teacherId,
		Instant createdAtFromInclusive,
		Instant createdAtToExclusive) {
}
