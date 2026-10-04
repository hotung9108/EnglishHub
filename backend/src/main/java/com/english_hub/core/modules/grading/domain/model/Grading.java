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

	/**
	 * Deterministic answer-comparison verdict. Keeps the method {@code AUTO} and leaves
	 * {@code reviewedBy}/{@code reviewedAt} null because no teacher reviewed it; a later teacher
	 * override goes through {@link #withTeacherGrade} and is audited in {@code grading_change_logs}.
	 */
	public Grading withAutoGrade(BigDecimal score, BigDecimal maxScore, OffsetDateTime gradedAt) {
		if (score == null
				|| maxScore == null
				|| score.compareTo(BigDecimal.ZERO) < 0
				|| score.compareTo(maxScore) > 0) {
			throw new IllegalArgumentException("Auto score must be between zero and the module max score.");
		}
		return new Grading(
				id,
				submissionModuleId,
				GradingMethod.AUTO,
				GradingStatus.COMPLETED,
				aiFeedback,
				score,
				finalFeedback,
				maxScore,
				null,
				null,
				gradedAt,
				aiTranscript,
				aiInstructionSnapshot);
	}

	public Grading withAiGrade(
			BigDecimal score,
			String feedback,
			Object transcript,
			OffsetDateTime gradedAt) {
		if (score != null && maxScoreSnapshot != null
				&& (score.compareTo(BigDecimal.ZERO) < 0 || score.compareTo(maxScoreSnapshot) > 0)) {
			throw new IllegalArgumentException("AI score must be between zero and maxScoreSnapshot.");
		}
		return new Grading(
				id,
				submissionModuleId,
				GradingMethod.AUTO,
				GradingStatus.AI_GRADED,
				feedback,
				score,
				feedback,
				maxScoreSnapshot,
				null,
				null,
				gradedAt,
				transcript,
				aiInstructionSnapshot);
	}

	public Grading withFailedStatus() {
		return new Grading(
				id,
				submissionModuleId,
				method,
				GradingStatus.FAILED,
				aiFeedback,
				finalScore,
				finalFeedback,
				maxScoreSnapshot,
				reviewedBy,
				reviewedAt,
				gradedAt,
				aiTranscript,
				aiInstructionSnapshot);
	}
}
