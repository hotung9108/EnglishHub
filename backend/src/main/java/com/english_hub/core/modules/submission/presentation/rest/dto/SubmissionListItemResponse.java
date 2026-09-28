package com.english_hub.core.modules.submission.presentation.rest.dto;

import com.english_hub.core.modules.submission.application.service.SubmissionService.SubmissionListItemResult;

import java.time.OffsetDateTime;
import java.util.List;

public record SubmissionListItemResponse(
		Long id,
		Long studentId,
		int attemptNumber,
		String status,
		OffsetDateTime submittedAt,
		List<ModuleSummaryResponse> modules) {

	public static SubmissionListItemResponse from(SubmissionListItemResult result) {
		return new SubmissionListItemResponse(
				result.id(),
				result.studentId(),
				result.attemptNumber(),
				result.status().name(),
				result.submittedAt(),
				result.modules().stream().map(ModuleSummaryResponse::from).toList());
	}
}