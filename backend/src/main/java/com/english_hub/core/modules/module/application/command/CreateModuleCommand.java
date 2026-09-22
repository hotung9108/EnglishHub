package com.english_hub.core.modules.module.application.command;

import com.english_hub.core.modules.module.domain.model.ModuleSkill;
import com.english_hub.core.modules.module.domain.model.ModuleTaskType;
import java.math.BigDecimal;

public record CreateModuleCommand(
		ModuleSkill skill,
		ModuleTaskType taskType,
		int orderIndex,
		String instructions,
		String aiInstruction,
		BigDecimal maxScore) {
}
