package com.english_hub.core.modules.submission.presentation.rest.dto.answercontent;

import com.english_hub.core.modules.submission.domain.model.QuestionType;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;

/** Submitted answer content for a {@code SHORT_ANSWER} question. */
public record ShortAnswerAnswerContent(
		@NotBlank(message = "text không được để trống.") String text) implements AnswerContent {

	@Override
	public QuestionType questionType() {
		return QuestionType.SHORT_ANSWER;
	}

	@Override
	public Map<String, Object> toMap() {
		return Map.of("text", text);
	}
}
