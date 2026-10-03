package com.english_hub.core.modules.grading.domain.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.english_hub.core.modules.question.domain.model.QuestionType;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class AnswerComparatorTest {

	@Nested
	@DisplayName("multiple choice")
	class MultipleChoice {

		private final Map<String, Object> correctAnswer = Map.of(
				"options",
				List.of(
						Map.of("id", 1, "content", "Option A", "isCorrect", false),
						Map.of("id", 2, "content", "Option B", "isCorrect", false),
						Map.of("id", 3, "content", "Option C", "isCorrect", true),
						Map.of("id", 4, "content", "Option D", "isCorrect", false)));

		@Test
		void acceptsTheSingleCorrectOption() {
			assertThat(AnswerComparator.matches(
							QuestionType.MULTIPLE_CHOICE, Map.of("selectedOptionIds", List.of(3L)), correctAnswer))
					.isTrue();
		}

		@Test
		void rejectsAnyWrongOption() {
			assertThat(AnswerComparator.matches(
							QuestionType.MULTIPLE_CHOICE, Map.of("selectedOptionIds", List.of(2L)), correctAnswer))
					.isFalse();
		}

		@Test
		void rejectsAnExtraSelectionAlongsideTheCorrectOne() {
			assertThat(AnswerComparator.matches(
							QuestionType.MULTIPLE_CHOICE, Map.of("selectedOptionIds", List.of(3L, 4L)), correctAnswer))
					.isFalse();
		}

		@Test
		void comparesOptionIdsNumericallyAcrossIntegerAndLongWidths() {
			assertThat(AnswerComparator.matches(
							QuestionType.MULTIPLE_CHOICE, Map.of("selectedOptionIds", List.of(3, 4L)), correctAnswer))
					.isFalse();
			assertThat(AnswerComparator.matches(
							QuestionType.MULTIPLE_CHOICE, Map.of("selectedOptionIds", List.of(3, 3L)), correctAnswer))
					.isTrue();
		}

		@Test
		void readsTheLegacySnakeCaseSelectionKeyWrittenBySeeders() {
			assertThat(AnswerComparator.matches(
							QuestionType.MULTIPLE_CHOICE, Map.of("selected_option_ids", List.of(3L)), correctAnswer))
					.isTrue();
		}

		@Test
		void rejectsAnEmptySelection() {
			assertThat(AnswerComparator.matches(
							QuestionType.MULTIPLE_CHOICE, Map.of("selectedOptionIds", List.of()), correctAnswer))
					.isFalse();
		}

		@Test
		void rejectsASelectionWithNoCorrectOptionDeclared() {
			assertThat(AnswerComparator.matches(
							QuestionType.MULTIPLE_CHOICE,
							Map.of("selectedOptionIds", List.of(3L)),
							Map.of("options", List.of(Map.of("id", 3, "content", "Option C", "isCorrect", false)))))
					.isFalse();
		}
	}

	@Nested
	@DisplayName("short answer")
	class ShortAnswer {

		private final Map<String, Object> correctAnswer = Map.of("correctAnswer", "English");

		@Test
		void acceptsAnExactMatch() {
			assertThat(AnswerComparator.matches(QuestionType.SHORT_ANSWER, Map.of("text", "English"), correctAnswer))
					.isTrue();
		}

		@Test
		void ignoresCase() {
			assertThat(AnswerComparator.matches(
							QuestionType.SHORT_ANSWER, Map.of("text", "ENGLISH"), correctAnswer))
					.isTrue();
		}

		@Test
		void ignoresSurroundingWhitespace() {
			assertThat(AnswerComparator.matches(
							QuestionType.SHORT_ANSWER, Map.of("text", "  English \n\t "), correctAnswer))
					.isTrue();
		}

		@Test
		void collapsesInternalWhitespaceRunsToASingleSpace() {
			assertThat(AnswerComparator.matches(
							QuestionType.SHORT_ANSWER,
							Map.of("text", "English    language"),
							Map.of("correctAnswer", "English language")))
					.isTrue();
		}

		@Test
		void treatsPrecomposedAndDecomposedVietnameseAsEqual() {
			Map<String, Object> accented = Map.of("correctAnswer", "Tiếng");
			assertThat(AnswerComparator.matches(
							QuestionType.SHORT_ANSWER, Map.of("text", "Tieng"), accented))
					.isFalse();
			assertThat(AnswerComparator.matches(
							QuestionType.SHORT_ANSWER,
							Map.of("text", java.text.Normalizer.normalize("Tiếng", java.text.Normalizer.Form.NFD)),
							accented))
					.isTrue();
		}

		@Test
		void keepsPunctuationSignificantBecauseTheTeacherAuthoredTheAnswer() {
			assertThat(AnswerComparator.matches(
							QuestionType.SHORT_ANSWER, Map.of("text", "English."), correctAnswer))
					.isFalse();
		}

		@Test
		void rejectsADifferentWord() {
			assertThat(AnswerComparator.matches(QuestionType.SHORT_ANSWER, Map.of("text", "French"), correctAnswer))
					.isFalse();
		}

		@Test
		void rejectsBlankText() {
			assertThat(AnswerComparator.matches(QuestionType.SHORT_ANSWER, Map.of("text", "   "), correctAnswer))
					.isFalse();
		}

		@Test
		void readsTheLegacySnakeCaseTextKeysWrittenBySeeders() {
			assertThat(AnswerComparator.matches(
							QuestionType.SHORT_ANSWER,
							Map.of("answer_text", "english"),
							Map.of("correct_answer", "English")))
					.isTrue();
		}
	}

	@Test
	void rejectsEveryNullInput() {
		assertThat(AnswerComparator.matches(null, Map.of("text", "English"), Map.of("correctAnswer", "English")))
				.isFalse();
		assertThat(AnswerComparator.matches(QuestionType.SHORT_ANSWER, null, Map.of("correctAnswer", "English")))
				.isFalse();
		assertThat(AnswerComparator.matches(QuestionType.SHORT_ANSWER, Map.of("text", "English"), null)).isFalse();
	}

	@Test
	void coercesANonStringScalarTextBecauseJacksonBindsItAsAString() {
		assertThat(AnswerComparator.matches(
						QuestionType.SHORT_ANSWER, Map.of("text", 1984), Map.of("correctAnswer", "1984")))
				.isTrue();
	}
}