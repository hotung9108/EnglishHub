package com.english_hub.core.modules.assignment.presentation.rest.dto;

import java.util.List;

public record AssignmentListResponse(
		List<AssignmentSummaryResponse> data,
		PaginationResponse pagination) {
}
