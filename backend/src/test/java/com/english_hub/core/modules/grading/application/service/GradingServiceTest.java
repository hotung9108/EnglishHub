package com.english_hub.core.modules.grading.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.modules.grading.domain.model.AnnotationSource;
import com.english_hub.core.modules.grading.domain.model.AnswerAnnotation;
import com.english_hub.core.modules.grading.domain.model.Grading;
import com.english_hub.core.modules.grading.domain.model.GradingChangeLog;
import com.english_hub.core.modules.grading.domain.model.GradingContext;
import com.english_hub.core.modules.grading.domain.model.GradingMethod;
import com.english_hub.core.modules.grading.domain.model.GradingStatus;
import com.english_hub.core.modules.grading.domain.model.ReviewStatus;
import com.english_hub.core.modules.grading.application.port.AiAnalysisInFlightRegistry;
import com.english_hub.core.modules.grading.domain.repository.AnswerAnnotationRepository;
import com.english_hub.core.modules.grading.domain.repository.GradingChangeLogRepository;
import com.english_hub.core.modules.grading.domain.repository.GradingContextRepository;
import com.english_hub.core.modules.grading.domain.repository.GradingRepository;
import com.english_hub.core.modules.classroom.domain.repository.ClassRepository;
import com.english_hub.core.modules.module.domain.model.ModuleSkill;
import com.english_hub.core.modules.module.domain.model.ModuleTaskType;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.domain.model.User;
import com.english_hub.core.modules.user.domain.repository.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@ExtendWith(MockitoExtension.class)
class GradingServiceTest {

	@Mock
	private GradingRepository gradingRepository;

	@Mock
	private AnswerAnnotationRepository answerAnnotationRepository;

	@Mock
	private GradingChangeLogRepository gradingChangeLogRepository;

	@Mock
	private GradingContextRepository gradingContextRepository;

	@Mock
	private ClassRepository classRepository;

	@Mock
	private CurrentUserProvider currentUserProvider;

	@Mock
	private UserRepository userRepository;

	@Mock
	private GradingAiAnalysisService gradingAiAnalysisService;

	@Mock
	private GradingAiResultPersistenceService gradingAiResultPersistenceService;

	@Mock
	private AiAnalysisInFlightRegistry aiAnalysisInFlightRegistry;

	@Mock
	private com.english_hub.core.modules.submission.infrastructure.persistence.repository.SpringDataAnswerRepository answerRepository;

	private GradingService gradingService;

	@BeforeEach
	void setUp() {
		gradingService = new GradingService(
				gradingRepository,
				answerAnnotationRepository,
				gradingChangeLogRepository,
				gradingContextRepository,
				classRepository,
				currentUserProvider,
				userRepository,
				gradingAiAnalysisService,
				gradingAiResultPersistenceService,
				aiAnalysisInFlightRegistry,
				answerRepository);
	}

	@Test
	void rejectsFinalScoreAboveMaxScoreSnapshot() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(20L, UserRole.TEACHER));
		when(gradingRepository.findBySubmissionModuleIdForUpdate(14L)).thenReturn(Optional.of(grading(5L, bd("10.00"), bd("7.00"),
				GradingStatus.PENDING)));
		when(gradingContextRepository.findByGradingId(5L)).thenReturn(Optional.of(context(20L, ModuleSkill.WRITING)));

		assertThatExceptionOfType(ApiException.class)
				.isThrownBy(() -> gradingService.updateFinalGrade(5L, bd("10.01"), "Feedback", null))
				.satisfies(exception -> assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
		verify(gradingRepository, never()).saveTeacherGrade(any());
		verifyNoInteractions(gradingChangeLogRepository);
	}

	@Test
	void rejectsNegativeFinalScore() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(20L, UserRole.TEACHER));
		when(gradingRepository.findBySubmissionModuleIdForUpdate(14L)).thenReturn(Optional.of(grading(5L, bd("10.00"), bd("7.00"),
				GradingStatus.PENDING)));
		when(gradingContextRepository.findByGradingId(5L)).thenReturn(Optional.of(context(20L, ModuleSkill.WRITING)));

		assertThatExceptionOfType(ApiException.class)
				.isThrownBy(() -> gradingService.updateFinalGrade(5L, bd("-0.01"), "Feedback", null))
				.satisfies(exception -> assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
		verify(gradingRepository, never()).saveTeacherGrade(any());
		verifyNoInteractions(gradingChangeLogRepository);
	}

	@Test
	void savesTeacherGradeAndAppendsChangeLogWhenScoreChanges() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(20L, UserRole.TEACHER));
		when(gradingRepository.findBySubmissionModuleIdForUpdate(14L)).thenReturn(Optional.of(grading(5L, bd("10.00"), bd("7.00"),
				GradingStatus.PENDING)));
		when(gradingContextRepository.findByGradingId(5L)).thenReturn(Optional.of(context(20L, ModuleSkill.WRITING)));
		when(gradingRepository.saveTeacherGrade(any())).thenAnswer(invocation -> invocation.getArgument(0));

		gradingService.updateFinalGrade(5L, bd("8.50"), "Clear argument", "Rubric review");

		ArgumentCaptor<Grading> gradingCaptor = ArgumentCaptor.forClass(Grading.class);
		verify(gradingRepository).saveTeacherGrade(gradingCaptor.capture());
		assertThat(gradingCaptor.getValue().finalScore()).isEqualByComparingTo("8.50");
		assertThat(gradingCaptor.getValue().status()).isEqualTo(GradingStatus.COMPLETED);
		assertThat(gradingCaptor.getValue().method()).isEqualTo(GradingMethod.TEACHER_MANUAL);

		ArgumentCaptor<GradingChangeLog> logCaptor = ArgumentCaptor.forClass(GradingChangeLog.class);
		verify(gradingChangeLogRepository).save(logCaptor.capture());
		assertThat(logCaptor.getValue().oldScore()).isEqualByComparingTo("7.00");
		assertThat(logCaptor.getValue().newScore()).isEqualByComparingTo("8.50");
		assertThat(logCaptor.getValue().changedBy()).isEqualTo(20L);
		assertThat(logCaptor.getValue().note()).isEqualTo("Rubric review");
	}

	@Test
	void acceptsFinalScoreEqualToMaxScoreSnapshot() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(20L, UserRole.TEACHER));
		when(gradingRepository.findBySubmissionModuleIdForUpdate(14L)).thenReturn(Optional.of(grading(5L, bd("10.00"), bd("7.00"),
				GradingStatus.PENDING)));
		when(gradingContextRepository.findByGradingId(5L)).thenReturn(Optional.of(context(20L, ModuleSkill.WRITING)));
		when(gradingRepository.saveTeacherGrade(any())).thenAnswer(invocation -> invocation.getArgument(0));

		gradingService.updateFinalGrade(5L, bd("10.00"), "Full marks", null);

		verify(gradingRepository).saveTeacherGrade(any());
		verify(gradingChangeLogRepository).save(any());
	}

	@Test
	void numericallyEqualScoreDoesNotAppendChangeLog() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(20L, UserRole.TEACHER));
		when(gradingRepository.findBySubmissionModuleIdForUpdate(14L)).thenReturn(Optional.of(grading(5L, bd("10.00"), bd("7.00"),
				GradingStatus.PENDING)));
		when(gradingContextRepository.findByGradingId(5L)).thenReturn(Optional.of(context(20L, ModuleSkill.WRITING)));
		when(gradingRepository.saveTeacherGrade(any())).thenAnswer(invocation -> invocation.getArgument(0));

		gradingService.updateFinalGrade(5L, bd("7.0"), "Same score", null);

		verify(gradingRepository).saveTeacherGrade(any());
		verifyNoInteractions(gradingChangeLogRepository);
	}

	@Test
	void feedbackOnlyChangeDoesNotAppendChangeLog() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(20L, UserRole.TEACHER));
		when(gradingRepository.findBySubmissionModuleIdForUpdate(14L)).thenReturn(Optional.of(grading(5L, bd("10.00"), bd("7.00"),
				GradingStatus.PENDING)));
		when(gradingContextRepository.findByGradingId(5L)).thenReturn(Optional.of(context(20L, ModuleSkill.WRITING)));
		when(gradingRepository.saveTeacherGrade(any())).thenAnswer(invocation -> invocation.getArgument(0));

		gradingService.updateFinalGrade(5L, bd("7.00"), "Updated feedback", null);

		verify(gradingRepository).saveTeacherGrade(any());
		verifyNoInteractions(gradingChangeLogRepository);
	}

	@Test
	void forbidsTeacherWhoDoesNotOwnTheClassFromChangingScore() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(20L, UserRole.TEACHER));
		when(gradingContextRepository.findByGradingId(5L)).thenReturn(Optional.of(context(99L, ModuleSkill.WRITING)));

		assertThatExceptionOfType(ApiException.class)
				.isThrownBy(() -> gradingService.updateFinalGrade(5L, bd("8.50"), "Feedback", null))
				.satisfies(exception -> assertThat(exception.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
		verify(gradingRepository, never()).saveTeacherGrade(any());
		verifyNoInteractions(gradingChangeLogRepository);
	}

	@Test
	void teacherCreatedAnnotationIsAcceptedImmediately() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(20L, UserRole.TEACHER));
		when(gradingContextRepository.findByAnswerId(8L)).thenReturn(Optional.of(context(20L, ModuleSkill.WRITING)));
		when(answerAnnotationRepository.save(any())).thenAnswer(invocation -> {
			AnswerAnnotation annotation = invocation.getArgument(0);
			return new AnswerAnnotation(
					90L,
					annotation.answerId(),
					annotation.source(),
					annotation.startOffset(),
					annotation.endOffset(),
					annotation.errorType(),
					annotation.comment(),
					annotation.suggestedFix(),
					annotation.reviewStatus());
		});

		Long id = gradingService.createTeacherAnnotation(8L, 12, 20, "vocabulary", "Use formal wording", "significant");

		ArgumentCaptor<AnswerAnnotation> captor = ArgumentCaptor.forClass(AnswerAnnotation.class);
		verify(answerAnnotationRepository).save(captor.capture());
		assertThat(id).isEqualTo(90L);
		assertThat(captor.getValue().source()).isEqualTo(AnnotationSource.TEACHER);
		assertThat(captor.getValue().reviewStatus()).isEqualTo(ReviewStatus.ACCEPTED);
	}

	@Test
	void rejectsAnnotationOutsideAnswerContent() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(20L, UserRole.TEACHER));
		when(gradingContextRepository.findByAnswerId(8L))
				.thenReturn(Optional.of(new GradingContext(14L, 6L, 8L, 7L, 3L, 2L, 20L, 41L,
						ModuleSkill.WRITING, true, 16, ModuleTaskType.ESSAY, null)));

		assertThatExceptionOfType(ApiException.class)
				.isThrownBy(() -> gradingService.createTeacherAnnotation(
						8L, 0, 17, "grammar", "Comment", "Fix"))
				.satisfies(exception -> assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
		verifyNoInteractions(answerAnnotationRepository);
	}

	@Test
	void aiAnalysisStubLeavesExistingPendingGradingAndAnnotationsUntouched() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(20L, UserRole.TEACHER));
		when(gradingContextRepository.findBySubmissionModuleId(14L))
				.thenReturn(Optional.of(new GradingContext(
						14L, 6L, null, 7L, 3L, 2L, 20L, 41L, ModuleSkill.SPEAKING, true, null,
						ModuleTaskType.RECORDING, null)));
		Grading pending = grading(5L, bd("10.00"), null, GradingStatus.PENDING);
		when(gradingRepository.findBySubmissionModuleIdForUpdate(14L)).thenReturn(Optional.of(pending));
		when(aiAnalysisInFlightRegistry.tryClaim(14L)).thenReturn(true);

		TransactionSynchronizationManager.initSynchronization();
		try {
			gradingService.requestAiAnalysis(14L);
			verifyNoInteractions(gradingAiAnalysisService);
			List<TransactionSynchronization> synchronizations =
					TransactionSynchronizationManager.getSynchronizations();
			synchronizations.forEach(TransactionSynchronization::afterCommit);
			synchronizations.forEach(sync -> sync.afterCompletion(TransactionSynchronization.STATUS_COMMITTED));
		} finally {
			TransactionSynchronizationManager.clearSynchronization();
		}

		verify(gradingAiAnalysisService).analyzeSubmittedModule(14L);
		verify(aiAnalysisInFlightRegistry, never()).release(14L);
		verify(gradingRepository, never()).saveTeacherGrade(any());
		verifyNoInteractions(answerAnnotationRepository);
		assertThat(pending.status()).isEqualTo(GradingStatus.PENDING);
	}

	@Test
	void requestAiAnalysis_allowsRetryWhenStatusIsFailed() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(20L, UserRole.TEACHER));
		when(gradingContextRepository.findBySubmissionModuleId(14L))
				.thenReturn(Optional.of(new GradingContext(
						14L, null, 7L, 3L, 2L, 20L, 41L, ModuleSkill.SPEAKING, true, null)));
		Grading failed = grading(5L, bd("10.00"), null, GradingStatus.FAILED);
		when(gradingRepository.findBySubmissionModuleIdForUpdate(14L)).thenReturn(Optional.of(failed));
		when(aiAnalysisInFlightRegistry.tryClaim(14L)).thenReturn(true);

		requestAndCommitAiAnalysis(14L);

		verify(gradingRepository).updateStatus(5L, GradingStatus.PENDING);
		verify(gradingAiAnalysisService).analyzeSubmittedModule(14L);
	}

	@Test
	void requestAiAnalysis_whenAlreadyInFlight_rejectsDuplicateTrigger() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(20L, UserRole.TEACHER));
		when(gradingContextRepository.findBySubmissionModuleId(14L))
				.thenReturn(Optional.of(context(20L, ModuleSkill.SPEAKING)));
		when(gradingRepository.findBySubmissionModuleIdForUpdate(14L))
				.thenReturn(Optional.of(grading(5L, bd("10.00"), null, GradingStatus.PENDING)));
		when(aiAnalysisInFlightRegistry.tryClaim(14L)).thenReturn(false);

		assertThatExceptionOfType(ApiException.class)
				.isThrownBy(() -> gradingService.requestAiAnalysis(14L))
				.satisfies(exception -> assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));

		verify(gradingAiAnalysisService, never()).analyzeSubmittedModule(14L);
	}

	@Test
	void requestAiAnalysis_releasesClaimWhenRequestTransactionRollsBack() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(20L, UserRole.TEACHER));
		when(gradingContextRepository.findBySubmissionModuleId(14L))
				.thenReturn(Optional.of(context(20L, ModuleSkill.SPEAKING)));
		when(gradingRepository.findBySubmissionModuleIdForUpdate(14L))
				.thenReturn(Optional.of(grading(5L, bd("10.00"), null, GradingStatus.PENDING)));
		when(aiAnalysisInFlightRegistry.tryClaim(14L)).thenReturn(true);

		TransactionSynchronizationManager.initSynchronization();
		try {
			gradingService.requestAiAnalysis(14L);
			TransactionSynchronizationManager.getSynchronizations().forEach(
					sync -> sync.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));
		} finally {
			TransactionSynchronizationManager.clearSynchronization();
		}

		verify(aiAnalysisInFlightRegistry).release(14L);
		verifyNoInteractions(gradingAiAnalysisService);
	}

	@Test
	void requestAiAnalysis_whenExecutorRejects_marksPendingFailedAndReleasesClaim() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(20L, UserRole.TEACHER));
		when(gradingContextRepository.findBySubmissionModuleId(14L))
				.thenReturn(Optional.of(context(20L, ModuleSkill.SPEAKING)));
		when(gradingRepository.findBySubmissionModuleIdForUpdate(14L))
				.thenReturn(Optional.of(grading(5L, bd("10.00"), null, GradingStatus.PENDING)));
		when(aiAnalysisInFlightRegistry.tryClaim(14L)).thenReturn(true);
		org.mockito.Mockito.doThrow(new java.util.concurrent.RejectedExecutionException())
				.when(gradingAiAnalysisService).analyzeSubmittedModule(14L);

		requestAndCommitAiAnalysis(14L);

		verify(aiAnalysisInFlightRegistry).release(14L);
		verify(gradingAiResultPersistenceService).markFailedIfStillPending(14L);
	}

	@Test
	void updateFinalGrade_whenPessimisticLockTimesOut_returnsBadRequest() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(20L, UserRole.TEACHER));
		when(gradingContextRepository.findByGradingId(5L)).thenReturn(Optional.of(context(20L, ModuleSkill.WRITING)));
		when(gradingRepository.findBySubmissionModuleIdForUpdate(14L))
				.thenThrow(new PessimisticLockingFailureException("lock timeout"));

		assertThatExceptionOfType(ApiException.class)
				.isThrownBy(() -> gradingService.updateFinalGrade(5L, bd("8.50"), "Feedback", null))
				.satisfies(exception -> assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
	}

	@Test
	void getAiSuggestion_speakingSkill_returnsAggregatedSuggestion() throws Exception {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(20L, UserRole.TEACHER));
		when(gradingContextRepository.findBySubmissionModuleId(14L))
				.thenReturn(Optional.of(context(20L, ModuleSkill.SPEAKING)));

		com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
		com.fasterxml.jackson.databind.node.ObjectNode transcriptDetails = mapper.createObjectNode();
		com.fasterxml.jackson.databind.node.ObjectNode criteria = transcriptDetails.putObject("criteriaScores");
		criteria.put("fluencyAndCoherence", 7.0);
		criteria.put("lexicalResource", 7.0);
		criteria.put("grammaticalRangeAndAccuracy", 7.0);
		criteria.put("pronunciation", 7.0);
		criteria.put("overallScore", 7.0);
		com.fasterxml.jackson.databind.node.ObjectNode metrics = transcriptDetails.putObject("fluencyMetrics");
		metrics.put("wordsPerMinute", 120.0);
		metrics.put("pauseCount", 3);
		metrics.put("totalDurationSeconds", 45.0);
		metrics.put("phonationTimeRatio", 0.85);
		com.fasterxml.jackson.databind.node.ArrayNode transcriptArray = transcriptDetails.putArray("transcript");
		com.fasterxml.jackson.databind.node.ObjectNode word = transcriptArray.addObject();
		word.put("word", "Hello");
		word.put("start", 0.0);
		word.put("end", 0.5);
		transcriptDetails.put("modelUsed", "benchmark/qa-21-deterministic");
		transcriptDetails.put("providerUsed", "mock");

		Grading grading = new Grading(
				5L,
				14L,
				GradingMethod.AUTO,
				GradingStatus.AI_GRADED,
				"Overall good coherence and natural rhythm.",
				bd("7.0"),
				"Overall good coherence and natural rhythm.",
				bd("9.0"),
				null,
				null,
				null,
				transcriptDetails,
				null
		);
		when(gradingRepository.findBySubmissionModuleId(14L)).thenReturn(Optional.of(grading));

		com.english_hub.core.infrastructure.persistence.entity.Answer answer =
				new com.english_hub.core.infrastructure.persistence.entity.Answer(
						14L, null, null, "audio.mp3", null, null, null, null, null, null, null, null);
		org.springframework.test.util.ReflectionTestUtils.setField(answer, "id", 77L);
		when(answerRepository.findBySubmissionModuleId(14L)).thenReturn(java.util.List.of(answer));

		AnswerAnnotation annotation = AnswerAnnotation.ai(
				77L, 0, 5, null, "pronunciation", "Slight mispronunciation", "Hello");
		when(answerAnnotationRepository.findByAnswerId(77L)).thenReturn(java.util.List.of(annotation));

		com.english_hub.core.modules.grading.presentation.rest.dto.AiGradingSuggestionResponse response =
				gradingService.getAiSuggestion(14L);

		assertThat(response.submissionModuleId()).isEqualTo(14L);
		assertThat(response.gradingId()).isEqualTo(5L);
		assertThat(response.skill()).isEqualTo("SPEAKING");
		assertThat(response.status()).isEqualTo("AI_GRADED");
		assertThat(response.suggestedScore()).isEqualByComparingTo(bd("7.0"));
		assertThat(response.maxScore()).isEqualByComparingTo(bd("9.0"));
		assertThat(response.aiFeedback()).contains("Overall good coherence");
		assertThat(response.criteriaScores().get("pronunciation").asDouble()).isEqualTo(7.0);
		assertThat(response.metrics().get("wordsPerMinute").asDouble()).isEqualTo(120.0);
		assertThat(response.transcript().isArray()).isTrue();
		assertThat(response.transcript().size()).isEqualTo(1);
		assertThat(response.modelUsed()).isEqualTo("benchmark/qa-21-deterministic");
		assertThat(response.providerUsed()).isEqualTo("mock");
		assertThat(response.canTriggerAi()).isFalse();
		assertThat(response.fallbackManualGradingAvailable()).isTrue();
		assertThat(response.annotations()).hasSize(1);
		assertThat(response.annotations().get(0).errorType()).isEqualTo("pronunciation");
	}

	@Test
	void getAiSuggestion_writingSkill_returnsAggregatedSuggestion() throws Exception {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(20L, UserRole.TEACHER));
		when(gradingContextRepository.findBySubmissionModuleId(14L))
				.thenReturn(Optional.of(context(20L, ModuleSkill.WRITING)));

		com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
		com.fasterxml.jackson.databind.node.ObjectNode transcriptDetails = mapper.createObjectNode();
		com.fasterxml.jackson.databind.node.ObjectNode criteria = transcriptDetails.putObject("criteriaScores");
		criteria.put("taskResponse", 7.0);
		criteria.put("coherenceAndCohesion", 6.5);
		criteria.put("lexicalResource", 6.0);
		criteria.put("grammaticalRangeAndAccuracy", 6.5);
		criteria.put("overallScore", 6.5);
		com.fasterxml.jackson.databind.node.ObjectNode metrics = transcriptDetails.putObject("textMetrics");
		metrics.put("wordCount", 140);
		metrics.put("sentenceCount", 5);
		metrics.put("averageSentenceLength", 28.0);
		metrics.put("lexicalDiversity", 0.67);
		metrics.put("fleschKincaidGrade", 13.5);
		transcriptDetails.put("modelUsed", "benchmark/qa-21-deterministic");
		transcriptDetails.put("providerUsed", "mock");

		Grading grading = new Grading(
				5L,
				14L,
				GradingMethod.AUTO,
				GradingStatus.AI_GRADED,
				"Well organized essay with clear main ideas.",
				bd("8.0"),
				"Well organized essay with clear main ideas.",
				bd("9.0"),
				null,
				null,
				null,
				transcriptDetails,
				null
		);
		when(gradingRepository.findBySubmissionModuleId(14L)).thenReturn(Optional.of(grading));

		com.english_hub.core.infrastructure.persistence.entity.Answer answer =
				new com.english_hub.core.infrastructure.persistence.entity.Answer(
						14L, null, "Essay text", null, null, null, null, null, null, null, null, null);
		org.springframework.test.util.ReflectionTestUtils.setField(answer, "id", 88L);
		when(answerRepository.findBySubmissionModuleId(14L)).thenReturn(java.util.List.of(answer));

		AnswerAnnotation annotation = AnswerAnnotation.ai(
				88L, 272, 305, null, "GRAMMAR", "Subject-verb agreement error", "helps");
		when(answerAnnotationRepository.findByAnswerId(88L)).thenReturn(java.util.List.of(annotation));

		com.english_hub.core.modules.grading.presentation.rest.dto.AiGradingSuggestionResponse response =
				gradingService.getAiSuggestion(14L);

		assertThat(response.skill()).isEqualTo("WRITING");
		assertThat(response.status()).isEqualTo("AI_GRADED");
		assertThat(response.suggestedScore()).isEqualByComparingTo(bd("6.5"));
		assertThat(response.criteriaScores().get("taskResponse").asDouble()).isEqualTo(7.0);
		assertThat(response.metrics().get("wordCount").asInt()).isEqualTo(140);
		assertThat(response.annotations()).hasSize(1);
		assertThat(response.annotations().get(0).comment()).isEqualTo("Subject-verb agreement error");
		assertThat(response.fallbackManualGradingAvailable()).isTrue();
	}

	@Test
	void getAiSuggestion_failedStatus_providesManualFallbackGuidancePerPPR6() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(20L, UserRole.TEACHER));
		when(gradingContextRepository.findBySubmissionModuleId(14L))
				.thenReturn(Optional.of(context(20L, ModuleSkill.WRITING)));

		Grading failed = grading(5L, bd("9.0"), null, GradingStatus.FAILED);
		when(gradingRepository.findBySubmissionModuleId(14L)).thenReturn(Optional.of(failed));

		com.english_hub.core.modules.grading.presentation.rest.dto.AiGradingSuggestionResponse response =
				gradingService.getAiSuggestion(14L);

		assertThat(response.status()).isEqualTo("FAILED");
		assertThat(response.suggestedScore()).isNull();
		assertThat(response.canTriggerAi()).isTrue();
		assertThat(response.fallbackManualGradingAvailable()).isTrue();
		assertThat(response.fallbackMessage()).contains("PUT /api/v1/gradings/5");
		assertThat(response.fallbackMessage()).contains("thủ công theo cơ chế dự phòng PP R6");
	}

	@Test
	void getAiSuggestion_withoutCriteriaOverallScore_doesNotFallbackToFinalScore() throws Exception {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(20L, UserRole.TEACHER));
		when(gradingContextRepository.findBySubmissionModuleId(14L))
				.thenReturn(Optional.of(context(20L, ModuleSkill.WRITING)));
		com.fasterxml.jackson.databind.node.ObjectNode details =
				new com.fasterxml.jackson.databind.ObjectMapper().createObjectNode();
		details.putObject("criteriaScores").put("taskResponse", 7.0);
		Grading aiGraded = new Grading(
				5L, 14L, GradingMethod.AUTO, GradingStatus.AI_GRADED, "AI feedback", bd("8.0"),
				"AI feedback", bd("9.0"), null, null, null, details, null);
		when(gradingRepository.findBySubmissionModuleId(14L)).thenReturn(Optional.of(aiGraded));

		com.english_hub.core.modules.grading.presentation.rest.dto.AiGradingSuggestionResponse response =
				gradingService.getAiSuggestion(14L);

		assertThat(response.suggestedScore()).isNull();
	}

	@Test
	void getAiSuggestion_pendingStatus_providesManualFallbackGuidance() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(20L, UserRole.TEACHER));
		when(gradingContextRepository.findBySubmissionModuleId(14L))
				.thenReturn(Optional.of(context(20L, ModuleSkill.SPEAKING)));

		Grading pending = grading(5L, bd("9.0"), null, GradingStatus.PENDING);
		when(gradingRepository.findBySubmissionModuleId(14L)).thenReturn(Optional.of(pending));

		com.english_hub.core.modules.grading.presentation.rest.dto.AiGradingSuggestionResponse response =
				gradingService.getAiSuggestion(14L);

		assertThat(response.status()).isEqualTo("PENDING");
		assertThat(response.canTriggerAi()).isTrue();
		assertThat(response.fallbackManualGradingAvailable()).isTrue();
		assertThat(response.fallbackMessage()).contains("chủ động chấm thủ công ngay lập tức theo PP R6");
	}

	@Test
	void getAiSuggestion_unsupportedSkill_throwsBadRequest() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(20L, UserRole.TEACHER));
		when(gradingContextRepository.findBySubmissionModuleId(14L))
				.thenReturn(Optional.of(context(20L, ModuleSkill.LISTENING)));

		assertThatExceptionOfType(ApiException.class)
				.isThrownBy(() -> gradingService.getAiSuggestion(14L))
				.satisfies(exception -> {
					assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
					assertThat(exception.getMessage()).contains("Gợi ý chấm AI chỉ hỗ trợ");
				});
	}

	@Test
	void getAiSuggestion_nonOwnerTeacher_throwsForbidden() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(99L, UserRole.TEACHER));
		when(gradingContextRepository.findBySubmissionModuleId(14L))
				.thenReturn(Optional.of(context(20L, ModuleSkill.WRITING)));

		assertThatExceptionOfType(ApiException.class)
				.isThrownBy(() -> gradingService.getAiSuggestion(14L))
				.satisfies(exception -> assertThat(exception.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
	}

	private Grading grading(Long id, BigDecimal maxScore, BigDecimal finalScore, GradingStatus status) {
		return new Grading(
				id,
				14L,
				GradingMethod.AUTO,
				status,
				null,
				finalScore,
				null,
				maxScore,
				null,
				null,
				null,
				null,
				null);
	}

	private void requestAndCommitAiAnalysis(long submissionModuleId) {
		TransactionSynchronizationManager.initSynchronization();
		try {
			gradingService.requestAiAnalysis(submissionModuleId);
			List<TransactionSynchronization> synchronizations =
					TransactionSynchronizationManager.getSynchronizations();
			synchronizations.forEach(TransactionSynchronization::afterCommit);
			synchronizations.forEach(sync -> sync.afterCompletion(TransactionSynchronization.STATUS_COMMITTED));
		} finally {
			TransactionSynchronizationManager.clearSynchronization();
		}
	}

	private GradingContext context(Long teacherId, ModuleSkill skill) {
		return new GradingContext(14L, 6L, 8L, 7L, 3L, 2L, teacherId, 41L, skill, true, 64, ModuleTaskType.ESSAY, null);
	}

	private User user(Long id, UserRole role) {
		return new User(id, "Teacher " + id, "teacher" + id + "@example.test", null, null, "hash", role,
				UserStatus.ACTIVE, false, null, null, null, null);
	}

	private BigDecimal bd(String value) {
		return new BigDecimal(value);
	}
}
