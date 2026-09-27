package com.english_hub.core.modules.question.presentation.rest.dto.correctanswer;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Enforces the two {@link MultipleChoiceCorrectAnswer} rules that standard bean-validation
 * annotations cannot express: exactly one option flagged correct, and option ids that are unique
 * across the list. The list size itself is covered by {@code @Size} on the component.
 */
@Documented
@Constraint(validatedBy = ValidMultipleChoiceAnswerValidator.class)
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidMultipleChoiceAnswer {

	String message() default "options phải có đúng một lựa chọn đúng và id không được trùng.";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};
}
