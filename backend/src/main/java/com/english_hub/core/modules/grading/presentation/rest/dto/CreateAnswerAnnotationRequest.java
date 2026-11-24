package com.english_hub.core.modules.grading.presentation.rest.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateAnswerAnnotationRequest(
		@NotNull(message = "Dữ liệu không hợp lệ.") Integer startOffset,
		@NotNull(message = "Dữ liệu không hợp lệ.") Integer endOffset,
		@Size(max = 50, message = "errorType không được vượt quá 50 ký tự.") String errorType,
		String comment,
		String suggestedFix) {
}
