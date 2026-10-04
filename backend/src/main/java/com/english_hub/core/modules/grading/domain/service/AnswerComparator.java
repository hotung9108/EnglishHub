package com.english_hub.core.modules.grading.domain.service;

import com.english_hub.core.modules.question.domain.model.QuestionType;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Compares a submitted answer against the expected answer for the same question.
 *
 * <p>Both sides accept camelCase and legacy snake_case keys: {@code QuestionPersistenceMapper}
 * normalizes {@code questions.correct_answer} to camelCase on read, but {@code answers.content}
 * written by the dev seeders still uses the legacy spellings.
 *
 * <p>Multiple-choice ids are compared numerically because the answer carries {@code Long} ids
 * while the correct-answer options carry {@code Integer} ids, and are compared as a set because
 * {@code MultipleChoiceAnswerContent} allows a multi-select payload.
 */
public final class AnswerComparator {

	private static final String SELECTED_OPTION_IDS = "selectedOptionIds";
	private static final String LEGACY_SELECTED_OPTION_IDS = "selected_option_ids";
	private static final String ANSWER_TEXT = "text";
	private static final String LEGACY_ANSWER_TEXT = "answer_text";
	private static final String CORRECT_ANSWER_TEXT = "correctAnswer";
	private static final String LEGACY_CORRECT_ANSWER_TEXT = "correct_answer";
	private static final String OPTIONS = "options";
	private static final String OPTION_ID = "id";
	private static final String OPTION_IS_CORRECT = "isCorrect";
	private static final String LEGACY_OPTION_IS_CORRECT = "is_correct";

	private AnswerComparator() {
	}

	public static boolean matches(
			QuestionType questionType,
			Map<String, Object> answerContent,
			Map<String, Object> correctAnswer) {
		if (questionType == null || answerContent == null || correctAnswer == null) {
			return false;
		}
		return switch (questionType) {
			case MULTIPLE_CHOICE -> matchesMultipleChoice(answerContent, correctAnswer);
			case SHORT_ANSWER -> matchesShortAnswer(answerContent, correctAnswer);
		};
	}

	private static boolean matchesMultipleChoice(
			Map<String, Object> answerContent, Map<String, Object> correctAnswer) {
		Set<BigDecimal> selected = selectedOptionIds(answerContent);
		return !selected.isEmpty() && selected.equals(correctOptionIds(correctAnswer));
	}

	private static boolean matchesShortAnswer(
			Map<String, Object> answerContent, Map<String, Object> correctAnswer) {
		String expected = AnswerTextNormalizer.normalize(text(firstPresent(
				correctAnswer, CORRECT_ANSWER_TEXT, LEGACY_CORRECT_ANSWER_TEXT)));
		String actual = AnswerTextNormalizer.normalize(
				text(firstPresent(answerContent, ANSWER_TEXT, LEGACY_ANSWER_TEXT)));
		return !actual.isEmpty() && actual.equals(expected);
	}

	private static Set<BigDecimal> selectedOptionIds(Map<String, Object> answerContent) {
		Object raw = firstPresent(answerContent, SELECTED_OPTION_IDS, LEGACY_SELECTED_OPTION_IDS);
		if (!(raw instanceof Collection<?> values)) {
			return Set.of();
		}
		Set<BigDecimal> ids = new LinkedHashSet<>();
		for (Object value : values) {
			toId(value).ifPresent(ids::add);
		}
		return ids;
	}

	private static Set<BigDecimal> correctOptionIds(Map<String, Object> correctAnswer) {
		if (!(correctAnswer.get(OPTIONS) instanceof Collection<?> options)) {
			return Set.of();
		}
		Set<BigDecimal> ids = new LinkedHashSet<>();
		for (Object option : options) {
			if (!(option instanceof Map<?, ?> fields)) {
				continue;
			}
			if (!Boolean.TRUE.equals(firstPresent(fields, OPTION_IS_CORRECT, LEGACY_OPTION_IS_CORRECT))) {
				continue;
			}
			toId(fields.get(OPTION_ID)).ifPresent(ids::add);
		}
		return ids;
	}

	private static Object firstPresent(Map<?, ?> source, String primaryKey, String legacyKey) {
		if (source == null) {
			return null;
		}
		Object value = source.get(primaryKey);
		return value != null ? value : source.get(legacyKey);
	}

	private static Optional<BigDecimal> toId(Object value) {
		if (value == null) {
			return Optional.empty();
		}
		try {
			return Optional.of(new BigDecimal(String.valueOf(value).trim()).stripTrailingZeros());
		} catch (NumberFormatException exception) {
			return Optional.empty();
		}
	}

	private static String text(Object value) {
		return value == null ? "" : String.valueOf(value);
	}
}