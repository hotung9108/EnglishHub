package com.english_hub.core.modules.submission.presentation.rest.dto;

import com.english_hub.core.modules.submission.application.service.SubmissionService.GradingDetailResult;

import java.math.BigDecimal;

public record GradingDetailResponse(
		Long id,
		String method,
		String status,
		BigDecimal finalScore,
		BigDecimal maxScoreSnapshot,
		String aiFeedback,
		String finalFeedback) {

	public static GradingDetailResponse from(GradingDetailResult result) {
		return new GradingDetailResponse(
				result.id(),
				result.method().name(),
				result.status().name(),
				result.finalScore(),
				result.maxScoreSnapshot(),
				result.aiFeedback(),
				result.finalFeedback());
	}
}