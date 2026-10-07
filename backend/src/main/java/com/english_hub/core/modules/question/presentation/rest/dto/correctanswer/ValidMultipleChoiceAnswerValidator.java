package com.english_hub.core.modules.question.presentation.rest.dto.correctanswer;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.HashSet;
import java.util.Set;

public class ValidMultipleChoiceAnswerValidator
		implements ConstraintValidator<ValidMultipleChoiceAnswer, MultipleChoiceCorrectAnswer> {

	@Override
	public boolean isValid(MultipleChoiceCorrectAnswer answer, ConstraintValidatorContext context) {
		if (answer == null || answer.options() == null) {
			return true;
		}
		return hasExactlyOneCorrectOption(answer) && hasUniqueIds(answer);
	}

	private boolean hasExactlyOneCorrectOption(MultipleChoiceCorrectAnswer answer) {
		long correctCount = answer.options().stream()
				.filter(option -> Boolean.TRUE.equals(option.isCorrect()))
				.count();
		return correctCount == 1;
	}

	private boolean hasUniqueIds(MultipleChoiceCorrectAnswer answer) {
		Set<Integer> ids = new HashSet<>();
		return answer.options().stream()
				.allMatch(option -> option.id() == null || ids.add(option.id()));
	}
}
