package com.english_hub.core.modules.assignment.presentation.rest.dto;

import com.english_hub.core.modules.assignment.domain.model.AssignmentModuleSummary;

public record AssignmentModuleSummaryResponse(Long id, String skill) {

	public static AssignmentModuleSummaryResponse from(AssignmentModuleSummary module) {
		return new AssignmentModuleSummaryResponse(module.id(), module.skill());
	}
}
