package com.english_hub.core.modules.report.application.model;

import java.math.BigDecimal;
import java.util.List;

public record ReportClassProgressResponse(
		Long classId,
		BigDecimal completionRatePercent,
		BigDecimal belowAverageRatePercent,
		long totalStudentCount,
		long scoredStudentCount,
		long belowAverageCount,
		List<AssignmentScore> assignmentScores,
		List<StudentProgress> laggingStudents,
		List<StudentProgress> unscoredStudents) {

	public record AssignmentScore(Long assignmentId, String title, BigDecimal averageScorePercent) {
	}

	public record StudentProgress(
			Long studentId,
			String fullName,
			long completedAssignments,
			long totalAssignments,
			BigDecimal completionRatePercent,
			BigDecimal averageScorePercent) {
	}
}
