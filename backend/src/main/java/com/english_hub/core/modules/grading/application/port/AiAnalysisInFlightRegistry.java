package com.english_hub.core.modules.grading.application.port;

/** Tracks AI analysis requests that have been accepted but have not finished on this application instance. */
public interface AiAnalysisInFlightRegistry {

	boolean tryClaim(long submissionModuleId);

	void release(long submissionModuleId);
}
