package com.english_hub.core.modules.question.application.command;

import java.math.BigDecimal;
import java.util.Map;

public record UpdateQuestionCommand(
		String content,
		Map<String, Object> correctAnswer,
		BigDecimal score,
		Integer orderIndex) {
}
