package com.english_hub.core.modules.grading.application.dto;

public record GradingMetadata(
		Long submissionModuleId,
		Long assignmentId,
		String assignmentTitle,
		Long classId,
		String className,
		Long teacherId,
		String teacherName,
		Long studentId,
		String studentName) {
}
