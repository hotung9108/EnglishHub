package com.english_hub.core.modules.question.presentation.rest.dto.correctanswer;

import static org.assertj.core.api.Assertions.assertThat;

import com.english_hub.core.modules.question.domain.model.QuestionType;
import com.english_hub.core.modules.question.presentation.rest.dto.CreateQuestionRequest;
import com.english_hub.core.modules.question.presentation.rest.dto.UpdateQuestionRequest;
import com.english_hub.core.modules.question.presentation.rest.dto.correctanswer.MultipleChoiceCorrectAnswer.QuestionOption;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

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

	@ParameterizedTest
	@ValueSource(ints = {0, 1, 2, 3})
	void rejectsNullOptionWithExactlyOneElementViolation(int nullIndex) {
		List<QuestionOption> options = Arrays.asList(
				option(1, true), option(2, false), option(3, false), option(4, false));
		options.set(nullIndex, null);
		Set<ConstraintViolation<MultipleChoiceCorrectAnswer>> violations =
				validator.validate(new MultipleChoiceCorrectAnswer(options));

		assertThat(violations).hasSize(1);
		ConstraintViolation<MultipleChoiceCorrectAnswer> violation = violations.iterator().next();
		assertThat(violation.getConstraintDescriptor().getAnnotation()).isInstanceOf(NotNull.class);
		assertThat(violation.getInvalidValue()).isNull();
		assertThat(violation.getPropertyPath().toString()).isEqualTo("options[" + nullIndex + "].<list element>");
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

	@Test
	void audit03MismatchedQuestionAnswerMustBeRejected() {
		CreateQuestionRequest mcqWithShortAnswer = new CreateQuestionRequest(
				"QA mismatch",
				QuestionType.MULTIPLE_CHOICE,
				new ShortAnswerCorrectAnswer("QA answer"),
				BigDecimal.ONE,
				1);
		Set<ConstraintViolation<CreateQuestionRequest>> mcqViolations = validator.validate(mcqWithShortAnswer);
		assertThat(mcqViolations).isNotEmpty();
		assertThat(mcqViolations)
				.extracting(ConstraintViolation::getMessage)
				.contains(CorrectAnswerDeserializer.INVALID_SHAPE_MESSAGE);

		CreateQuestionRequest shortAnswerWithMcq = new CreateQuestionRequest(
				"QA mismatch",
				QuestionType.SHORT_ANSWER,
				new MultipleChoiceCorrectAnswer(List.of(
						option(1, true), option(2, false), option(3, false), option(4, false))),
				BigDecimal.ONE,
				1);
		Set<ConstraintViolation<CreateQuestionRequest>> shortAnswerViolations = validator.validate(shortAnswerWithMcq);
		assertThat(shortAnswerViolations).isNotEmpty();
		assertThat(shortAnswerViolations)
				.extracting(ConstraintViolation::getMessage)
				.contains(CorrectAnswerDeserializer.INVALID_SHAPE_MESSAGE);

		CreateQuestionRequest validMcq = new CreateQuestionRequest(
				"QA valid",
				QuestionType.MULTIPLE_CHOICE,
				new MultipleChoiceCorrectAnswer(List.of(
						option(1, true), option(2, false), option(3, false), option(4, false))),
				BigDecimal.ONE,
				1);
		assertThat(validator.validate(validMcq)).isEmpty();

		CreateQuestionRequest validShortAnswer = new CreateQuestionRequest(
				"QA valid",
				QuestionType.SHORT_ANSWER,
				new ShortAnswerCorrectAnswer("QA answer"),
				BigDecimal.ONE,
				1);
		assertThat(validator.validate(validShortAnswer)).isEmpty();
	}

	@Test
	void updateRequestRejectsMismatchedQuestionTypeWhenProvided() {
		UpdateQuestionRequest mismatchedUpdate = new UpdateQuestionRequest(
				"QA mismatch",
				new ShortAnswerCorrectAnswer("QA answer"),
				BigDecimal.ONE,
				1,
				QuestionType.MULTIPLE_CHOICE);
		Set<ConstraintViolation<UpdateQuestionRequest>> violations = validator.validate(mismatchedUpdate);
		assertThat(violations).isNotEmpty();
		assertThat(violations)
				.extracting(ConstraintViolation::getMessage)
				.contains(CorrectAnswerDeserializer.INVALID_SHAPE_MESSAGE);

		UpdateQuestionRequest validUpdateWithoutType = new UpdateQuestionRequest(
				"QA valid",
				new ShortAnswerCorrectAnswer("QA answer"),
				BigDecimal.ONE,
				1);
		assertThat(validator.validate(validUpdateWithoutType)).isEmpty();
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
