package com.english_hub.core.modules.module.presentation.rest.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record UpdateModuleRequest(
		String instructions,
		String aiInstruction,
		@DecimalMin(value = "0.01", message = "maxScore phải lớn hơn 0.") BigDecimal maxScore,
		@Positive(message = "orderIndex phải lớn hơn 0.") Integer orderIndex) {
}
