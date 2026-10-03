package com.english_hub.core.modules.grading.domain.model;

import com.english_hub.core.modules.module.domain.model.ModuleSkill;
import com.english_hub.core.modules.module.domain.model.ModuleTaskType;
import java.math.BigDecimal;

/** Scalar-ID traversal result used for ownership checks across legacy tables. */
public record GradingContext(
		Long submissionModuleId,
		Long moduleId,
		Long answerId,
		Long submissionId,
		Long assignmentId,
		Long classId,
		Long teacherId,
		Long studentId,
		ModuleSkill moduleSkill,
		boolean submitted,
		Integer answerContentLength,
		ModuleTaskType moduleTaskType,
		BigDecimal moduleMaxScore) {

	/** Narrows this module-level context to one answer, keeping the module verdict fields. */
	public GradingContext withAnswer(Long id, Integer contentLength) {
		return new GradingContext(
				submissionModuleId,
				moduleId,
				id,
				submissionId,
				assignmentId,
				classId,
				teacherId,
				studentId,
				moduleSkill,
				submitted,
				contentLength,
				moduleTaskType,
				moduleMaxScore);
	}
}