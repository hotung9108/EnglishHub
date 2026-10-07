package com.english_hub.core.modules.submission.presentation.rest.dto;

import com.english_hub.core.modules.submission.application.service.SubmissionService.GradingSummaryResult;

import java.math.BigDecimal;

public record GradingSummaryResponse(
		BigDecimal finalScore,
		BigDecimal maxScoreSnapshot,
		String status) {

	public static GradingSummaryResponse from(GradingSummaryResult result) {
		return new GradingSummaryResponse(
				result.finalScore(),
				result.maxScoreSnapshot(),
				result.status().name());
	}
}