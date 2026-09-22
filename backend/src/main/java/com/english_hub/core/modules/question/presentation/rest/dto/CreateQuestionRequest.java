package com.english_hub.core.modules.question.presentation.rest.dto;

import com.english_hub.core.modules.question.domain.model.QuestionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.Map;

public record CreateQuestionRequest(
		@NotBlank(message = "content là bắt buộc.") String content,
		@NotNull(message = "questionType là bắt buộc.") QuestionType questionType,
		@NotNull(message = "correctAnswer là bắt buộc.") Map<String, Object> correctAnswer,
		@DecimalMin(value = "0.00", message = "score không được âm.") BigDecimal score,
		@NotNull(message = "orderIndex là bắt buộc.")
		@Positive(message = "orderIndex phải lớn hơn 0.") Integer orderIndex) {
}
