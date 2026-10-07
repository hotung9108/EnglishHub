package com.english_hub.core.modules.grading.infrastructure.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AiAnnotationDto(
		int startOffset,
		int endOffset,
		String exactText,
		String errorType,
		String comment,
		String suggestedFix
) {
	public AiAnnotationDto(
			int startOffset,
			int endOffset,
			String errorType,
			String comment,
			String suggestedFix
	) {
		this(startOffset, endOffset, null, errorType, comment, suggestedFix);
	}
}
