package com.english_hub.core.modules.grading.infrastructure.service;

import com.english_hub.core.modules.grading.application.service.GradingAiAnalysisService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/** Stub until an AI provider is approved and integrated. */
@Service
public class GradingAiAnalysisServiceImpl implements GradingAiAnalysisService {

	private static final Logger LOGGER = LoggerFactory.getLogger(GradingAiAnalysisServiceImpl.class);

	@Override
	@Async("gradingAiExecutor")
	public void analyzeSubmittedModule(long submissionModuleId) {
		LOGGER.info(
				"AI analysis request accepted for submission module {}. No provider is configured; grading remains PENDING.",
				submissionModuleId);
	}
}
