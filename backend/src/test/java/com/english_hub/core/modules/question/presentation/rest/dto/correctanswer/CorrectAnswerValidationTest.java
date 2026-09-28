package com.english_hub.core.modules.question.presentation.rest.dto.correctanswer;

import static org.assertj.core.api.Assertions.assertThat;

import com.english_hub.core.modules.question.presentation.rest.dto.correctanswer.MultipleChoiceCorrectAnswer.QuestionOption;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

class CorrectAnswerValidationTest {

	private static final String OPTION_COUNT_MESSAGE = "options phải có đúng 4 lựa chọn.";
	private static final String ONE_CORRECT_MESSAGE = "options phải có đúng một lựa chọn đúng và id không được trùng.";

	private static ValidatorFactory validatorFactory;
	private static Validator validator;

	@BeforeAll
	static void setUpValidator() {
		validatorFactory = Validation.buildDefaultValidatorFactory();
		validator = validatorFactory.getValidator();
	}

	@AfterAll
	static void closeValidator() {
		validatorFactory.close();
	}

	@Test
	void acceptsFourOptionsWithExactlyOneCorrectAndUniqueIds() {
		assertThat(messagesOf(option(1, true), option(2, false), option(3, false), option(4, false)))
				.isEmpty();
	}

	@Test
	void rejectsWrongOptionCount() {
		assertThat(messagesOf(option(1, true), option(2, false), option(3, false)))
				.contains(OPTION_COUNT_MESSAGE);
		assertThat(messagesOf(option(1, true), option(2, false), option(3, false), option(4, false), option(5, false)))
				.contains(OPTION_COUNT_MESSAGE);
	}

	@Test
	void rejectsNoCorrectOption() {
		assertThat(messagesOf(option(1, false), option(2, false), option(3, false), option(4, false)))
				.containsExactly(ONE_CORRECT_MESSAGE);
	}

	@Test
	void rejectsTwoCorrectOptions() {
		assertThat(messagesOf(option(1, true), option(2, true), option(3, false), option(4, false)))
				.containsExactly(ONE_CORRECT_MESSAGE);
	}

	@Test
	void rejectsDuplicateOptionIds() {
		assertThat(messagesOf(option(1, true), option(1, false), option(3, false), option(4, false)))
				.containsExactly(ONE_CORRECT_MESSAGE);
	}

	@Test
	void rejectsNullOptions() {
		assertThat(messagesOf(new MultipleChoiceCorrectAnswer(null))).contains("options là bắt buộc.");
	}

	@Test
	void rejectsNullOptionId() {
		assertThat(messagesOf(new QuestionOption(null, "A", true), option(2, false), option(3, false), option(4, false)))
				.contains("id là bắt buộc.");
	}

	@Test
	void rejectsNonPositiveOptionId() {
		assertThat(messagesOf(new QuestionOption(0, "A", true), option(2, false), option(3, false), option(4, false)))
				.contains("id phải là số nguyên dương.");
	}

	@Test
	void rejectsBlankOptionContent() {
		assertThat(messagesOf(
				new QuestionOption(1, "  ", true), option(2, false), option(3, false), option(4, false)))
				.contains("content không được để trống.");
	}

	@Test
	void rejectsNullIsCorrect() {
		assertThat(messagesOf(
				new QuestionOption(1, "A", null), option(2, false), option(3, false), option(4, false)))
				.contains("isCorrect là bắt buộc.");
	}

	@Test
	void acceptsNonBlankShortAnswer() {
		assertThat(messagesOf(new ShortAnswerCorrectAnswer("English"))).isEmpty();
	}

	@Test
	void rejectsBlankOrNullShortAnswer() {
		assertThat(messagesOf(new ShortAnswerCorrectAnswer("  ")))
				.containsExactly("correctAnswer không được để trống.");
		assertThat(messagesOf(new ShortAnswerCorrectAnswer(null)))
				.containsExactly("correctAnswer không được để trống.");
	}

	private Set<String> messagesOf(QuestionOption... options) {
		return messagesOf(new MultipleChoiceCorrectAnswer(List.of(options)));
	}

	private Set<String> messagesOf(CorrectAnswer answer) {
		return validator.validate(answer).stream()
				.map(ConstraintViolation::getMessage)
				.collect(Collectors.toSet());
	}

	private QuestionOption option(int id, boolean isCorrect) {
		return new QuestionOption(id, "Option " + id, isCorrect);
	}
}
