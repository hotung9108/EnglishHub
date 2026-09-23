package com.english_hub.core.modules.question.application.command;

import com.english_hub.core.modules.question.domain.model.QuestionType;
import java.math.BigDecimal;
import java.util.Map;

public record CreateQuestionCommand(
		String content,
		QuestionType questionType,
		Map<String, Object> correctAnswer,
		BigDecimal score,
		int orderIndex) {
}
