package com.english_hub.core.modules.submission.presentation.rest.dto;

import com.english_hub.core.modules.submission.application.service.SubmissionService.SubmissionDetailResult;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;

public record SubmissionDetailResponse(
		Long id,
		Long assignmentId,
		Long studentId,
		int attemptNumber,
		String status,
		OffsetDateTime submittedAt,
		Instant createdAt,
		List<ModuleDetailResponse> modules) {

	public static SubmissionDetailResponse from(SubmissionDetailResult result) {
		return new SubmissionDetailResponse(
				result.id(),
				result.assignmentId(),
				result.studentId(),
				result.attemptNumber(),
				result.status().name(),
				result.submittedAt(),
				result.createdAt(),
				result.modules().stream().map(ModuleDetailResponse::from).toList());
	}
}