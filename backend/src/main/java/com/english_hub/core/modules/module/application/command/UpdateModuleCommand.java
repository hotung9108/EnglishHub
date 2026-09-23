package com.english_hub.core.modules.module.application.command;

import java.math.BigDecimal;

public record UpdateModuleCommand(
		String instructions,
		String aiInstruction,
		BigDecimal maxScore,
		Integer orderIndex) {
}
