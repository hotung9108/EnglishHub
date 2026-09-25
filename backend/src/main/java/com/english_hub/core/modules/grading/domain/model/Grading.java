package com.english_hub.core.modules.grading.domain.model;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/** Domain view of a persisted grading. */
public record Grading(
		Long id,
		Long submissionModuleId,
		GradingMethod method,
		GradingStatus status,
		String aiFeedback,
		BigDecimal finalScore,
		String finalFeedback,
		BigDecimal maxScoreSnapshot,
		Long reviewedBy,
		OffsetDateTime reviewedAt,
		OffsetDateTime gradedAt,
		Object aiTranscript,
		String aiInstructionSnapshot) {

	public Grading withTeacherGrade(
			BigDecimal score,
			String feedback,
			Long teacherId,
			OffsetDateTime gradedAt) {
		if (score == null
				|| maxScoreSnapshot == null
				|| score.compareTo(BigDecimal.ZERO) < 0
				|| score.compareTo(maxScoreSnapshot) > 0) {
			throw new IllegalArgumentException("Final score must be between zero and maxScoreSnapshot.");
		}
		return new Grading(
				id,
				submissionModuleId,
				GradingMethod.TEACHER_MANUAL,
				GradingStatus.COMPLETED,
				aiFeedback,
				score,
				feedback,
				maxScoreSnapshot,
				teacherId,
				gradedAt,
				gradedAt,
				aiTranscript,
				aiInstructionSnapshot);
	}
}
