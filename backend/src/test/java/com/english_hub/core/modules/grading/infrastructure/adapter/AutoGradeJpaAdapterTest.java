package com.english_hub.core.modules.grading.infrastructure.adapter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import com.english_hub.core.infrastructure.persistence.entity.Answer;
import com.english_hub.core.infrastructure.persistence.repository.AnswerRepository;
import com.english_hub.core.infrastructure.persistence.repository.GradingRepository;
import com.english_hub.core.infrastructure.persistence.repository.SubmissionModuleRepository;
import com.english_hub.core.modules.grading.domain.model.AnswerOutcome;
import com.english_hub.core.modules.grading.domain.model.AnswerSubmission;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

@ExtendWith(MockitoExtension.class)
class AutoGradeJpaAdapterTest {

	private static final long SUBMISSION_MODULE_ID = 14L;
	private static final long QUESTION_ID = 7L;
	private static final long ANSWER_ID = 31L;
	private static final long SECOND_ANSWER_ID = 32L;
	private static final String CHOICE_CONTENT = "{\"selectedOptionIds\":[1]}";

	@Mock
	private AnswerRepository answerRepository;

	@Mock
	private SubmissionModuleRepository submissionModuleRepository;

	@Mock
	private GradingRepository gradingRepository;

	private AutoGradeJpaAdapter adapter;
	private final JsonMapper objectMapper = JsonMapper.builder().build();

	@BeforeEach
	void setUp() {
		adapter = new AutoGradeJpaAdapter(
				answerRepository, submissionModuleRepository, gradingRepository, objectMapper);
	}

	@Test
	void returnsNoAnswerSubmissionsWhenTheModuleHasNoAnswers() {
		when(answerRepository.findBySubmissionModuleId(SUBMISSION_MODULE_ID)).thenReturn(List.of());

		List<AnswerSubmission> answers = adapter.findBySubmissionModuleId(SUBMISSION_MODULE_ID);

		assertThat(answers).isEmpty();
		verify(answerRepository).findBySubmissionModuleId(SUBMISSION_MODULE_ID);
		verifyNoMoreInteractions(answerRepository);
		verifyNoInteractions(submissionModuleRepository, gradingRepository);
	}

	@ParameterizedTest
	@NullAndEmptySource
	@ValueSource(strings = {" ", "\t"})
	void retainsAnAnswerWithNullOrBlankContentAsAnEmptyMap(String content) {
		Answer answer = storedAnswer(ANSWER_ID, QUESTION_ID, content);
		when(answerRepository.findBySubmissionModuleId(SUBMISSION_MODULE_ID)).thenReturn(List.of(answer));

		List<AnswerSubmission> answers = adapter.findBySubmissionModuleId(SUBMISSION_MODULE_ID);

		assertThat(answers).containsExactly(new AnswerSubmission(ANSWER_ID, QUESTION_ID, Map.of()));
	}

	@Test
	void retainsJsonNullContentAsNullRatherThanAnEmptyMap() {
		Answer answer = storedAnswer(ANSWER_ID, QUESTION_ID, "null");
		when(answerRepository.findBySubmissionModuleId(SUBMISSION_MODULE_ID)).thenReturn(List.of(answer));

		List<AnswerSubmission> answers = adapter.findBySubmissionModuleId(SUBMISSION_MODULE_ID);

		assertThat(answers).containsExactly(new AnswerSubmission(ANSWER_ID, QUESTION_ID, null));
	}

	@Test
	void mapsObjectContentWithoutLosingAnswerOrQuestionIdentifiers() {
		Answer answer = storedAnswer(ANSWER_ID, QUESTION_ID, CHOICE_CONTENT);
		when(answerRepository.findBySubmissionModuleId(SUBMISSION_MODULE_ID)).thenReturn(List.of(answer));

		List<AnswerSubmission> answers = adapter.findBySubmissionModuleId(SUBMISSION_MODULE_ID);

		assertThat(answers).containsExactly(new AnswerSubmission(
				ANSWER_ID, QUESTION_ID, Map.of("selectedOptionIds", List.of(1))));
	}

	@ParameterizedTest
	@ValueSource(strings = {"[1]", "\"text\"", "42", "true", "{broken"})
	void rejectsNonObjectOrMalformedJsonContent(String content) {
		Answer answer = storedAnswer(ANSWER_ID, QUESTION_ID, content);
		when(answerRepository.findBySubmissionModuleId(SUBMISSION_MODULE_ID)).thenReturn(List.of(answer));

		assertThatThrownBy(() -> adapter.findBySubmissionModuleId(SUBMISSION_MODULE_ID))
				.isInstanceOf(IllegalArgumentException.class)
				.hasMessage("answers.content must contain valid JSON")
				.hasCauseInstanceOf(JacksonException.class);
		verifyNoInteractions(submissionModuleRepository, gradingRepository);
	}

	@Test
	void filtersAnswersWithoutAQuestionBeforeTryingToParseTheirContent() {
		Answer fileAnswer = mock(Answer.class);
		when(fileAnswer.getQuestionId()).thenReturn(null);
		Answer questionAnswer = storedAnswer(ANSWER_ID, QUESTION_ID, CHOICE_CONTENT);
		when(answerRepository.findBySubmissionModuleId(SUBMISSION_MODULE_ID))
				.thenReturn(List.of(fileAnswer, questionAnswer));

		List<AnswerSubmission> answers = adapter.findBySubmissionModuleId(SUBMISSION_MODULE_ID);

		assertThat(answers).containsExactly(new AnswerSubmission(
				ANSWER_ID, QUESTION_ID, Map.of("selectedOptionIds", List.of(1))));
		verify(fileAnswer).getQuestionId();
		verifyNoMoreInteractions(fileAnswer);
	}

	@Test
	void returnsNoQuestionAnswersWhenEveryAnswerHasANullQuestionId() {
		Answer fileAnswer = mock(Answer.class);
		when(fileAnswer.getQuestionId()).thenReturn(null);
		when(answerRepository.findBySubmissionModuleId(SUBMISSION_MODULE_ID)).thenReturn(List.of(fileAnswer));

		List<AnswerSubmission> answers = adapter.findBySubmissionModuleId(SUBMISSION_MODULE_ID);

		assertThat(answers).isEmpty();
		verify(fileAnswer).getQuestionId();
		verifyNoMoreInteractions(fileAnswer);
	}

	@Test
	void passesForeignQuestionIdsToTheGraderWithoutCheckingQuestionMembership() {
		long foreignQuestionId = QUESTION_ID + 1;
		Answer answer = storedAnswer(ANSWER_ID, foreignQuestionId, CHOICE_CONTENT);
		when(answerRepository.findBySubmissionModuleId(SUBMISSION_MODULE_ID)).thenReturn(List.of(answer));

		List<AnswerSubmission> answers = adapter.findBySubmissionModuleId(SUBMISSION_MODULE_ID);

		assertThat(answers).containsExactly(new AnswerSubmission(
				ANSWER_ID, foreignQuestionId, Map.of("selectedOptionIds", List.of(1))));
		verify(answerRepository).findBySubmissionModuleId(SUBMISSION_MODULE_ID);
		verifyNoInteractions(submissionModuleRepository, gradingRepository);
	}

	@Test
	void reliesOnTheRepositoryToScopeAnswersToTheRequestedSubmissionModule() {
		Answer foreignAnswer = entityAnswer(ANSWER_ID, CHOICE_CONTENT);
		ReflectionTestUtils.setField(foreignAnswer, "submissionModuleId", SUBMISSION_MODULE_ID + 1);
		// Deliberately violate the repository contract to expose the adapter's trust boundary.
		when(answerRepository.findBySubmissionModuleId(SUBMISSION_MODULE_ID)).thenReturn(List.of(foreignAnswer));

		List<AnswerSubmission> answers = adapter.findBySubmissionModuleId(SUBMISSION_MODULE_ID);

		assertThat(answers).containsExactly(new AnswerSubmission(
				ANSWER_ID, QUESTION_ID, Map.of("selectedOptionIds", List.of(1))));
		verify(answerRepository).findBySubmissionModuleId(SUBMISSION_MODULE_ID);
		verifyNoMoreInteractions(answerRepository);
	}

	@Test
	void retainsMultipleAnswersForOneQuestionInRepositoryOrder() {
		Answer first = storedAnswer(ANSWER_ID, QUESTION_ID, CHOICE_CONTENT);
		Answer second = storedAnswer(SECOND_ANSWER_ID, QUESTION_ID, "{}");
		when(answerRepository.findBySubmissionModuleId(SUBMISSION_MODULE_ID)).thenReturn(List.of(first, second));

		List<AnswerSubmission> answers = adapter.findBySubmissionModuleId(SUBMISSION_MODULE_ID);

		assertThat(answers).containsExactly(
				new AnswerSubmission(ANSWER_ID, QUESTION_ID, Map.of("selectedOptionIds", List.of(1))),
				new AnswerSubmission(SECOND_ANSWER_ID, QUESTION_ID, Map.of()));
	}

	@Test
	void doesNotReadOrWriteAnswersForEmptyOutcomes() {
		adapter.saveOutcomes(List.of());

		verifyNoInteractions(answerRepository, submissionModuleRepository, gradingRepository);
	}

	@Test
	void doesNotCreateAnswerRowsForUnansweredQuestions() {
		adapter.saveOutcomes(List.of(new AnswerOutcome(null, QUESTION_ID, false, BigDecimal.ZERO)));

		verifyNoInteractions(answerRepository, submissionModuleRepository, gradingRepository);
	}

	@Test
	void mergesVerdictIntoExistingContentAndSkipsOutcomesWithoutAnAnswerId() {
		Answer answer = entityAnswer(ANSWER_ID, CHOICE_CONTENT);
		when(answerRepository.findAllById(Set.of(ANSWER_ID))).thenReturn(List.of(answer));

		adapter.saveOutcomes(List.of(
				new AnswerOutcome(null, QUESTION_ID + 1, false, BigDecimal.ZERO),
				new AnswerOutcome(ANSWER_ID, QUESTION_ID, true, BigDecimal.ONE)));

		assertThat(objectMapper.readTree(answer.getContent()))
				.isEqualTo(objectMapper.readTree(
						"{\"selectedOptionIds\":[1],\"isCorrect\":true,\"score\":1}"));
		verify(answerRepository).findAllById(Set.of(ANSWER_ID));
		verifyNoMoreInteractions(answerRepository);
		verifyNoInteractions(submissionModuleRepository, gradingRepository);
	}

	@ParameterizedTest
	@NullSource
	@ValueSource(strings = {"null", "[1]", "\"text\"", "42", "true"})
	void rejectsWritingAnOutcomeIntoNullOrNonObjectEntityContent(String content) {
		Answer answer = entityAnswer(ANSWER_ID, content);
		when(answerRepository.findAllById(Set.of(ANSWER_ID))).thenReturn(List.of(answer));

		assertThatThrownBy(() -> adapter.saveOutcomes(
				List.of(new AnswerOutcome(ANSWER_ID, QUESTION_ID, false, BigDecimal.ZERO))))
				.isInstanceOf(IllegalArgumentException.class)
				.hasMessage("A grading outcome requires an object answer content.");
		assertThat(answer.getContent()).isEqualTo(content);
	}

	@Test
	void usesTheLastOutcomeForADuplicateAnswerId() {
		Answer answer = entityAnswer(ANSWER_ID, CHOICE_CONTENT);
		when(answerRepository.findAllById(Set.of(ANSWER_ID))).thenReturn(List.of(answer));

		adapter.saveOutcomes(List.of(
				new AnswerOutcome(ANSWER_ID, QUESTION_ID, true, BigDecimal.ONE),
				new AnswerOutcome(ANSWER_ID, QUESTION_ID, false, BigDecimal.ZERO)));

		var content = objectMapper.readTree(answer.getContent());
		assertThat(content.get("isCorrect").asBoolean()).isFalse();
		assertThat(content.get("score").decimalValue()).isEqualByComparingTo("0");
		verify(answerRepository).findAllById(Set.of(ANSWER_ID));
		verifyNoMoreInteractions(answerRepository);
	}

	@Test
	void doesNotCreateAnAnswerWhenAnOutcomeReferencesAMissingRow() {
		when(answerRepository.findAllById(Set.of(ANSWER_ID))).thenReturn(List.of());

		adapter.saveOutcomes(List.of(new AnswerOutcome(ANSWER_ID, QUESTION_ID, false, BigDecimal.ZERO)));

		verify(answerRepository).findAllById(Set.of(ANSWER_ID));
		verifyNoMoreInteractions(answerRepository);
		verifyNoInteractions(submissionModuleRepository, gradingRepository);
	}

	private Answer storedAnswer(long answerId, Long questionId, String content) {
		// Mock raw reads so malformed JSON reaches the adapter rather than the entity constructor.
		Answer answer = mock(Answer.class);
		when(answer.getQuestionId()).thenReturn(questionId);
		when(answer.getId()).thenReturn(answerId);
		when(answer.getContent()).thenReturn(content);
		return answer;
	}

	private Answer entityAnswer(long answerId, String content) {
		Answer answer = new Answer(
				SUBMISSION_MODULE_ID, QUESTION_ID, content, null, null, null, null, null, null, null, null, null);
		ReflectionTestUtils.setField(answer, "id", answerId);
		return answer;
	}
}
