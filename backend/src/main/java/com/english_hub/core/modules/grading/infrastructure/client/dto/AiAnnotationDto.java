package com.english_hub.core.modules.grading.infrastructure.client.dto;

public record AiAnnotationDto(
		int startOffset,
		int endOffset,
		String errorType,
		String comment,
		String suggestedFix
) {}
