package com.english_hub.core.modules.grading.presentation.rest.dto;

import com.english_hub.core.modules.grading.application.dto.GradingSummaryItem;
import com.english_hub.core.modules.grading.domain.model.Grading;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record GradingSummaryResponse(
		Long id,
		String status,
		BigDecimal finalScore,
		Long submissionModuleId,
		Long assignmentId,
		String assignmentTitle,
		Long classId,
		String className,
		Long teacherId,
		String teacherName,
		Long studentId,
		String studentName,
		OffsetDateTime gradedAt) {

	public static GradingSummaryResponse from(GradingSummaryItem item) {
		Grading grading = item.grading();
		return new GradingSummaryResponse(
				grading.id(),
				grading.status().name(),
				grading.finalScore(),
				grading.submissionModuleId(),
				item.assignmentId(),
				item.assignmentTitle(),
				item.classId(),
				item.className(),
				item.teacherId(),
				item.teacherName(),
				item.studentId(),
				item.studentName(),
				grading.gradedAt());
	}

	public static GradingSummaryResponse from(Grading grading) {
		return new GradingSummaryResponse(
				grading.id(),
				grading.status().name(),
				grading.finalScore(),
				grading.submissionModuleId(),
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				grading.gradedAt());
	}
}
