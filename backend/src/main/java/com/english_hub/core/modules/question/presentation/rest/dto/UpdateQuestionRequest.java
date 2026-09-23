package com.english_hub.core.modules.question.presentation.rest.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.Map;

public record UpdateQuestionRequest(
		String content,
		Map<String, Object> correctAnswer,
		@DecimalMin(value = "0.00", message = "score không được âm.") BigDecimal score,
		@Positive(message = "orderIndex phải lớn hơn 0.") Integer orderIndex) {
}
