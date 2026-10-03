package com.english_hub.core.modules.grading.domain.repository;

/**
 * Domain port for recording an auto-grading failure in its own transaction.
 *
 * <p>Separate from {@link GradingRepository} on purpose: the failure write happens after the
 * grading transaction has already rolled back, so it must not join it.
 */
public interface GradingFailureRepository {

	/** Marks the grading failed so the teacher sees it instead of an indefinitely pending row. */
	void markFailed(Long submissionModuleId);
}