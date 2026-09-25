package com.english_hub.core.modules.submission.domain.model;

/**
 * Read model of an assignment module, used to derive submission modules and
 * each module's grading method from its task type.
 */
public record ModuleInfo(
		Long moduleId,
		Long assignmentId,
		ModuleSkill skill,
		ModuleTaskType taskType,
		int orderIndex) {
}