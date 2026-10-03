package com.english_hub.core.modules.report.application.model;

import com.english_hub.core.modules.classroom.domain.model.ClassStatus;
import java.math.BigDecimal;
import java.util.List;

public record ReportClassListResponse(List<ClassSummary> data, ReportPaginationResponse pagination) {
	public record ClassSummary(
			Long classId,
			String className,
			ClassStatus status,
			long assignedAssignmentCount,
			BigDecimal averageScorePercent,
			BigDecimal completionRatePercent) {
	}
}
