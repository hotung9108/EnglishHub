package com.english_hub.core.modules.submission.domain.model;

import java.math.BigDecimal;

/** Read model of one question with its prompt and correct answer, used by module detail reads. */
public record QuestionDetail(
		Long id,
		Long moduleId,
		QuestionType questionType,
		BigDecimal score,
		int orderIndex,
		String content,
		String correctAnswer) {
}