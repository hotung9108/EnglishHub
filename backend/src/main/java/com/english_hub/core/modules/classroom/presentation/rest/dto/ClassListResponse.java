package com.english_hub.core.modules.classroom.presentation.rest.dto;

import java.util.List;

public record ClassListResponse(
		List<ClassSummaryResponse> data,
		PaginationResponse pagination) {
}