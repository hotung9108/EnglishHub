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
		BigDecimal moduleMaxScore,
		String moduleInstructions) {

	public GradingContext(
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
		this(
				submissionModuleId,
				moduleId,
				answerId,
				submissionId,
				assignmentId,
				classId,
				teacherId,
				studentId,
				moduleSkill,
				submitted,
				answerContentLength,
				moduleTaskType,
				moduleMaxScore,
				null);
	}

	public GradingContext(
			Long submissionModuleId,
			Long answerId,
			Long submissionId,
			Long assignmentId,
			Long classId,
			Long teacherId,
			Long studentId,
			ModuleSkill moduleSkill,
			boolean submitted,
			Integer answerContentLength,
			String moduleInstructions) {
		this(
				submissionModuleId,
				null,
				answerId,
				submissionId,
				assignmentId,
				classId,
				teacherId,
				studentId,
				moduleSkill,
				submitted,
				answerContentLength,
				null,
				null,
				moduleInstructions);
	}

	public GradingContext(
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
		this(
				submissionModuleId,
				null,
				answerId,
				submissionId,
				assignmentId,
				classId,
				teacherId,
				studentId,
				moduleSkill,
				submitted,
				answerContentLength,
				null,
				null,
				null);
	}

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
				moduleMaxScore,
				moduleInstructions);
	}
}
