package com.english_hub.core.modules.submission.presentation.rest.dto.answercontent;

import static org.assertj.core.api.Assertions.assertThat;

import com.english_hub.core.modules.submission.presentation.rest.dto.SubmitModuleRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

/**
 * Bean-validation rules for the answer content shapes. The deserializer only decides which shape a
 * payload is; these constraints decide whether that shape carries usable values. Both are needed:
 * {@code @Valid} on the request property is what makes these run at all.
 */
class AnswerContentValidationTest {

	private static final String OPTIONS_REQUIRED = "selectedOptionIds là bắt buộc.";
	private static final String OPTIONS_NOT_EMPTY = "selectedOptionIds không được để trống.";
	private static final String OPTION_NOT_NULL = "selectedOptionIds không được chứa giá trị rỗng.";
	private static final String OPTION_POSITIVE = "selectedOptionIds phải là số nguyên dương.";
	private static final String TEXT_NOT_BLANK = "text không được để trống.";

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
	void acceptsAPositiveSelection() {
		assertThat(messagesOf(new MultipleChoiceAnswerContent(List.of(1L, 3L)))).isEmpty();
	}

	@Test
	void rejectsNullSelection() {
		assertThat(messagesOf(new MultipleChoiceAnswerContent(null))).contains(OPTIONS_REQUIRED);
	}

	@Test
	void rejectsEmptySelection() {
		assertThat(messagesOf(new MultipleChoiceAnswerContent(List.of()))).contains(OPTIONS_NOT_EMPTY);
	}

	@Test
	void rejectsNullSelectionElement() {
		assertThat(messagesOf(new MultipleChoiceAnswerContent(Arrays.asList(1L, null))))
				.contains(OPTION_NOT_NULL);
	}

	@Test
	void rejectsNonPositiveSelectionElement() {
		assertThat(messagesOf(new MultipleChoiceAnswerContent(List.of(0L))))
				.contains(OPTION_POSITIVE);
		assertThat(messagesOf(new MultipleChoiceAnswerContent(List.of(-1L))))
				.contains(OPTION_POSITIVE);
	}

	@Test
	void acceptsNonBlankShortAnswer() {
		assertThat(messagesOf(new ShortAnswerAnswerContent("The answer is..."))).isEmpty();
	}

	@Test
	void rejectsBlankOrNullShortAnswer() {
		assertThat(messagesOf(new ShortAnswerAnswerContent("   "))).containsExactly(TEXT_NOT_BLANK);
		assertThat(messagesOf(new ShortAnswerAnswerContent(null))).containsExactly(TEXT_NOT_BLANK);
	}

	/**
	 * Guards the cascade itself. Two links are easy to lose: {@code @Valid} on the content component
	 * of {@code SubmitModuleRequest.AnswerPayload}, and {@code @Valid} on the element type of
	 * {@code SubmitModuleRequest.answers}. Without either, none of the rules above ever run and a
	 * malformed answer reaches the service.
	 */
	@Test
	void cascadesContentValidationFromTheRequestPayload() {
		Set<String> messages = messagesOf(new SubmitModuleRequest.AnswerPayload(
				21L, new MultipleChoiceAnswerContent(List.of(0L))));

		assertThat(messages).contains(OPTION_POSITIVE);
	}

	@Test
	void cascadesContentValidationThroughTheAnswersList() {
		Set<String> messages = messagesOf(new SubmitModuleRequest(List.of(
				new SubmitModuleRequest.AnswerPayload(21L, new ShortAnswerAnswerContent("  ")))));

		assertThat(messages).contains(TEXT_NOT_BLANK);
	}

	@Test
	void rejectsAPayloadWithoutAQuestionId() {
		assertThat(messagesOf(new SubmitModuleRequest.AnswerPayload(null, new ShortAnswerAnswerContent("x"))))
				.contains("questionId là bắt buộc.");
	}

	private Set<String> messagesOf(AnswerContent content) {
		return validator.validate(content).stream()
				.map(ConstraintViolation::getMessage)
				.collect(Collectors.toSet());
	}

	private Set<String> messagesOf(SubmitModuleRequest.AnswerPayload payload) {
		return validator.validate(payload).stream()
				.map(ConstraintViolation::getMessage)
				.collect(Collectors.toSet());
	}

	private Set<String> messagesOf(SubmitModuleRequest request) {
		return validator.validate(request).stream()
				.map(ConstraintViolation::getMessage)
				.collect(Collectors.toSet());
	}
}
