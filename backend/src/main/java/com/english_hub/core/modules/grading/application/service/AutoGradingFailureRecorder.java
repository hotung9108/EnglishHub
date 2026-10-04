package com.english_hub.core.modules.grading.application.service;

/**
 * Records an auto-grading failure outside the grading transaction.
 *
 * <p>Lives in its own bean because {@code Propagation.REQUIRES_NEW} is bypassed by self-invocation,
 * and the grading transaction is already rolled back by the time this runs.
 */
public interface AutoGradingFailureRecorder {

	void recordFailed(long submissionModuleId, Throwable cause);
}