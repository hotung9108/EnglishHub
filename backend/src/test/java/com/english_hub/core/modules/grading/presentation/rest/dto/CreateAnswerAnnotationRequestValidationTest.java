package com.english_hub.core.modules.grading.presentation.rest.dto;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.util.Set;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

class CreateAnswerAnnotationRequestValidationTest {

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

	@ParameterizedTest
	@NullSource
	@ValueSource(strings = {"", "   "})
	void acceptsOptionalErrorType(String errorType) {
		CreateAnswerAnnotationRequest request = new CreateAnswerAnnotationRequest(0, 5, errorType, "Comment", "Fix");

		assertThat(validator.validate(request)).isEmpty();
		assertThat(request.errorType()).isEqualTo(errorType);
	}

	@ParameterizedTest
	@CsvSource({"50, true", "51, false"})
	void validatesErrorTypeLength(int length, boolean valid) {
		CreateAnswerAnnotationRequest request =
				new CreateAnswerAnnotationRequest(0, 5, "G".repeat(length), "Comment", "Fix");

		Set<ConstraintViolation<CreateAnswerAnnotationRequest>> violations = validator.validate(request);

		if (valid) {
			assertThat(violations).isEmpty();
		} else {
			assertThat(violations).singleElement().satisfies(violation -> {
				assertThat(violation.getPropertyPath().toString()).isEqualTo("errorType");
				assertThat(violation.getMessage()).isEqualTo("errorType không được vượt quá 50 ký tự.");
				assertThat(violation.getInvalidValue()).isEqualTo(request.errorType());
			});
		}
	}
}
