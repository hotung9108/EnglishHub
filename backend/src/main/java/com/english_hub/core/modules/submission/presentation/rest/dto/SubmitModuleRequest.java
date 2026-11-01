package com.english_hub.core.modules.submission.presentation.rest.dto;

import com.english_hub.core.modules.submission.presentation.rest.dto.answercontent.AnswerContent;
import com.english_hub.core.modules.submission.presentation.rest.dto.answercontent.AnswerContentDeserializer;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import tools.jackson.databind.annotation.JsonDeserialize;

public record SubmitModuleRequest(
		List<@NotNull(message = "answers không được chứa phần tử null.") @Valid AnswerPayload> answers) {

	/**
	 * The list itself remains unconstrained: {@code SubmissionService} decides whether absent or
	 * empty answers are valid for the module. Element-level {@code @NotNull} rejects null payloads;
	 * {@code @Valid} cascades into each payload's {@link AnswerContent}.
	 */
	public record AnswerPayload(
			@NotNull(message = "questionId là bắt buộc.") Long questionId,
			@JsonDeserialize(using = AnswerContentDeserializer.class)
			@Valid @NotNull(message = "content là bắt buộc.") AnswerContent content) {
	}
}
