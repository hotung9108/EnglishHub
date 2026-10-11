package com.english_hub.core.modules.grading.infrastructure.service;

import com.english_hub.core.infrastructure.persistence.entity.Answer;
import com.english_hub.core.modules.grading.application.service.GradingAiAnalysisService;
import com.english_hub.core.modules.grading.application.port.AiAnalysisInFlightRegistry;
import com.english_hub.core.modules.grading.application.service.GradingAiResultPersistenceService;
import com.english_hub.core.modules.grading.domain.model.AnswerAnnotation;
import com.english_hub.core.modules.grading.domain.model.Grading;
import com.english_hub.core.modules.grading.domain.model.GradingContext;
import com.english_hub.core.modules.grading.domain.model.GradingStatus;
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
import java.util.ArrayList;
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
	private final GradingAiResultPersistenceService gradingAiResultPersistenceService;
	private final AiAnalysisInFlightRegistry aiAnalysisInFlightRegistry;
	private final StorageService storageService;
	private final AiServiceClient aiServiceClient;
	private final String configuredModel;
	private final String configuredProvider;

	@Autowired
	public GradingAiAnalysisServiceImpl(
			GradingRepository gradingRepository,
			GradingContextRepository gradingContextRepository,
			SpringDataAnswerRepository answerRepository,
			GradingAiResultPersistenceService gradingAiResultPersistenceService,
			AiAnalysisInFlightRegistry aiAnalysisInFlightRegistry,
			StorageService storageService,
			AiServiceClient aiServiceClient,
			@Value("${app.ai-service.model:}") String configuredModel,
			@Value("${app.ai-service.provider:}") String configuredProvider) {
		this.gradingRepository = gradingRepository;
		this.gradingContextRepository = gradingContextRepository;
		this.answerRepository = answerRepository;
		this.gradingAiResultPersistenceService = gradingAiResultPersistenceService;
		this.aiAnalysisInFlightRegistry = aiAnalysisInFlightRegistry;
		this.storageService = storageService;
		this.aiServiceClient = aiServiceClient;
		this.configuredModel = configuredModel;
		this.configuredProvider = configuredProvider;
	}

	public GradingAiAnalysisServiceImpl(
			GradingRepository gradingRepository,
			GradingContextRepository gradingContextRepository,
			SpringDataAnswerRepository answerRepository,
			GradingAiResultPersistenceService gradingAiResultPersistenceService,
			AiAnalysisInFlightRegistry aiAnalysisInFlightRegistry,
			StorageService storageService,
			AiServiceClient aiServiceClient) {
		this(
				gradingRepository,
				gradingContextRepository,
				answerRepository,
				gradingAiResultPersistenceService,
				aiAnalysisInFlightRegistry,
				storageService,
				aiServiceClient,
				null,
				null);
	}

	@Override
	@Async("gradingAiExecutor")
	public void analyzeSubmittedModule(long submissionModuleId) {
		LOGGER.info("AI analysis started for submission module {}", submissionModuleId);
		try {
			Optional<Grading> gradingOpt = gradingRepository.findBySubmissionModuleId(submissionModuleId);
			if (gradingOpt.isEmpty()) {
				LOGGER.warn("Grading record not found for submission module {}", submissionModuleId);
				return;
			}
			Grading grading = gradingOpt.get();
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
			LOGGER.error("AI analysis failed for submission module {}. Marking pending grading as failed: {}",
					submissionModuleId, e.getClass().getSimpleName());
			try {
				gradingAiResultPersistenceService.markFailedIfStillPending(submissionModuleId);
			} catch (RuntimeException failure) {
				LOGGER.error(
						"Could not mark AI analysis as failed for submission module {}: {}",
						submissionModuleId,
						failure.getClass().getSimpleName());
			}
		} finally {
			aiAnalysisInFlightRegistry.release(submissionModuleId);
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

		double suggestedScore = suggestedScore(
				response.criteriaScores() == null ? null : response.criteriaScores().overallScore(),
				response.overallScore(),
				submissionModuleId,
				"speaking");
		LOGGER.info("AI Speaking Analysis completed for submissionModuleId {} (suggested score: {}, modelUsed: {}, providerUsed: {})",
				submissionModuleId, suggestedScore, response.modelUsed(), response.providerUsed());

		BigDecimal aiSuggestedScore = BigDecimal.valueOf(suggestedScore);
		String aiFeedback = response.aiFeedback();

		ObjectNode aiAnalysisDetails = formatSpeakingAnalysisDetails(response);

		Grading updatedGrading = grading.withAiSuggestion(aiSuggestedScore, aiFeedback, aiAnalysisDetails);
		List<AnswerAnnotation> annotations = validAnnotations(
				submissionModuleId,
				answer.getId(),
				response.annotations(),
				transcriptCodePointLength(response.aiTranscript()));
		if (!gradingAiResultPersistenceService.persistAiResult(updatedGrading, annotations)) {
			return;
		}

		LOGGER.info("AI speaking analysis completed successfully for submission module {} with suggested score {}",
				submissionModuleId, aiSuggestedScore);
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
		boolean textSubmission = content != null && !content.trim().isBlank();

		if (textSubmission) {
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

		double suggestedScore = suggestedScore(
				response.criteriaScores() == null ? null : response.criteriaScores().overallScore(),
				response.overallScore(),
				submissionModuleId,
				"writing");
		LOGGER.info("AI Writing Analysis completed for submissionModuleId {} (suggested score: {}, modelUsed: {}, providerUsed: {})",
				submissionModuleId, suggestedScore, response.modelUsed(), response.providerUsed());

		BigDecimal aiSuggestedScore = BigDecimal.valueOf(suggestedScore);
		String aiFeedback = response.aiFeedback();

		Object aiAnalysisDetails = formatWritingAnalysisDetails(response);

		Grading updatedGrading = grading.withAiSuggestion(aiSuggestedScore, aiFeedback, aiAnalysisDetails);
		Integer contentLength = textSubmission ? content.codePointCount(0, content.length()) : null;
		List<AnswerAnnotation> annotations = validAnnotations(
				submissionModuleId,
				answer.getId(),
				response.annotations(),
				contentLength);
		if (!gradingAiResultPersistenceService.persistAiResult(updatedGrading, annotations)) {
			return;
		}

		LOGGER.info("AI writing analysis completed successfully for submission module {} with suggested score {}",
				submissionModuleId, aiSuggestedScore);
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
				LOGGER.warn("Failed to parse AI transcript JSON: {}", e.getClass().getSimpleName());
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

	private double suggestedScore(Double criteriaScore, Double topLevelScore, long submissionModuleId, String pipeline) {
		if (criteriaScore == null || !Double.isFinite(criteriaScore)) {
			throw new IllegalStateException("AI response is missing a valid criteriaScores.overallScore.");
		}
		if (topLevelScore != null
				&& Double.isFinite(topLevelScore)
				&& BigDecimal.valueOf(criteriaScore).compareTo(BigDecimal.valueOf(topLevelScore)) != 0) {
			LOGGER.warn(
					"AI {} score fields differ for submissionModuleId {}: criteriaScores.overallScore={}, overallScore={}",
					pipeline,
					submissionModuleId,
					criteriaScore,
					topLevelScore);
		}
		return criteriaScore;
	}

	private List<AnswerAnnotation> validAnnotations(
			long submissionModuleId,
			long answerId,
			List<AiAnnotationDto> source,
			Integer contentLength) {
		if (source == null || source.isEmpty()) {
			return List.of();
		}
		List<AnswerAnnotation> valid = new ArrayList<>();
		for (AiAnnotationDto annotation : source) {
			try {
				valid.add(AnswerAnnotation.ai(
						answerId,
						annotation.startOffset(),
						annotation.endOffset(),
						contentLength,
						annotation.errorType(),
						annotation.comment(),
						annotation.suggestedFix()));
			} catch (IllegalArgumentException exception) {
				LOGGER.warn(
						"Skipping invalid AI annotation for submissionModuleId {} with range {}-{}",
						submissionModuleId,
						annotation.startOffset(),
						annotation.endOffset());
			}
		}
		return List.copyOf(valid);
	}

	private int transcriptCodePointLength(Object transcript) {
		if (transcript == null) {
			return 0;
		}
		try {
			com.fasterxml.jackson.databind.JsonNode words = OBJECT_MAPPER.readTree(transcript.toString());
			if (!words.isArray()) {
				return 0;
			}
			StringBuilder transcriptText = new StringBuilder();
			for (com.fasterxml.jackson.databind.JsonNode entry : words) {
				com.fasterxml.jackson.databind.JsonNode word = entry.get("word");
				if (word == null || word.isNull() || word.asText().isEmpty()) {
					continue;
				}
				if (!transcriptText.isEmpty()) {
					transcriptText.append(' ');
				}
				transcriptText.append(word.asText());
			}
			return transcriptText.codePointCount(0, transcriptText.length());
		} catch (Exception exception) {
			return 0;
		}
	}
}
