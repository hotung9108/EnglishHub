package com.english_hub.core.modules.submission.presentation.rest.dto;

import com.english_hub.core.modules.submission.presentation.rest.dto.answercontent.AnswerContent;
import com.english_hub.core.modules.submission.presentation.rest.dto.answercontent.AnswerContentDeserializer;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import tools.jackson.databind.annotation.JsonDeserialize;

public record SubmitModuleRequest(List<@Valid AnswerPayload> answers) {

	/**
	 * {@code answers} is deliberately left unconstrained: an absent or empty list is rejected by
	 * {@code SubmissionService} with the answer-content error, not by bean validation. The
	 * {@code @Valid} on the element type is what cascades into each payload's {@link AnswerContent}.
	 */
	public record AnswerPayload(
			@NotNull(message = "questionId là bắt buộc.") Long questionId,
			@JsonDeserialize(using = AnswerContentDeserializer.class)
			@Valid @NotNull(message = "content là bắt buộc.") AnswerContent content) {
	}
}
