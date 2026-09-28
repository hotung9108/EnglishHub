package com.english_hub.core.modules.question.presentation.rest.dto;

import com.english_hub.core.modules.question.presentation.rest.dto.correctanswer.CorrectAnswer;
import com.english_hub.core.modules.question.presentation.rest.dto.correctanswer.CorrectAnswerDeserializer;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import tools.jackson.databind.annotation.JsonDeserialize;

public record UpdateQuestionRequest(
		String content,
		@JsonDeserialize(using = CorrectAnswerDeserializer.class)
		@Valid CorrectAnswer correctAnswer,
		@DecimalMin(value = "0.00", message = "score không được âm.") BigDecimal score,
		@Positive(message = "orderIndex phải lớn hơn 0.") Integer orderIndex) {
}
