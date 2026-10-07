package com.english_hub.core.modules.grading.infrastructure.service;

import com.english_hub.core.modules.grading.application.service.AutoGradingFailureRecorder;
import com.english_hub.core.modules.grading.domain.repository.GradingFailureRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AutoGradingFailureRecorderImpl implements AutoGradingFailureRecorder {

	private static final Logger LOGGER = LoggerFactory.getLogger(AutoGradingFailureRecorderImpl.class);

	private final GradingFailureRepository gradingFailureRepository;

	public AutoGradingFailureRecorderImpl(GradingFailureRepository gradingFailureRepository) {
		this.gradingFailureRepository = gradingFailureRepository;
	}

	@Override
	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public void recordFailed(long submissionModuleId, Throwable cause) {
		LOGGER.error("Auto grading failed for submission module {}.", submissionModuleId, cause);
		gradingFailureRepository.markFailed(submissionModuleId);
	}
}