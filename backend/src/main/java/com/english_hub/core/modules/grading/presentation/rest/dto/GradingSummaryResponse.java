package com.english_hub.core.modules.grading.presentation.rest.dto;

import com.english_hub.core.modules.grading.domain.model.Grading;
import java.math.BigDecimal;

public record GradingSummaryResponse(Long id, String status, BigDecimal finalScore) {

	public static GradingSummaryResponse from(Grading grading) {
		return new GradingSummaryResponse(grading.id(), grading.status().name(), grading.finalScore());
	}
}
