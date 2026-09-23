package com.english_hub.core.modules.assignment.presentation.rest.dto;

import com.english_hub.core.modules.assignment.domain.model.Assignment;
import java.time.OffsetDateTime;

public record AssignmentSummaryResponse(
		Long id,
		String title,
		String status,
		OffsetDateTime closeAt) {

	public static AssignmentSummaryResponse from(Assignment assignment) {
		return new AssignmentSummaryResponse(
				assignment.id(),
				assignment.title(),
				assignment.status().name(),
				assignment.closeAt());
	}
}
