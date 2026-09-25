package com.english_hub.core.modules.grading.presentation.rest.dto;

import jakarta.validation.constraints.NotNull;

public record CreateAnswerAnnotationRequest(
		@NotNull(message = "Dữ liệu không hợp lệ.") Integer startOffset,
		@NotNull(message = "Dữ liệu không hợp lệ.") Integer endOffset,
		String errorType,
		String comment,
		String suggestedFix) {
}
