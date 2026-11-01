package com.english_hub.core.modules.question.application.command;

import com.english_hub.core.modules.question.domain.model.QuestionType;
import java.math.BigDecimal;
import java.util.Map;

public record UpdateQuestionCommand(
		String content,
		Map<String, Object> correctAnswer,
		BigDecimal score,
		Integer orderIndex,
		QuestionType questionType) {

	public UpdateQuestionCommand(
			String content,
			Map<String, Object> correctAnswer,
			BigDecimal score,
			Integer orderIndex) {
		this(content, correctAnswer, score, orderIndex, null);
	}
}
