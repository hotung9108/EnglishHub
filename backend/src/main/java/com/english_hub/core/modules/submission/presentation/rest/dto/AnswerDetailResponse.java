package com.english_hub.core.modules.submission.presentation.rest.dto;

import com.english_hub.core.modules.submission.application.service.SubmissionService.AnswerResult;

import tools.jackson.databind.JsonNode;

public record AnswerDetailResponse(Long id, Long questionId, JsonNode content) {

	public static AnswerDetailResponse from(AnswerResult result) {
		return new AnswerDetailResponse(result.id(), result.questionId(), result.content());
	}
}