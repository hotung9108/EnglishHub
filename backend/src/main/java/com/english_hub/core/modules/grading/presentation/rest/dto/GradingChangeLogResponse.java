package com.english_hub.core.modules.grading.presentation.rest.dto;

import com.english_hub.core.modules.grading.application.dto.GradingChangeLogItem;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record GradingChangeLogResponse(
		String changedBy,
		BigDecimal oldScore,
		BigDecimal newScore,
		String note,
		OffsetDateTime changedAt) {

	public static GradingChangeLogResponse from(GradingChangeLogItem changeLog) {
		return new GradingChangeLogResponse(
				changeLog.changedBy(),
				changeLog.oldScore(),
				changeLog.newScore(),
				changeLog.note(),
				changeLog.changedAt());
	}
}
