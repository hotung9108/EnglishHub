package com.english_hub.core.modules.grading.domain.repository;

/** Domain port for flipping a submission module to its terminal graded state. */
public interface SubmissionModuleStatusRepository {

	/** Idempotent: a module that is already graded is left untouched. */
	void markGraded(Long submissionModuleId);
}