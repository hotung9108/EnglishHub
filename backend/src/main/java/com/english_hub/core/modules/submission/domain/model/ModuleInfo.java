package com.english_hub.core.modules.submission.domain.model;

import java.math.BigDecimal;

/**
 * Read model of an assignment module, used to derive submission modules and
 * each module's grading method from its task type.
 */
public record ModuleInfo(
		Long moduleId,
		Long assignmentId,
		ModuleSkill skill,
		ModuleTaskType taskType,
		int orderIndex,
		BigDecimal maxScore,
		String aiInstruction) {

	public ModuleInfo(
			Long moduleId,
			Long assignmentId,
			ModuleSkill skill,
			ModuleTaskType taskType,
			int orderIndex,
			BigDecimal maxScore) {
		this(moduleId, assignmentId, skill, taskType, orderIndex, maxScore, null);
	}
}
