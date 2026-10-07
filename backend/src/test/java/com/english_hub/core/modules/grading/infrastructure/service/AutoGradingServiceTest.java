package com.english_hub.core.modules.grading.infrastructure.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.english_hub.core.modules.grading.domain.model.AnswerSubmission;
import com.english_hub.core.modules.grading.domain.repository.GradedAnswerRepository;
import com.english_hub.core.modules.grading.domain.repository.GradingContextRepository;
import com.english_hub.core.modules.grading.domain.repository.GradingRepository;
import com.english_hub.core.modules.grading.domain.repository.SubmissionModuleStatusRepository;
import com.english_hub.core.modules.module.domain.model.ModuleSkill;
import com.english_hub.core.modules.module.domain.model.ModuleTaskType;
import com.english_hub.core.modules.question.domain.model.Question;
import com.english_hub.core.modules.question.domain.model.QuestionType;
import com.english_hub.core.modules.question.domain.repository.QuestionRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.english_hub.core.modules.grading.domain.model.AnswerOutcome;
import com.english_hub.core.modules.grading.domain.model.Grading;
import com.english_hub.core.modules.grading.domain.model.GradingMethod;
import com.english_hub.core.modules.grading.domain.model.GradingContext;
import com.english_hub.core.modules.grading.domain.model.GradingStatus;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AutoGradingServiceTest {

	private static final long SUBMISSION_MODULE_ID = 14L;
	private static final long MODULE_ID = 6L;
	private static final long QUESTION_ID = 7L;
	private static final long ANSWER_ID = 31L;

	private static final Map<String, Object> CORRECT_CHOICE = Map.of(
			"options",
			List.of(
					Map.of("id", 1, "content", "Option A", "isCorrect", true),
					Map.of("id", 2, "content", "Option B", "isCorrect", false)));

	@Mock
	private GradingRepository gradingRepository;

	@Mock
	private GradingContextRepository gradingContextRepository;

	@Mock
	private QuestionRepository questionRepository;

	@Mock
	private GradedAnswerRepository gradedAnswerRepository;

	@Mock
	private SubmissionModuleStatusRepository submissionModuleStatusRepository;

	@Captor
	private ArgumentCaptor<Grading> gradingCaptor;

	@Captor
	private ArgumentCaptor<List<AnswerOutcome>> outcomesCaptor;

	private AutoGradingServiceImpl service;

	@BeforeEach
	void setUp() {
		service = new AutoGradingServiceImpl(
				gradingRepository,
				gradingContextRepository,
				questionRepository,
				gradedAnswerRepository,
				submissionModuleStatusRepository);
	}

	@Test
	void scoresACorrectAnswerAndMarksTheModuleGraded() {
		graderableContext(ModuleSkill.READING, ModuleTaskType.QUIZ);
		when(questionRepository.findByModuleIdOrderByOrderIndexAsc(MODULE_ID))
				.thenReturn(List.of(choiceQuestion("1.00")));
		when(gradedAnswerRepository.findBySubmissionModuleId(SUBMISSION_MODULE_ID))
				.thenReturn(List.of(new AnswerSubmission(ANSWER_ID, QUESTION_ID, Map.of("selectedOptionIds", List.of(1L)))));

		service.grade(SUBMISSION_MODULE_ID);

		verify(gradedAnswerRepository).saveOutcomes(outcomesCaptor.capture());
		assertThat(outcomesCaptor.getValue()).containsExactly(
				new AnswerOutcome(ANSWER_ID, QUESTION_ID, true, new BigDecimal("1.00")));
		verify(gradingRepository).saveAutoGrade(gradingCaptor.capture());
		assertThat(gradingCaptor.getValue().finalScore()).isEqualByComparingTo("1.00");
		verify(submissionModuleStatusRepository).markGraded(SUBMISSION_MODULE_ID);
	}

	@Test
	void writesTheModuleMaxScoreAsTheSnapshot() {
		graderableContext(ModuleSkill.READING, ModuleTaskType.REWRITE);
		when(gradingContextRepository.findBySubmissionModuleId(SUBMISSION_MODULE_ID))
				.thenReturn(Optional.of(context(ModuleSkill.READING, ModuleTaskType.REWRITE, true, new BigDecimal("7.50"))));
		when(questionRepository.findByModuleIdOrderByOrderIndexAsc(MODULE_ID))
				.thenReturn(List.of(choiceQuestion("9.00")));
		when(gradedAnswerRepository.findBySubmissionModuleId(SUBMISSION_MODULE_ID))
				.thenReturn(List.of(new AnswerSubmission(ANSWER_ID, QUESTION_ID, Map.of("selectedOptionIds", List.of(1L)))));

		service.grade(SUBMISSION_MODULE_ID);

		verify(gradingRepository).saveAutoGrade(gradingCaptor.capture());
		assertThat(gradingCaptor.getValue().finalScore()).isEqualByComparingTo("7.50");
		assertThat(gradingCaptor.getValue().maxScoreSnapshot()).isEqualByComparingTo("7.50");
	}

	@Test
	void gradesRewriteModulesTheSameWayAsQuizModules() {
		graderableContext(ModuleSkill.READING, ModuleTaskType.REWRITE);
		when(questionRepository.findByModuleIdOrderByOrderIndexAsc(MODULE_ID))
				.thenReturn(List.of(choiceQuestion("1.00")));
		when(gradedAnswerRepository.findBySubmissionModuleId(SUBMISSION_MODULE_ID))
				.thenReturn(List.of(new AnswerSubmission(ANSWER_ID, QUESTION_ID, Map.of("selectedOptionIds", List.of(1L)))));

		service.grade(SUBMISSION_MODULE_ID);

		verify(submissionModuleStatusRepository).markGraded(SUBMISSION_MODULE_ID);
	}

	@Test
	void skipsAModuleThatTheTeacherGrades() {
		when(gradingContextRepository.findBySubmissionModuleId(SUBMISSION_MODULE_ID))
				.thenReturn(Optional.of(context(ModuleSkill.WRITING, ModuleTaskType.ESSAY, true, new BigDecimal("10.00"))));

		service.grade(SUBMISSION_MODULE_ID);

		verifyNoInteractions(questionRepository, gradedAnswerRepository, submissionModuleStatusRepository);
		verify(gradingRepository, never()).saveAutoGrade(any());
	}

	@Test
	void skipsListeningRewriteBecauseItIsNotASupportedPair() {
		when(gradingContextRepository.findBySubmissionModuleId(SUBMISSION_MODULE_ID))
				.thenReturn(Optional.of(context(ModuleSkill.LISTENING, ModuleTaskType.REWRITE, true, new BigDecimal("10.00"))));

		service.grade(SUBMISSION_MODULE_ID);

		verifyNoInteractions(questionRepository, gradedAnswerRepository, submissionModuleStatusRepository);
		verify(gradingRepository, never()).saveAutoGrade(any());
	}

	@Test
	void skipsAModuleThatIsNotSubmittedYet() {
		when(gradingContextRepository.findBySubmissionModuleId(SUBMISSION_MODULE_ID))
				.thenReturn(Optional.of(context(ModuleSkill.READING, ModuleTaskType.QUIZ, false, new BigDecimal("10.00"))));

		service.grade(SUBMISSION_MODULE_ID);

		verifyNoInteractions(questionRepository, gradedAnswerRepository, submissionModuleStatusRepository);
		verify(gradingRepository, never()).saveAutoGrade(any());
	}

	@Test
	void skipsWhenTheGradingContextIsMissing() {
		when(gradingContextRepository.findBySubmissionModuleId(SUBMISSION_MODULE_ID)).thenReturn(Optional.empty());

		service.grade(SUBMISSION_MODULE_ID);

		verify(gradingRepository, never()).findBySubmissionModuleIdForUpdate(SUBMISSION_MODULE_ID);
		verifyNoInteractions(questionRepository, gradedAnswerRepository, submissionModuleStatusRepository);
	}

	@Test
	void locksTheGradingRowAndSkipsAnAlreadyGradedModule() {
		graderableContext(ModuleSkill.READING, ModuleTaskType.QUIZ);
		when(gradingRepository.findBySubmissionModuleIdForUpdate(SUBMISSION_MODULE_ID))
				.thenReturn(Optional.of(grading(GradingStatus.COMPLETED)));

		service.grade(SUBMISSION_MODULE_ID);

		verify(gradingRepository).findBySubmissionModuleIdForUpdate(SUBMISSION_MODULE_ID);
		verifyNoInteractions(questionRepository, gradedAnswerRepository, submissionModuleStatusRepository);
		verify(gradingRepository, never()).saveAutoGrade(any());
	}

	@Test
	void skipsAPreviouslyFailedGradingInsteadOfRetryingIt() {
		graderableContext(ModuleSkill.READING, ModuleTaskType.QUIZ);
		when(gradingRepository.findBySubmissionModuleIdForUpdate(SUBMISSION_MODULE_ID))
				.thenReturn(Optional.of(grading(GradingStatus.FAILED)));

		service.grade(SUBMISSION_MODULE_ID);

		verifyNoInteractions(questionRepository, gradedAnswerRepository, submissionModuleStatusRepository);
		verify(gradingRepository, never()).saveAutoGrade(any());
	}

	@Test
	void failsLoudlyWhenTheGradingRowIsMissingBecauseTheLockMustNotBeOptional() {
		graderableContext(ModuleSkill.READING, ModuleTaskType.QUIZ);
		when(gradingRepository.findBySubmissionModuleIdForUpdate(SUBMISSION_MODULE_ID)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> service.grade(SUBMISSION_MODULE_ID))
				.isInstanceOf(IllegalStateException.class)
				.hasMessageContaining("14");
		verifyNoInteractions(questionRepository, gradedAnswerRepository, submissionModuleStatusRepository);
	}

	@Test
	void writesZeroWhenTheStudentAnsweredNothing() {
		graderableContext(ModuleSkill.READING, ModuleTaskType.QUIZ);
		when(questionRepository.findByModuleIdOrderByOrderIndexAsc(MODULE_ID))
				.thenReturn(List.of(choiceQuestion("1.00"), choiceQuestion(8L, "2.00")));
		when(gradedAnswerRepository.findBySubmissionModuleId(SUBMISSION_MODULE_ID)).thenReturn(List.of());

		service.grade(SUBMISSION_MODULE_ID);

		verify(gradedAnswerRepository).saveOutcomes(outcomesCaptor.capture());
		assertThat(outcomesCaptor.getValue()).hasSize(2).allMatch(outcome -> !outcome.correct());
		assertThat(outcomesCaptor.getValue()).allMatch(outcome -> outcome.answerId() == null);
		verify(gradingRepository).saveAutoGrade(gradingCaptor.capture());
		assertThat(gradingCaptor.getValue().finalScore()).isEqualByComparingTo("0");
	}

	@Test
	void doesNotLetOneDuplicateAnswerForAQuestionDoubleCount() {
		graderableContext(ModuleSkill.READING, ModuleTaskType.QUIZ);
		when(questionRepository.findByModuleIdOrderByOrderIndexAsc(MODULE_ID))
				.thenReturn(List.of(choiceQuestion("1.00")));
		when(gradedAnswerRepository.findBySubmissionModuleId(SUBMISSION_MODULE_ID))
				.thenReturn(List.of(
						new AnswerSubmission(ANSWER_ID, QUESTION_ID, Map.of("selectedOptionIds", List.of(1L))),
						new AnswerSubmission(99L, QUESTION_ID, Map.of("selectedOptionIds", List.of(2L)))));

		service.grade(SUBMISSION_MODULE_ID);

		verify(gradingRepository).saveAutoGrade(gradingCaptor.capture());
		assertThat(gradingCaptor.getValue().finalScore()).isEqualByComparingTo("1.00");
	}

	private void graderableContext(ModuleSkill skill, ModuleTaskType taskType) {
		when(gradingContextRepository.findBySubmissionModuleId(SUBMISSION_MODULE_ID))
				.thenReturn(Optional.of(context(skill, taskType, true, new BigDecimal("10.00"))));
		when(gradingRepository.findBySubmissionModuleIdForUpdate(SUBMISSION_MODULE_ID))
				.thenReturn(Optional.of(grading(GradingStatus.PENDING)));
	}

	private GradingContext context(ModuleSkill skill, ModuleTaskType taskType, boolean submitted, BigDecimal maxScore) {
		return new GradingContext(
				SUBMISSION_MODULE_ID,
				MODULE_ID,
				ANSWER_ID,
				3L,
				2L,
				null,
				20L,
				41L,
				skill,
				submitted,
				null,
				taskType,
				maxScore);
	}

	private Grading grading(GradingStatus status) {
		return new Grading(
				5L, SUBMISSION_MODULE_ID, GradingMethod.AUTO, status, null, null, null,
				new BigDecimal("10.00"), null, null, null, null, null);
	}

	private Question choiceQuestion(String score) {
		return choiceQuestion(QUESTION_ID, score);
	}

	private Question choiceQuestion(Long questionId, String score) {
		return new Question(questionId, MODULE_ID, "Content", QuestionType.MULTIPLE_CHOICE, CORRECT_CHOICE,
				new BigDecimal(score), 1);
	}
}