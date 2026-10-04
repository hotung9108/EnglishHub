package com.english_hub.core.modules.grading.domain.repository;

import com.english_hub.core.modules.grading.domain.model.Grading;
import com.english_hub.core.modules.grading.domain.model.GradingFilter;
import com.english_hub.core.modules.grading.domain.model.GradingPage;
import com.english_hub.core.modules.grading.domain.model.GradingStatus;
import java.util.Optional;

public interface GradingRepository {

	Optional<Grading> findById(Long id);

	Optional<Grading> findBySubmissionModuleId(Long submissionModuleId);

	GradingPage findPage(GradingFilter filter, int page, int limit);

	Grading saveTeacherGrade(Grading grading);

	Grading saveAutoGrade(Grading grading);

	Grading saveAiGrade(Grading grading);

	void updateStatus(Long gradingId, GradingStatus status);

	/**
	 * Locks and returns the grading of a submission module, so a concurrent second auto-grading task
	 * blocks here and then observes the first one's terminal status.
	 */
	Optional<Grading> findBySubmissionModuleIdForUpdate(Long submissionModuleId);
}
