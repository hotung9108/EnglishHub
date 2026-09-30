package com.english_hub.core.modules.report.domain.model;

import com.english_hub.core.infrastructure.persistence.entity.GradingStatus;

public record ReportPendingByStatus(GradingStatus status, Long gradingCount) {
}
