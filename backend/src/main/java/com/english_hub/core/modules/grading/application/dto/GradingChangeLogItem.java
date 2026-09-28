package com.english_hub.core.modules.grading.application.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record GradingChangeLogItem(
		String changedBy,
		BigDecimal oldScore,
		BigDecimal newScore,
		String note,
		OffsetDateTime changedAt) {
}
