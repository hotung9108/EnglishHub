package com.english_hub.core.modules.grading.infrastructure.service;

import com.english_hub.core.infrastructure.persistence.entity.Answer;
import com.english_hub.core.modules.grading.application.service.GradingAiAnalysisService;
import com.english_hub.core.modules.grading.domain.model.AnswerAnnotation;
import com.english_hub.core.modules.grading.domain.model.Grading;
import com.english_hub.core.modules.grading.domain.model.GradingContext;
import com.english_hub.core.modules.grading.domain.model.GradingStatus;
import com.english_hub.core.modules.grading.domain.repository.AnswerAnnotationRepository;
import com.english_hub.core.modules.grading.domain.repository.GradingContextRepository;
import com.english_hub.core.modules.grading.domain.repository.GradingRepository;
import com.english_hub.core.modules.grading.infrastructure.client.AiServiceClient;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiAnnotationDto;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiSpeakingAnalysisRequest;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiSpeakingAnalysisResponse;
import com.english_hub.core.modules.module.domain.model.ModuleSkill;
import com.english_hub.core.modules.submission.application.port.StorageService;
import com.english_hub.core.modules.submission.infrastructure.persistence.repository.SpringDataAnswerRepository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class GradingAiAnalysisServiceImpl implements GradingAiAnalysisService {

	private static final Logger LOGGER = LoggerFactory.getLogger(GradingAiAnalysisServiceImpl.class);

	private final GradingRepository gradingRepository;
	private final GradingContextRepository gradingContextRepository;
	private final SpringDataAnswerRepository answerRepository;
	private final AnswerAnnotationRepository answerAnnotationRepository;
	private final StorageService storageService;
	private final AiServiceClient aiServiceClient;

	public GradingAiAnalysisServiceImpl(
			GradingRepository gradingRepository,
			GradingContextRepository gradingContextRepository,
			SpringDataAnswerRepository answerRepository,
			AnswerAnnotationRepository answerAnnotationRepository,
			StorageService storageService,
			AiServiceClient aiServiceClient) {
		this.gradingRepository = gradingRepository;
		this.gradingContextRepository = gradingContextRepository;
		this.answerRepository = answerRepository;
		this.answerAnnotationRepository = answerAnnotationRepository;
		this.storageService = storageService;
		this.aiServiceClient = aiServiceClient;
	}

	@Override
	@Async("gradingAiExecutor")
	public void analyzeSubmittedModule(long submissionModuleId) {
		LOGGER.info("AI analysis started for submission module {}", submissionModuleId);
		Optional<Grading> gradingOpt = gradingRepository.findBySubmissionModuleId(submissionModuleId);
		if (gradingOpt.isEmpty()) {
			LOGGER.warn("Grading record not found for submission module {}", submissionModuleId);
			return;
		}
		Grading grading = gradingOpt.get();

		try {
			Optional<GradingContext> contextOpt = gradingContextRepository.findBySubmissionModuleId(submissionModuleId);
			if (contextOpt.isEmpty()) {
				throw new IllegalStateException("GradingContext not found for submission module " + submissionModuleId);
			}
			GradingContext context = contextOpt.get();

			if (context.moduleSkill() == ModuleSkill.SPEAKING) {
				handleSpeakingAnalysis(grading, submissionModuleId);
			} else {
				LOGGER.info("Skill {} AI analysis not supported yet; keeping status as PENDING.", context.moduleSkill());
			}
		} catch (Exception e) {
			LOGGER.error("AI analysis failed for submission module {}. Falling back to FAILED status (PP 6.5.2): {}",
					submissionModuleId, e.getMessage(), e);
			gradingRepository.updateStatus(grading.id(), GradingStatus.FAILED);
		}
	}

	private void handleSpeakingAnalysis(Grading grading, long submissionModuleId) {
		List<Answer> answers = answerRepository.findBySubmissionModuleId(submissionModuleId);
		if (answers.isEmpty()) {
			throw new IllegalStateException("No answer found for submission module " + submissionModuleId);
		}
		Answer answer = answers.getFirst();
		String storageKey = answer.getAudioStorageKey();
		if (storageKey == null || storageKey.isBlank()) {
			throw new IllegalStateException("No audio storage key found for answer " + answer.getId());
		}

		String presignedGetUrl = null;
		String audioBase64 = null;
		try {
			presignedGetUrl = storageService.generatePresignedGetUrl(storageKey);
		} catch (Exception ex) {
			LOGGER.warn("Failed to generate presigned GET URL for storageKey {}: {}", storageKey, ex.getMessage());
		}

		if (presignedGetUrl == null || presignedGetUrl.isBlank()) {
			try {
				byte[] audioBytes = storageService.getObjectBytes(storageKey);
				if (audioBytes != null && audioBytes.length > 0) {
					audioBase64 = Base64.getEncoder().encodeToString(audioBytes);
				}
			} catch (Exception ex) {
				LOGGER.warn("Failed to fetch object bytes for storageKey {}: {}", storageKey, ex.getMessage());
			}
		}

		double maxScore = grading.maxScoreSnapshot() != null ? grading.maxScoreSnapshot().doubleValue() : 9.0;
		AiSpeakingAnalysisRequest request = new AiSpeakingAnalysisRequest(
				submissionModuleId,
				presignedGetUrl,
				audioBase64,
				storageKey,
				null,
				grading.aiInstructionSnapshot(),
				maxScore
		);

		AiSpeakingAnalysisResponse response = aiServiceClient.analyzeSpeaking(request);
		if (response == null) {
			throw new IllegalStateException("Received null response from AI Service");
		}

		BigDecimal finalScore = BigDecimal.valueOf(response.overallScore());
		String aiFeedback = response.aiFeedback();
		OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

		Grading updatedGrading = grading.withAiGrade(finalScore, aiFeedback, response.aiTranscript(), now);
		gradingRepository.saveAiGrade(updatedGrading);

		if (response.annotations() != null && !response.annotations().isEmpty()) {
			for (AiAnnotationDto ann : response.annotations()) {
				AnswerAnnotation annotation = AnswerAnnotation.ai(
						answer.getId(),
						ann.startOffset(),
						ann.endOffset(),
						null,
						ann.errorType(),
						ann.comment(),
						ann.suggestedFix()
				);
				answerAnnotationRepository.save(annotation);
			}
		}

		LOGGER.info("AI speaking analysis completed successfully for submission module {} with score {}",
				submissionModuleId, finalScore);
	}
}
