package com.english_hub.core.modules.submission.presentation.rest.dto;

import com.english_hub.core.modules.submission.application.service.SubmissionService.QuestionDetailResult;

import java.math.BigDecimal;

import tools.jackson.databind.JsonNode;

public record QuestionResponse(
		Long id,
		String content,
		String questionType,
		BigDecimal score,
		int orderIndex,
		JsonNode correctAnswer) {

	public static QuestionResponse from(QuestionDetailResult result) {
		return new QuestionResponse(
				result.id(),
				result.content(),
				result.questionType().name(),
				result.score(),
				result.orderIndex(),
				result.correctAnswer());
	}
}