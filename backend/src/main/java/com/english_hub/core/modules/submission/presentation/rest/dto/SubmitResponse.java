package com.english_hub.core.modules.submission.presentation.rest.dto;

import com.english_hub.core.modules.submission.application.service.SubmissionService.SubmitResult;

import java.time.OffsetDateTime;

public record SubmitResponse(String message, String status, OffsetDateTime submittedAt) {

	public static SubmitResponse from(SubmitResult result) {
		return new SubmitResponse(
				result.message(),
				result.status().name(),
				result.submittedAt());
	}
}