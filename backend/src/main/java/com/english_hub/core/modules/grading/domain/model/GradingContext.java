package com.english_hub.core.modules.grading.domain.model;

import com.english_hub.core.modules.module.domain.model.ModuleSkill;

/** Scalar-ID traversal result used for ownership checks across legacy tables. */
public record GradingContext(
		Long submissionModuleId,
		Long answerId,
		Long submissionId,
		Long assignmentId,
		Long classId,
		Long teacherId,
		Long studentId,
		ModuleSkill moduleSkill,
		boolean submitted,
		Integer answerContentLength) {
}
