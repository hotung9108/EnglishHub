package com.english_hub.core.modules.grading.domain.model;

public record GradingFilter(
		Long classId,
		Long studentId,
		GradingStatus status,
		Long teacherId) {
}
