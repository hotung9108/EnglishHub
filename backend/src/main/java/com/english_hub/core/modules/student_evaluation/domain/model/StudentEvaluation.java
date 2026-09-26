package com.english_hub.core.modules.student_evaluation.domain.model;

import java.time.Instant;

public record StudentEvaluation(
		Long id,
		Long studentId,
		Long teacherId,
		Long classId,
		String teacherName,
		String content,
		Instant createdAt) {

	public StudentEvaluation withTeacherName(String name) {
		return new StudentEvaluation(id, studentId, teacherId, classId, name, content, createdAt);
	}

	public StudentEvaluation withContent(String updatedContent) {
		return new StudentEvaluation(id, studentId, teacherId, classId, teacherName, updatedContent, createdAt);
	}
}
