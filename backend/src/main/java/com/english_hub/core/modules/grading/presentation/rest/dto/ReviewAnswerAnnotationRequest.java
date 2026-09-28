package com.english_hub.core.modules.grading.presentation.rest.dto;

import jakarta.validation.constraints.NotBlank;

public record ReviewAnswerAnnotationRequest(
		@NotBlank(message = "Không thể duyệt chú thích này.") String reviewStatus) {
}
