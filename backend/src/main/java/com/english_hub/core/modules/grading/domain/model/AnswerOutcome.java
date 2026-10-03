package com.english_hub.core.modules.grading.domain.model;

import java.math.BigDecimal;

/**
 * Auto-grading verdict for one submitted answer. {@code answerId} is null when the student left
 * the question unanswered, in which case the answer row does not exist yet.
 */
public record AnswerOutcome(
		Long answerId,
		Long questionId,
		boolean correct,
		BigDecimal score) {
}