package com.english_hub.core.modules.submission.presentation.rest.dto.answercontent;

import com.english_hub.core.modules.submission.domain.model.QuestionType;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;
import java.util.Map;

/** Submitted answer content for a {@code MULTIPLE_CHOICE} question. */
public record MultipleChoiceAnswerContent(
		@NotNull(message = "selectedOptionIds là bắt buộc.")
		@NotEmpty(message = "selectedOptionIds không được để trống.")
		List<@NotNull(message = "selectedOptionIds không được chứa giá trị rỗng.") @Positive(message = "selectedOptionIds phải là số nguyên dương.") Long> selectedOptionIds)
		implements AnswerContent {

	@Override
	public QuestionType questionType() {
		return QuestionType.MULTIPLE_CHOICE;
	}

	@Override
	public Map<String, Object> toMap() {
		return Map.of("selectedOptionIds", selectedOptionIds);
	}
}
