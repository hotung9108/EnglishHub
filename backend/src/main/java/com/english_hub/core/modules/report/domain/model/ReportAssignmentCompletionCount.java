package com.english_hub.core.modules.report.domain.model;

public record ReportAssignmentCompletionCount(
		Long classId,
		Long assignmentId,
		Long completedStudentCount) {
}
