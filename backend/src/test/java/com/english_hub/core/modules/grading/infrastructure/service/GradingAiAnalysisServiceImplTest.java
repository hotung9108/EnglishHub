package com.english_hub.core.modules.grading.infrastructure.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.english_hub.core.infrastructure.persistence.entity.Answer;
import com.english_hub.core.infrastructure.persistence.entity.UploadStatus;
import com.english_hub.core.modules.grading.domain.model.AnnotationSource;
import com.english_hub.core.modules.grading.domain.model.AnswerAnnotation;
import com.english_hub.core.modules.grading.domain.model.Grading;
import com.english_hub.core.modules.grading.domain.model.GradingContext;
import com.english_hub.core.modules.grading.domain.model.GradingMethod;
import com.english_hub.core.modules.grading.domain.model.GradingStatus;
import com.english_hub.core.modules.grading.domain.model.ReviewStatus;
import com.english_hub.core.modules.grading.domain.repository.AnswerAnnotationRepository;
import com.english_hub.core.modules.grading.domain.repository.GradingContextRepository;
import com.english_hub.core.modules.grading.domain.repository.GradingRepository;
import com.english_hub.core.modules.grading.infrastructure.client.AiServiceClient;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiAnnotationDto;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiSpeakingAnalysisRequest;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiSpeakingAnalysisResponse;
import com.english_hub.core.modules.grading.infrastructure.client.dto.CriteriaScoresDto;
import com.english_hub.core.modules.grading.infrastructure.client.dto.FluencyMetricsDto;
import com.english_hub.core.modules.module.domain.model.ModuleSkill;
import com.english_hub.core.modules.submission.application.port.StorageService;
import com.english_hub.core.modules.submission.infrastructure.persistence.repository.SpringDataAnswerRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GradingAiAnalysisServiceImplTest {

	@Mock
	private GradingRepository gradingRepository;

	@Mock
	private GradingContextRepository gradingContextRepository;

	@Mock
	private SpringDataAnswerRepository answerRepository;

	@Mock
	private AnswerAnnotationRepository answerAnnotationRepository;

	@Mock
	private StorageService storageService;

	@Mock
	private AiServiceClient aiServiceClient;

	private GradingAiAnalysisServiceImpl service;
	private final ObjectMapper objectMapper = new ObjectMapper();

	@BeforeEach
	void setUp() {
		service = new GradingAiAnalysisServiceImpl(
				gradingRepository,
				gradingContextRepository,
				answerRepository,
				answerAnnotationRepository,
				storageService,
				aiServiceClient);
	}

	@Test
	void successfulSpeakingAnalysis_updatesGradingAndSavesAnnotations() {
		long submissionModuleId = 101L;
		Grading grading = new Grading(
				1L,
				submissionModuleId,
				GradingMethod.AUTO,
				GradingStatus.PENDING,
				null,
				null,
				null,
				BigDecimal.valueOf(9.0),
				null,
				null,
				null,
				null,
				"Assess candidate with IELTS Speaking rubric");

		GradingContext context = new GradingContext(
				submissionModuleId,
				null,
				200L,
				10L,
				5L,
				2L,
				15L,
				ModuleSkill.SPEAKING,
				true,
				null);

		Answer answer = new Answer(
				submissionModuleId,
				null,
				null,
				"submissions/200/speaking-101.wav",
				45,
				720000L,
				"audio/wav",
				UploadStatus.READY,
				null,
				null,
				null,
				null);

		when(gradingRepository.findBySubmissionModuleId(submissionModuleId)).thenReturn(Optional.of(grading));
		when(gradingContextRepository.findBySubmissionModuleId(submissionModuleId)).thenReturn(Optional.of(context));
		when(answerRepository.findBySubmissionModuleId(submissionModuleId)).thenReturn(List.of(answer));
		when(storageService.generatePresignedGetUrl("submissions/200/speaking-101.wav"))
				.thenReturn("https://storage.example.com/audio.wav?signed=true");

		ArrayNode mockTranscript = objectMapper.createArrayNode();
		mockTranscript.addObject()
				.put("word", "Hello")
				.put("start", 0.1)
				.put("end", 0.5)
				.put("confidence", 0.98);

		AiSpeakingAnalysisResponse aiResponse = new AiSpeakingAnalysisResponse(
				submissionModuleId,
				7.0,
				"Overall good coherence and fluent pace.",
				mockTranscript,
				new FluencyMetricsDto(135.0, 3, 44.5, 0.78),
				new CriteriaScoresDto(7.0, 7.0, 7.0, 7.0, 7.0),
				List.of(new AiAnnotationDto(10, 16, "pronunciation", "Mispronounced habit", "habits"))
		);

		when(aiServiceClient.analyzeSpeaking(any(AiSpeakingAnalysisRequest.class))).thenReturn(aiResponse);

		service.analyzeSubmittedModule(submissionModuleId);

		ArgumentCaptor<Grading> gradingCaptor = ArgumentCaptor.forClass(Grading.class);
		verify(gradingRepository).saveAiGrade(gradingCaptor.capture());
		Grading saved = gradingCaptor.getValue();

		assertThat(saved.status()).isEqualTo(GradingStatus.AI_GRADED);
		assertThat(saved.method()).isEqualTo(GradingMethod.AUTO);
		assertThat(saved.finalScore()).isEqualByComparingTo(BigDecimal.valueOf(7.0));
		assertThat(saved.aiFeedback()).contains("Overall good coherence");
		assertThat(saved.aiTranscript()).isNotNull();

		ArgumentCaptor<AnswerAnnotation> annotationCaptor = ArgumentCaptor.forClass(AnswerAnnotation.class);
		verify(answerAnnotationRepository).save(annotationCaptor.capture());
		AnswerAnnotation ann = annotationCaptor.getValue();
		assertThat(ann.source()).isEqualTo(AnnotationSource.AI);
		assertThat(ann.reviewStatus()).isEqualTo(ReviewStatus.PENDING);
		assertThat(ann.errorType()).isEqualTo("pronunciation");
		assertThat(ann.startOffset()).isEqualTo(10);
		assertThat(ann.endOffset()).isEqualTo(16);
	}

	@Test
	void aiServiceFailure_fallsBackToFailedStatusPerPP652() {
		long submissionModuleId = 102L;
		Grading grading = new Grading(
				2L,
				submissionModuleId,
				GradingMethod.AUTO,
				GradingStatus.PENDING,
				null,
				null,
				null,
				BigDecimal.valueOf(9.0),
				null,
				null,
				null,
				null,
				null);

		GradingContext context = new GradingContext(
				submissionModuleId,
				null,
				200L,
				10L,
				5L,
				2L,
				15L,
				ModuleSkill.SPEAKING,
				true,
				null);

		Answer answer = new Answer(
				submissionModuleId,
				null,
				null,
				"submissions/200/speaking-102.wav",
				45,
				720000L,
				"audio/wav",
				UploadStatus.READY,
				null,
				null,
				null,
				null);

		when(gradingRepository.findBySubmissionModuleId(submissionModuleId)).thenReturn(Optional.of(grading));
		when(gradingContextRepository.findBySubmissionModuleId(submissionModuleId)).thenReturn(Optional.of(context));
		when(answerRepository.findBySubmissionModuleId(submissionModuleId)).thenReturn(List.of(answer));
		when(storageService.generatePresignedGetUrl("submissions/200/speaking-102.wav"))
				.thenReturn("https://storage.example.com/audio.wav");

		when(aiServiceClient.analyzeSpeaking(any(AiSpeakingAnalysisRequest.class)))
				.thenThrow(new RuntimeException("Gemini Flash API rate limit exceeded or timeout"));

		service.analyzeSubmittedModule(submissionModuleId);

		// Verified that failure is isolated, and status is updated to FAILED so teachers can manually grade
		verify(gradingRepository).updateStatus(2L, GradingStatus.FAILED);
		verify(gradingRepository, never()).saveAiGrade(any());
		verifyNoInteractions(answerAnnotationRepository);
	}

	@Test
	void missingAudioKey_fallsBackToFailedStatus() {
		long submissionModuleId = 103L;
		Grading grading = new Grading(
				3L,
				submissionModuleId,
				GradingMethod.AUTO,
				GradingStatus.PENDING,
				null,
				null,
				null,
				BigDecimal.valueOf(9.0),
				null,
				null,
				null,
				null,
				null);

		GradingContext context = new GradingContext(
				submissionModuleId,
				null,
				200L,
				10L,
				5L,
				2L,
				15L,
				ModuleSkill.SPEAKING,
				true,
				null);

		Answer answerWithoutAudio = new Answer(
				submissionModuleId,
				null,
				null,
				null,
				null,
				null,
				null,
				UploadStatus.FAILED,
				null,
				null,
				null,
				null);

		when(gradingRepository.findBySubmissionModuleId(submissionModuleId)).thenReturn(Optional.of(grading));
		when(gradingContextRepository.findBySubmissionModuleId(submissionModuleId)).thenReturn(Optional.of(context));
		when(answerRepository.findBySubmissionModuleId(submissionModuleId)).thenReturn(List.of(answerWithoutAudio));

		service.analyzeSubmittedModule(submissionModuleId);

		verify(gradingRepository).updateStatus(3L, GradingStatus.FAILED);
		verifyNoInteractions(aiServiceClient);
	}
}
