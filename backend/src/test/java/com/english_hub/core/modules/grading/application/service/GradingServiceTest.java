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
import com.english_hub.core.modules.grading.domain.repository.AnswerAnnotationRepository;
import com.english_hub.core.modules.grading.domain.repository.GradingChangeLogRepository;
import com.english_hub.core.modules.grading.domain.repository.GradingContextRepository;
import com.english_hub.core.modules.grading.domain.repository.GradingRepository;
import com.english_hub.core.modules.classroom.domain.repository.ClassRepository;
import com.english_hub.core.modules.module.domain.model.ModuleSkill;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.domain.model.User;
import com.english_hub.core.modules.user.domain.repository.UserRepository;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

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
				gradingAiAnalysisService);
	}

	@Test
	void rejectsFinalScoreAboveMaxScoreSnapshot() {
		when(currentUserProvider.requireActiveUser()).thenReturn(user(20L, UserRole.TEACHER));
		when(gradingRepository.findById(5L)).thenReturn(Optional.of(grading(5L, bd("10.00"), bd("7.00"),
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
		when(gradingRepository.findById(5L)).thenReturn(Optional.of(grading(5L, bd("10.00"), bd("7.00"),
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
		when(gradingRepository.findById(5L)).thenReturn(Optional.of(grading(5L, bd("10.00"), bd("7.00"),
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
		when(gradingRepository.findById(5L)).thenReturn(Optional.of(grading(5L, bd("10.00"), bd("7.00"),
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
		when(gradingRepository.findById(5L)).thenReturn(Optional.of(grading(5L, bd("10.00"), bd("7.00"),
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
		when(gradingRepository.findById(5L)).thenReturn(Optional.of(grading(5L, bd("10.00"), bd("7.00"),
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
		when(gradingRepository.findById(5L)).thenReturn(Optional.of(grading(5L, bd("10.00"), bd("7.00"),
				GradingStatus.PENDING)));
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
				.thenReturn(Optional.of(new GradingContext(14L, 8L, 7L, 3L, 2L, 20L, 41L,
						ModuleSkill.WRITING, true, 16)));

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
						14L, null, 7L, 3L, 2L, 20L, 41L, ModuleSkill.SPEAKING, true, null)));
		Grading pending = grading(5L, bd("10.00"), null, GradingStatus.PENDING);
		when(gradingRepository.findBySubmissionModuleId(14L)).thenReturn(Optional.of(pending));

		gradingService.requestAiAnalysis(14L);

		verify(gradingAiAnalysisService).analyzeSubmittedModule(14L);
		verify(gradingRepository, never()).saveTeacherGrade(any());
		verifyNoInteractions(answerAnnotationRepository);
		assertThat(pending.status()).isEqualTo(GradingStatus.PENDING);
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

	private GradingContext context(Long teacherId, ModuleSkill skill) {
		return new GradingContext(14L, 8L, 7L, 3L, 2L, teacherId, 41L, skill, true, 64);
	}

	private User user(Long id, UserRole role) {
		return new User(id, "Teacher " + id, "teacher" + id + "@example.test", null, null, "hash", role,
				UserStatus.ACTIVE, false, null, null, null, null);
	}

	private BigDecimal bd(String value) {
		return new BigDecimal(value);
	}
}
