package com.english_hub.core.modules.grading.domain.model;

public record AnswerAnnotation(
		Long id,
		Long answerId,
		AnnotationSource source,
		int startOffset,
		int endOffset,
		String errorType,
		String comment,
		String suggestedFix,
		ReviewStatus reviewStatus) {

	public static AnswerAnnotation teacher(
			Long answerId,
			int startOffset,
			int endOffset,
			Integer contentLength,
			String errorType,
			String comment,
			String suggestedFix) {
		validateOffsets(startOffset, endOffset, contentLength);
		return new AnswerAnnotation(
				null,
				answerId,
				AnnotationSource.TEACHER,
				startOffset,
				endOffset,
				errorType,
				comment,
				suggestedFix,
				ReviewStatus.ACCEPTED);
	}

	public static AnswerAnnotation ai(
			Long answerId,
			int startOffset,
			int endOffset,
			Integer contentLength,
			String errorType,
			String comment,
			String suggestedFix) {
		validateOffsets(startOffset, endOffset, contentLength);
		return new AnswerAnnotation(
				null,
				answerId,
				AnnotationSource.AI,
				startOffset,
				endOffset,
				errorType,
				comment,
				suggestedFix,
				ReviewStatus.PENDING);
	}

	public AnswerAnnotation withReviewStatus(ReviewStatus nextStatus) {
		return new AnswerAnnotation(
				id,
				answerId,
				source,
				startOffset,
				endOffset,
				errorType,
				comment,
				suggestedFix,
				nextStatus);
	}

	private static void validateOffsets(int startOffset, int endOffset, Integer contentLength) {
		if (startOffset < 0
				|| endOffset < startOffset
				|| (contentLength != null && (contentLength < 0 || endOffset > contentLength))) {
			throw new IllegalArgumentException("Annotation offsets must fit within the answer content.");
		}
	}
}
