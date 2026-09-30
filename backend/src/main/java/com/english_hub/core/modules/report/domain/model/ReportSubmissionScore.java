package com.english_hub.core.modules.report.domain.model;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record ReportSubmissionScore(
		Long submissionId,
		Long assignmentId,
		Long classId,
		Long studentId,
		OffsetDateTime submittedAt,
		BigDecimal finalTotal,
		BigDecimal maxTotal,
		Long moduleCount,
		Long completedModuleCount) {
}
