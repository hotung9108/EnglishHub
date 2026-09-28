package com.english_hub.core.modules.submission.presentation.rest.dto;

import com.english_hub.core.modules.submission.application.service.SubmissionService.SubmissionStartResult;

import java.time.Instant;
import java.util.List;

public record StartSubmissionResponse(
		Long id,
		Long assignmentId,
		int attemptNumber,
		String status,
		Instant createdAt,
		List<ModuleResponse> modules) {

	public static StartSubmissionResponse from(SubmissionStartResult result) {
		return new StartSubmissionResponse(
				result.submissionId(),
				result.assignmentId(),
				result.attemptNumber(),
				result.status().name(),
				result.createdAt(),
				result.modules().stream().map(ModuleResponse::from).toList());
	}
}