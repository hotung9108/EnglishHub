package com.english_hub.core.modules.grading.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class GradingTest {

	@Test
	void rejectsNegativeFinalScore() {
		assertThatThrownBy(() -> grading().withTeacherGrade(
				new BigDecimal("-0.01"), "Feedback", 10L, null))
				.isInstanceOf(IllegalArgumentException.class);
	}

	@Test
	void rejectsFinalScoreAboveSnapshot() {
		assertThatThrownBy(() -> grading().withTeacherGrade(
				new BigDecimal("10.01"), "Feedback", 10L, null))
				.isInstanceOf(IllegalArgumentException.class);
	}

	@Test
	void acceptsFinalScoreAtBothBounds() {
		Grading zero = grading().withTeacherGrade(new BigDecimal("0.00"), "Feedback", 10L, null);
		Grading maximum = grading().withTeacherGrade(new BigDecimal("10.00"), "Feedback", 10L, null);

		assertThat(zero.finalScore()).isEqualByComparingTo("0.00");
		assertThat(maximum.finalScore()).isEqualByComparingTo("10.00");
		assertThat(zero.status()).isEqualTo(GradingStatus.COMPLETED);
	}

	private Grading grading() {
		return new Grading(
				1L,
				2L,
				GradingMethod.AUTO,
				GradingStatus.PENDING,
				null,
				null,
				null,
				new BigDecimal("10.00"),
				null,
				null,
				null,
				null,
				null);
	}
}
