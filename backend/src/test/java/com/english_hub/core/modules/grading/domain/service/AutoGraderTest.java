package com.english_hub.core.modules.grading.domain.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.english_hub.core.modules.grading.domain.model.AnswerOutcome;
import com.english_hub.core.modules.grading.domain.model.AnswerSubmission;
import com.english_hub.core.modules.grading.domain.model.AutoGradeResult;
import com.english_hub.core.modules.question.domain.model.Question;
import com.english_hub.core.modules.question.domain.model.QuestionType;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class AutoGraderTest {

	private static final Map<String, Object> CORRECT_CHOICE = Map.of(
			"options",
			List.of(
					Map.of("id", 1, "content", "Option A", "isCorrect", true),
					Map.of("id", 2, "content", "Option B", "isCorrect", false)));

	@Test
	void awardsOnlyTheQuestionsTheStudentGotRight() {
		Question first = choice(1L, "1.00");
		Question second = choice(2L, "2.00");
		Question third = choice(3L, "1.00");

		AutoGradeResult result = AutoGrader.grade(
				List.of(first, second, third),
				Map.of(
						1L, new AnswerSubmission(101L, 1L, Map.of("selectedOptionIds", List.of(1L))),
						2L, new AnswerSubmission(102L, 2L, Map.of("selectedOptionIds", List.of(2L))),
						3L, new AnswerSubmission(103L, 3L, Map.of("selectedOptionIds", List.of(1L)))),
				new BigDecimal("4.00"));

		assertThat(result.totalScore()).isEqualByComparingTo("2.00");
		assertThat(result.outcomes()).containsExactly(
				new AnswerOutcome(101L, 1L, true, new BigDecimal("1.00")),
				new AnswerOutcome(102L, 2L, false, BigDecimal.ZERO),
				new AnswerOutcome(103L, 3L, true, new BigDecimal("1.00")));
	}

	@Test
	void scoresAnUnansweredQuestionAsZeroAndReportsNoAnswerId() {
		AutoGradeResult result = AutoGrader.grade(
				List.of(choice(1L, "1.00"), choice(2L, "2.00")),
				Map.of(1L, new AnswerSubmission(101L, 1L, Map.of("selectedOptionIds", List.of(1L)))),
				new BigDecimal("3.00"));

		assertThat(result.totalScore()).isEqualByComparingTo("1.00");
		assertThat(result.outcomes()).hasSize(2);
		AnswerOutcome unanswered = result.outcomes().get(1);
		assertThat(unanswered.questionId()).isEqualTo(2L);
		assertThat(unanswered.answerId()).isNull();
		assertThat(unanswered.correct()).isFalse();
		assertThat(unanswered.score()).isEqualByComparingTo("0");
	}

	@Test
	void scoresZeroWhenTheStudentAnsweredNothingAtAll() {
		AutoGradeResult result = AutoGrader.grade(List.of(choice(1L, "5.00")), Map.of(), new BigDecimal("5.00"));

		assertThat(result.totalScore()).isEqualByComparingTo("0");
		assertThat(result.outcomes().get(0).correct()).isFalse();
	}

	@Test
	void capsTheTotalAtTheModuleMaxScore() {
		/* Question scores are not constrained by the schema to sum to the module max score. */
		AutoGradeResult result = AutoGrader.grade(
				List.of(choice(1L, "8.00"), choice(2L, "8.00")),
				Map.of(
						1L, new AnswerSubmission(101L, 1L, Map.of("selectedOptionIds", List.of(1L))),
						2L, new AnswerSubmission(102L, 2L, Map.of("selectedOptionIds", List.of(1L)))),
				new BigDecimal("10.00"));

		assertThat(result.totalScore()).isEqualByComparingTo("10.00");
		assertThat(result.outcomes()).allSatisfy(outcome ->
				assertThat(outcome.score()).isEqualByComparingTo("8.00"));
	}

	@Test
	void leavesTheTotalUncappedWhenItIsAlreadyWithinTheModuleMaxScore() {
		AutoGradeResult result = AutoGrader.grade(
				List.of(choice(1L, "3.00")),
				Map.of(1L, new AnswerSubmission(101L, 1L, Map.of("selectedOptionIds", List.of(1L)))),
				new BigDecimal("3.00"));

		assertThat(result.totalScore()).isEqualByComparingTo("3.00");
	}

	@Test
	void doesNotCapWhenTheModuleMaxScoreIsUnknown() {
		AutoGradeResult result = AutoGrader.grade(
				List.of(choice(1L, "7.00")),
				Map.of(1L, new AnswerSubmission(101L, 1L, Map.of("selectedOptionIds", List.of(1L)))),
				null);

		assertThat(result.totalScore()).isEqualByComparingTo("7.00");
	}

	@Test
	void treatsANullQuestionScoreAsZeroInsteadOfFailingTheWholeModule() {
		Question question = new Question(1L, 6L, "Content", QuestionType.MULTIPLE_CHOICE, CORRECT_CHOICE, null, 1);

		AutoGradeResult result = AutoGrader.grade(
				List.of(question),
				Map.of(1L, new AnswerSubmission(101L, 1L, Map.of("selectedOptionIds", List.of(1L)))),
				new BigDecimal("5.00"));

		assertThat(result.totalScore()).isEqualByComparingTo("0");
		assertThat(result.outcomes().get(0).correct()).isTrue();
	}

	@Test
	void gradesMixedMultipleChoiceAndShortAnswerQuestions() {
		Question multipleChoice = choice(1L, "1.50");
		Question shortAnswer = new Question(
				2L, 6L, "Content", QuestionType.SHORT_ANSWER, Map.of("correctAnswer", "English"), new BigDecimal("2.50"), 2);

		AutoGradeResult result = AutoGrader.grade(
				List.of(multipleChoice, shortAnswer),
				Map.of(
						1L, new AnswerSubmission(101L, 1L, Map.of("selectedOptionIds", List.of(1L))),
						2L, new AnswerSubmission(102L, 2L, Map.of("text", "  english "))),
				new BigDecimal("4.00"));

		assertThat(result.totalScore()).isEqualByComparingTo("4.00");
		assertThat(result.outcomes()).allMatch(AnswerOutcome::correct);
	}

	@Test
	void toleratesANullAnswerMap() {
		AutoGradeResult result = AutoGrader.grade(List.of(choice(1L, "1.00")), null, new BigDecimal("1.00"));

		assertThat(result.totalScore()).isEqualByComparingTo("0");
	}

	private Question choice(Long id, String score) {
		return new Question(id, 6L, "Content", QuestionType.MULTIPLE_CHOICE, CORRECT_CHOICE, new BigDecimal(score), 1);
	}
}