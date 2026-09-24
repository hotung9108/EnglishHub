package com.english_hub.core.modules.assignment.presentation.rest.dto;

import com.english_hub.core.modules.assignment.application.service.AssignmentService.AssignmentDetailResult;
import java.util.List;

public record AssignmentDetailResponse(
		Long id,
		String title,
		String status,
		List<AssignmentModuleSummaryResponse> modules) {

	public static AssignmentDetailResponse from(AssignmentDetailResult result) {
		return new AssignmentDetailResponse(
				result.assignment().id(),
				result.assignment().title(),
				result.assignment().status().name(),
				result.modules().stream().map(AssignmentModuleSummaryResponse::from).toList());
	}
}
