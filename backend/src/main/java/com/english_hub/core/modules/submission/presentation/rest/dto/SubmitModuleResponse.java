package com.english_hub.core.modules.submission.presentation.rest.dto;

import com.english_hub.core.modules.submission.application.service.SubmissionService.AnswerResult;
import com.english_hub.core.modules.submission.application.service.SubmissionService.SubmitModuleResult;

import java.util.List;

import tools.jackson.databind.JsonNode;

public record SubmitModuleResponse(
		String message,
		Long submissionModuleId,
		String status,
		List<AnswerResponse> answers) {

	public static SubmitModuleResponse from(SubmitModuleResult result) {
		return new SubmitModuleResponse(
				result.message(),
				result.submissionModuleId(),
				result.status().name(),
				result.answers().stream().map(AnswerResponse::from).toList());
	}

	public record AnswerResponse(Long id, Long questionId, JsonNode content) {

		public static AnswerResponse from(AnswerResult result) {
			return new AnswerResponse(result.id(), result.questionId(), result.content());
		}
	}
}