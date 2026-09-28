package com.english_hub.core.modules.grading.domain.model;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record GradingChangeLog(
		Long id,
		Long gradingId,
		Long changedBy,
		BigDecimal oldScore,
		BigDecimal newScore,
		String note,
		OffsetDateTime changedAt) {
}
