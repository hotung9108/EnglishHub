package com.english_hub.core.modules.module.presentation.rest.dto;

import com.english_hub.core.modules.module.domain.model.ModuleSkill;
import com.english_hub.core.modules.module.domain.model.ModuleTaskType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record CreateModuleRequest(
		@NotNull(message = "skill là bắt buộc.") ModuleSkill skill,
		@NotNull(message = "taskType là bắt buộc.") ModuleTaskType taskType,
		@NotNull(message = "orderIndex là bắt buộc.")
		@Positive(message = "orderIndex phải lớn hơn 0.") Integer orderIndex,
		String instructions,
		String aiInstruction,
		@DecimalMin(value = "0.01", message = "maxScore phải lớn hơn 0.") BigDecimal maxScore) {
}
