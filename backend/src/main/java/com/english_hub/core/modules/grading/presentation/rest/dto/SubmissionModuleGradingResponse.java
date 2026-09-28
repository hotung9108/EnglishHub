package com.english_hub.core.modules.grading.presentation.rest.dto;

import com.english_hub.core.modules.grading.domain.model.Grading;
import java.math.BigDecimal;

public record SubmissionModuleGradingResponse(
		Long id,
		String method,
		String status,
		BigDecimal finalScore) {

	public static SubmissionModuleGradingResponse from(Grading grading) {
		return new SubmissionModuleGradingResponse(
				grading.id(), grading.method().name(), grading.status().name(), grading.finalScore());
	}
}
