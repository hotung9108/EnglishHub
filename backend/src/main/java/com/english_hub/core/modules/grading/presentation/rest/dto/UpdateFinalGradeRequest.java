package com.english_hub.core.modules.grading.presentation.rest.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record UpdateFinalGradeRequest(
		@NotNull(message = "Điểm số không hợp lệ so với thang điểm tối đa.") BigDecimal finalScore,
		String finalFeedback,
		String note) {
}
