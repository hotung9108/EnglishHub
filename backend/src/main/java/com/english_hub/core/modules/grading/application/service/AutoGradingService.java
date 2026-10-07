package com.english_hub.core.modules.grading.application.service;

/** Use case that scores one submitted module by comparing its answers to the expected answers. */
public interface AutoGradingService {

	/**
	 * Runs synchronously on the auto-grading executor; the caller never waits for it. Safe to call
	 * more than once for the same module: a second call observes the terminal grading status and
	 * returns without scoring.
	 */
	void grade(long submissionModuleId);
}