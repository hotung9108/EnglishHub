package com.english_hub.core.modules.question.presentation.rest.dto.correctanswer;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@ValidMultipleChoiceAnswer
public record MultipleChoiceCorrectAnswer(
		@NotNull(message = "options là bắt buộc.")
		@Size(min = 4, max = 4, message = "options phải có đúng 4 lựa chọn.")
		List<@Valid QuestionOption> options) implements CorrectAnswer {

	@Override
	public Map<String, Object> toMap() {
		return Map.of("options", options.stream().map(QuestionOption::toMap).toList());
	}

	public record QuestionOption(
			@NotNull(message = "id là bắt buộc.")
			@Positive(message = "id phải là số nguyên dương.") Integer id,
			@NotBlank(message = "content không được để trống.") String content,
			@NotNull(message = "isCorrect là bắt buộc.")
			@JsonProperty("isCorrect") @JsonAlias("is_correct") Boolean isCorrect) {

		Map<String, Object> toMap() {
			Map<String, Object> option = new LinkedHashMap<>();
			option.put("id", id);
			option.put("content", content);
			option.put("isCorrect", isCorrect);
			return option;
		}
	}
}
