package com.english_hub.core.modules.question.presentation.rest.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.english_hub.core.modules.question.domain.model.Question;
import java.math.BigDecimal;
import java.util.Map;

public record QuestionResponse(
		Long id,
		String content,
		String questionType,
		BigDecimal score,
		int orderIndex,
		@JsonInclude(JsonInclude.Include.NON_NULL) Map<String, Object> correctAnswer) {

	public static QuestionResponse from(Question question, boolean includeCorrectAnswer) {
		return new QuestionResponse(
				question.id(),
				question.content(),
				question.questionType().name(),
				question.score(),
				question.orderIndex(),
				includeCorrectAnswer ? question.correctAnswer() : null);
	}
}
