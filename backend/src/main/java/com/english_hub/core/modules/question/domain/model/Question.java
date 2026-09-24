package com.english_hub.core.modules.question.domain.model;

import java.math.BigDecimal;
import java.util.Map;

public record Question(
		Long id,
		Long moduleId,
		String content,
		QuestionType questionType,
		Map<String, Object> correctAnswer,
		BigDecimal score,
		int orderIndex) {
}
