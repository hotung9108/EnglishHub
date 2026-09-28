package com.english_hub.core.modules.question.presentation.rest.dto.correctanswer;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;

public record ShortAnswerCorrectAnswer(
		@NotBlank(message = "correctAnswer không được để trống.")
		@JsonAlias("correct_answer") String correctAnswer) implements CorrectAnswer {

	@Override
	public Map<String, Object> toMap() {
		return Map.of("correctAnswer", correctAnswer);
	}
}
