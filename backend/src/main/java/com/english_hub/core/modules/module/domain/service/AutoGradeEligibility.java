package com.english_hub.core.modules.module.domain.service;

import com.english_hub.core.modules.module.domain.model.ModuleSkill;
import com.english_hub.core.modules.module.domain.model.ModuleTaskType;

/**
 * Decides which assignment modules are scored deterministically by comparing submitted answers
 * against {@code questions.correct_answer}, and which stay with the teacher.
 *
 * <p>Enumerated per skill rather than as an independent set of skills and task types, because
 * {@code ModuleService} only accepts specific skill and task-type pairs: {@code LISTENING} with
 * {@code REWRITE} is not a creatable module and must not be treated as auto-graded either.
 *
 * <p>Lives in the module context because it classifies a module, and because that context depends on
 * no other one: the submission context needs it when it resolves a grading method at attempt start,
 * and the grading context needs it when it decides whether to score a module. Keeping it here is
 * what stops those two contexts from importing each other.
 */
public final class AutoGradeEligibility {

	private AutoGradeEligibility() {
	}

	public static boolean isEligible(ModuleSkill skill, ModuleTaskType taskType) {
		if (skill == null || taskType == null) {
			return false;
		}
		return switch (skill) {
			case READING -> taskType == ModuleTaskType.QUIZ || taskType == ModuleTaskType.REWRITE;
			case LISTENING -> taskType == ModuleTaskType.QUIZ;
			case WRITING, SPEAKING -> false;
		};
	}
}