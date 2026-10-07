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
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiWritingAnalysisRequest;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiWritingAnalysisResponse;
import com.english_hub.core.modules.module.domain.model.ModuleSkill;
import com.english_hub.core.modules.submission.application.port.StorageService;
import com.english_hub.core.modules.submission.infrastructure.persistence.repository.SpringDataAnswerRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class GradingAiAnalysisServiceImpl implements GradingAiAnalysisService {

	private static final Logger LOGGER = LoggerFactory.getLogger(GradingAiAnalysisServiceImpl.class);
	private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

	private final GradingRepository gradingRepository;
	private final GradingContextRepository gradingContextRepository;
	private final SpringDataAnswerRepository answerRepository;
	private final AnswerAnnotationRepository answerAnnotationRepository;
	private final StorageService storageService;
	private final AiServiceClient aiServiceClient;
	private final String configuredModel;
	private final String configuredProvider;

	@Autowired
	public GradingAiAnalysisServiceImpl(
			GradingRepository gradingRepository,
			GradingContextRepository gradingContextRepository,
			SpringDataAnswerRepository answerRepository,
			AnswerAnnotationRepository answerAnnotationRepository,
			StorageService storageService,
			AiServiceClient aiServiceClient,
			@Value("${app.ai-service.model:}") String configuredModel,
			@Value("${app.ai-service.provider:}") String configuredProvider) {
		this.gradingRepository = gradingRepository;
		this.gradingContextRepository = gradingContextRepository;
		this.answerRepository = answerRepository;
		this.answerAnnotationRepository = answerAnnotationRepository;
		this.storageService = storageService;
		this.aiServiceClient = aiServiceClient;
		this.configuredModel = configuredModel;
		this.configuredProvider = configuredProvider;
	}

	public GradingAiAnalysisServiceImpl(
			GradingRepository gradingRepository,
			GradingContextRepository gradingContextRepository,
			SpringDataAnswerRepository answerRepository,
			AnswerAnnotationRepository answerAnnotationRepository,
			StorageService storageService,
			AiServiceClient aiServiceClient) {
		this(gradingRepository, gradingContextRepository, answerRepository, answerAnnotationRepository, storageService, aiServiceClient, null, null);
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
				handleSpeakingAnalysis(grading, submissionModuleId, context.moduleInstructions());
			} else if (context.moduleSkill() == ModuleSkill.WRITING) {
				handleWritingAnalysis(grading, submissionModuleId, context.moduleInstructions());
			} else {
				LOGGER.info("Skill {} AI analysis not supported yet; keeping status as PENDING.", context.moduleSkill());
			}
		} catch (Exception e) {
			LOGGER.error("AI analysis failed for submission module {}. Falling back to FAILED status (PP 6.5.2): {}",
					submissionModuleId, e.getMessage(), e);
			gradingRepository.updateStatus(grading.id(), GradingStatus.FAILED);
		}
	}

	private void handleSpeakingAnalysis(Grading grading, long submissionModuleId, String moduleInstructions) {
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
		String targetModel = (configuredModel != null && !configuredModel.isBlank()) ? configuredModel.trim() : null;
		String targetProvider = (configuredProvider != null && !configuredProvider.isBlank()) ? configuredProvider.trim() : null;

		AiSpeakingAnalysisRequest request = new AiSpeakingAnalysisRequest(
				submissionModuleId,
				presignedGetUrl,
				audioBase64,
				storageKey,
				moduleInstructions,
				grading.aiInstructionSnapshot(),
				maxScore,
				targetModel,
				targetProvider
		);

		AiSpeakingAnalysisResponse response = aiServiceClient.analyzeSpeaking(request);
		if (response == null) {
			throw new IllegalStateException("Received null response from AI Service");
		}

		LOGGER.info("AI Speaking Analysis completed for submissionModuleId {} (score: {}, modelUsed: {}, providerUsed: {})",
				submissionModuleId, response.overallScore(), response.modelUsed(), response.providerUsed());

		BigDecimal finalScore = BigDecimal.valueOf(response.overallScore());
		String aiFeedback = response.aiFeedback();
		OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

		ObjectNode aiAnalysisDetails = formatSpeakingAnalysisDetails(response);

		Grading updatedGrading = grading.withAiGrade(finalScore, aiFeedback, aiAnalysisDetails, now);
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

	private void handleWritingAnalysis(Grading grading, long submissionModuleId, String moduleInstructions) {
		List<Answer> answers = answerRepository.findBySubmissionModuleId(submissionModuleId);
		if (answers.isEmpty()) {
			throw new IllegalStateException("No answer found for submission module " + submissionModuleId);
		}
		Answer answer = answers.getFirst();
		String content = answer.getContent();
		String docStorageKey = answer.getDocStorageKey();

		double maxScore = grading.maxScoreSnapshot() != null ? grading.maxScoreSnapshot().doubleValue() : 9.0;
		String targetModel = (configuredModel != null && !configuredModel.isBlank()) ? configuredModel.trim() : null;
		String targetProvider = (configuredProvider != null && !configuredProvider.isBlank()) ? configuredProvider.trim() : null;

		AiWritingAnalysisResponse response;

		if (content != null && !content.trim().isBlank()) {
			AiWritingAnalysisRequest request = new AiWritingAnalysisRequest(
					submissionModuleId,
					content,
					moduleInstructions,
					grading.aiInstructionSnapshot(),
					maxScore,
					targetModel,
					targetProvider
			);
			response = aiServiceClient.analyzeWriting(request);
		} else if (docStorageKey != null && !docStorageKey.isBlank()) {
			byte[] docBytes = storageService.getObjectBytes(docStorageKey);
			if (docBytes == null || docBytes.length == 0) {
				throw new IllegalStateException("Document bytes empty or not found for storageKey " + docStorageKey);
			}
			String filename = docStorageKey.contains("/")
					? docStorageKey.substring(docStorageKey.lastIndexOf('/') + 1)
					: docStorageKey;
			ByteArrayResource resource = new ByteArrayResource(docBytes) {
				@Override
				public String getFilename() {
					return filename;
				}
			};
			response = aiServiceClient.analyzeWritingUpload(
					submissionModuleId,
					resource,
					filename,
					moduleInstructions,
					grading.aiInstructionSnapshot(),
					maxScore,
					targetModel,
					targetProvider
			);
		} else {
			throw new IllegalStateException("Neither essay content nor docStorageKey found for answer " + answer.getId());
		}

		if (response == null) {
			throw new IllegalStateException("Received null response from AI Service for writing analysis");
		}

		LOGGER.info("AI Writing Analysis completed for submissionModuleId {} (score: {}, modelUsed: {}, providerUsed: {})",
				submissionModuleId, response.overallScore(), response.modelUsed(), response.providerUsed());

		BigDecimal finalScore = BigDecimal.valueOf(response.overallScore());
		String aiFeedback = response.aiFeedback();
		OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

		Object aiAnalysisDetails = formatWritingAnalysisDetails(response);

		Grading updatedGrading = grading.withAiGrade(finalScore, aiFeedback, aiAnalysisDetails, now);
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

		LOGGER.info("AI writing analysis completed successfully for submission module {} with score {}",
				submissionModuleId, finalScore);
	}

	private ObjectNode formatWritingAnalysisDetails(AiWritingAnalysisResponse response) {
		ObjectNode root = OBJECT_MAPPER.createObjectNode();
		if (response.criteriaScores() != null) {
			ObjectNode criteria = root.putObject("criteriaScores");
			criteria.put("taskResponse", response.criteriaScores().taskResponse());
			criteria.put("coherenceAndCohesion", response.criteriaScores().coherenceAndCohesion());
			criteria.put("lexicalResource", response.criteriaScores().lexicalResource());
			criteria.put("grammaticalRangeAndAccuracy", response.criteriaScores().grammaticalRangeAndAccuracy());
			criteria.put("overallScore", response.criteriaScores().overallScore());
		}
		if (response.textMetrics() != null) {
			ObjectNode metrics = root.putObject("textMetrics");
			metrics.put("wordCount", response.textMetrics().wordCount());
			metrics.put("sentenceCount", response.textMetrics().sentenceCount());
			metrics.put("averageSentenceLength", response.textMetrics().averageSentenceLength());
			metrics.put("lexicalDiversity", response.textMetrics().lexicalDiversity());
			metrics.put("fleschKincaidGrade", response.textMetrics().fleschKincaidGrade());
		}
		if (response.modelUsed() != null) {
			root.put("modelUsed", response.modelUsed());
		}
		if (response.providerUsed() != null) {
			root.put("providerUsed", response.providerUsed());
		}
		return root;
	}

	private ObjectNode formatSpeakingAnalysisDetails(AiSpeakingAnalysisResponse response) {
		ObjectNode root = OBJECT_MAPPER.createObjectNode();
		if (response.aiTranscript() != null) {
			try {
				root.set("transcript", OBJECT_MAPPER.readTree(response.aiTranscript().toString()));
			} catch (Exception e) {
				LOGGER.warn("Failed to parse aiTranscript into json tree: {}", e.getMessage());
			}
		}
		if (response.criteriaScores() != null) {
			ObjectNode criteria = root.putObject("criteriaScores");
			criteria.put("fluencyAndCoherence", response.criteriaScores().fluencyAndCoherence());
			criteria.put("lexicalResource", response.criteriaScores().lexicalResource());
			criteria.put("grammaticalRangeAndAccuracy", response.criteriaScores().grammaticalRangeAndAccuracy());
			criteria.put("pronunciation", response.criteriaScores().pronunciation());
			criteria.put("overallScore", response.criteriaScores().overallScore());
		}
		if (response.fluencyMetrics() != null) {
			ObjectNode metrics = root.putObject("fluencyMetrics");
			metrics.put("wordsPerMinute", response.fluencyMetrics().wordsPerMinute());
			metrics.put("pauseCount", response.fluencyMetrics().pauseCount());
			metrics.put("totalDurationSeconds", response.fluencyMetrics().totalDurationSeconds());
			metrics.put("phonationTimeRatio", response.fluencyMetrics().phonationTimeRatio());
		}
		if (response.modelUsed() != null) {
			root.put("modelUsed", response.modelUsed());
		}
		if (response.providerUsed() != null) {
			root.put("providerUsed", response.providerUsed());
		}
		return root;
	}
}
