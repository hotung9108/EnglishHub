package com.english_hub.core.modules.grading.infrastructure.adapter;

import com.english_hub.core.modules.grading.application.port.AiAnalysisInFlightRegistry;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class InMemoryAiAnalysisInFlightRegistry implements AiAnalysisInFlightRegistry {

	private final Set<Long> inFlightSubmissionModuleIds = ConcurrentHashMap.newKeySet();

	@Override
	public boolean tryClaim(long submissionModuleId) {
		return inFlightSubmissionModuleIds.add(submissionModuleId);
	}

	@Override
	public void release(long submissionModuleId) {
		inFlightSubmissionModuleIds.remove(submissionModuleId);
	}
}
