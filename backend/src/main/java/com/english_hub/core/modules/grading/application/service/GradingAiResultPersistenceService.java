package com.english_hub.core.modules.grading.application.service;

import com.english_hub.core.modules.grading.domain.model.AnswerAnnotation;
import com.english_hub.core.modules.grading.domain.model.Grading;
import com.english_hub.core.modules.grading.domain.model.GradingStatus;
import com.english_hub.core.modules.grading.domain.repository.AnswerAnnotationRepository;
import com.english_hub.core.modules.grading.domain.repository.GradingRepository;
import java.util.List;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GradingAiResultPersistenceService {

	private static final Logger LOGGER = LoggerFactory.getLogger(GradingAiResultPersistenceService.class);

	private final GradingRepository gradingRepository;
	private final AnswerAnnotationRepository answerAnnotationRepository;

	public GradingAiResultPersistenceService(
			GradingRepository gradingRepository,
			AnswerAnnotationRepository answerAnnotationRepository) {
		this.gradingRepository = gradingRepository;
		this.answerAnnotationRepository = answerAnnotationRepository;
	}

	@Transactional
	public boolean persistAiResult(Grading aiGrade, List<AnswerAnnotation> annotations) {
		Grading current = gradingRepository.findBySubmissionModuleIdForUpdate(aiGrade.submissionModuleId())
				.orElseThrow();
		if (current.status() == GradingStatus.COMPLETED) {
			LOGGER.warn(
					"Ignoring AI result for completed grading: submissionModuleId={}, gradingId={}, status={}",
					current.submissionModuleId(),
					current.id(),
					current.status());
			return false;
		}
		if (!Objects.equals(current.id(), aiGrade.id())) {
			throw new IllegalStateException("AI result grading does not match the locked grading row.");
		}

		gradingRepository.saveAiGrade(aiGrade);
		for (AnswerAnnotation annotation : annotations) {
			answerAnnotationRepository.save(annotation);
		}
		return true;
	}

	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public void markFailedIfStillPending(long submissionModuleId) {
		gradingRepository.findBySubmissionModuleIdForUpdate(submissionModuleId).ifPresent(grading -> {
			if (grading.status() == GradingStatus.PENDING) {
				gradingRepository.updateStatus(grading.id(), GradingStatus.FAILED);
			}
		});
	}
}
