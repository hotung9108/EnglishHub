package com.english_hub.core.modules.grading.presentation.rest.dto;

import com.english_hub.core.modules.grading.domain.model.Grading;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record GradingDetailResponse(
		Long id,
		Long submissionModuleId,
		String method,
		String status,
		String aiFeedback,
		Object aiTranscript,
		BigDecimal finalScore,
		String finalFeedback,
		BigDecimal maxScoreSnapshot,
		Long reviewedBy,
		OffsetDateTime reviewedAt,
		OffsetDateTime gradedAt,
		String aiInstructionSnapshot) {

	public static GradingDetailResponse from(Grading grading) {
		return new GradingDetailResponse(
				grading.id(),
				grading.submissionModuleId(),
				grading.method().name(),
				grading.status().name(),
				grading.aiFeedback(),
				grading.aiTranscript(),
				grading.finalScore(),
				grading.finalFeedback(),
				grading.maxScoreSnapshot(),
				grading.reviewedBy(),
				grading.reviewedAt(),
				grading.gradedAt(),
				grading.aiInstructionSnapshot());
	}
}
