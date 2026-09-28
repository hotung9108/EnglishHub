package com.english_hub.core.modules.grading.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class AnswerAnnotationTest {

	@Test
	void teacherAnnotationStartsAccepted() {
		AnswerAnnotation annotation = AnswerAnnotation.teacher(
				8L, 2, 6, 10, "grammar", "Review this phrase", "Use the corrected phrase");

		assertThat(annotation.source()).isEqualTo(AnnotationSource.TEACHER);
		assertThat(annotation.reviewStatus()).isEqualTo(ReviewStatus.ACCEPTED);
	}

	@Test
	void aiAnnotationStartsPending() {
		AnswerAnnotation annotation = AnswerAnnotation.ai(
				8L, 2, 6, 10, "grammar", "Review this phrase", "Use the corrected phrase");

		assertThat(annotation.source()).isEqualTo(AnnotationSource.AI);
		assertThat(annotation.reviewStatus()).isEqualTo(ReviewStatus.PENDING);
	}

	@Test
	void rejectsNegativeStartOffset() {
		assertThatThrownBy(() -> annotation(-1, 2, 10))
				.isInstanceOf(IllegalArgumentException.class);
	}

	@Test
	void rejectsEndOffsetBeforeStartOffset() {
		assertThatThrownBy(() -> annotation(4, 3, 10))
				.isInstanceOf(IllegalArgumentException.class);
	}

	@Test
	void rejectsEndOffsetBeyondAnswerContent() {
		assertThatThrownBy(() -> annotation(2, 11, 10))
				.isInstanceOf(IllegalArgumentException.class);
	}

	private AnswerAnnotation annotation(int startOffset, int endOffset, int contentLength) {
		return AnswerAnnotation.teacher(
				8L,
				startOffset,
				endOffset,
				contentLength,
				"grammar",
				"Review this phrase",
				"Use the corrected phrase");
	}
}
