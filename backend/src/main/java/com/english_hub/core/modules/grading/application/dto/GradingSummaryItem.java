package com.english_hub.core.modules.grading.application.dto;

import com.english_hub.core.modules.grading.domain.model.Grading;

public record GradingSummaryItem(
		Grading grading,
		Long assignmentId,
		String assignmentTitle,
		Long classId,
		String className,
		Long teacherId,
		String teacherName,
		Long studentId,
		String studentName) {
}
