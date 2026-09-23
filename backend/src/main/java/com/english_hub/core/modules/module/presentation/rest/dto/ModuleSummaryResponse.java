package com.english_hub.core.modules.module.presentation.rest.dto;

import com.english_hub.core.modules.module.domain.model.Module;
import java.math.BigDecimal;

public record ModuleSummaryResponse(
		Long id,
		String skill,
		int orderIndex,
		BigDecimal maxScore) {

	public static ModuleSummaryResponse from(Module module) {
		return new ModuleSummaryResponse(
				module.id(),
				module.skill().name(),
				module.orderIndex(),
				module.maxScore());
	}
}
