package com.english_hub.core.modules.assignment.presentation.rest.dto;

import com.english_hub.core.modules.assignment.domain.model.Assignment;
import com.english_hub.core.modules.module.domain.model.ModuleSkill;
import java.time.OffsetDateTime;
import java.util.List;

public record AssignmentSummaryResponse(
		Long id,
		String title,
		String status,
		OffsetDateTime closeAt,
		List<ModuleSkill> skills) {

	public AssignmentSummaryResponse {
		skills = skills == null ? List.of() : List.copyOf(skills);
	}

	public static AssignmentSummaryResponse from(Assignment assignment, List<ModuleSkill> skills) {
		return new AssignmentSummaryResponse(
				assignment.id(),
				assignment.title(),
				assignment.status().name(),
				assignment.closeAt(),
				skills);
	}
}
