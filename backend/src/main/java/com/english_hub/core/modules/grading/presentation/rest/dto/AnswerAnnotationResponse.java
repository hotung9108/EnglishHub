package com.english_hub.core.modules.grading.presentation.rest.dto;

import com.english_hub.core.modules.grading.domain.model.AnswerAnnotation;

public record AnswerAnnotationResponse(
		Long id,
		String source,
		int startOffset,
		int endOffset,
		String errorType,
		String comment,
		String suggestedFix,
		String reviewStatus) {

	public static AnswerAnnotationResponse from(AnswerAnnotation annotation) {
		return new AnswerAnnotationResponse(
				annotation.id(),
				annotation.source().name(),
				annotation.startOffset(),
				annotation.endOffset(),
				annotation.errorType(),
				annotation.comment(),
				annotation.suggestedFix(),
				annotation.reviewStatus().name());
	}
}
