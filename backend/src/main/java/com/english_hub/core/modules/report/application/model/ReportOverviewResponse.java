package com.english_hub.core.modules.report.application.model;

import com.english_hub.core.infrastructure.persistence.entity.GradingStatus;
import java.math.BigDecimal;
import java.util.Map;

public record ReportOverviewResponse(
		long classCount,
		long assignedAssignmentCount,
		BigDecimal completionRatePercent,
		BigDecimal averageScorePercent,
		long pendingGradingCount,
		Map<GradingStatus, Long> pendingByStatus) {
}
