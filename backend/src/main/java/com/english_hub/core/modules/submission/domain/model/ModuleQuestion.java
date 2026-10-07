package com.english_hub.core.modules.submission.domain.model;

import java.math.BigDecimal;

/** Minimal question view used for answer validation, mirroring the shared {@code questions} row. */
public record ModuleQuestion(
		Long id,
		Long moduleId,
		QuestionType questionType,
		BigDecimal score,
		int orderIndex) {
}