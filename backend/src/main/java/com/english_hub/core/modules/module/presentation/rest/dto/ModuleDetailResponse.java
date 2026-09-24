package com.english_hub.core.modules.module.presentation.rest.dto;

import com.english_hub.core.modules.module.domain.model.Module;
import java.math.BigDecimal;

public record ModuleDetailResponse(
		Long id,
		String skill,
		String taskType,
		int orderIndex,
		BigDecimal maxScore,
		String instructions,
		String aiInstruction,
		String sourceAudioStorageKey,
		Integer sourceAudioDurationSeconds,
		String sourceAudioMimeType,
		String sourceAudioUploadStatus) {

	public static ModuleDetailResponse from(Module module) {
		return new ModuleDetailResponse(
				module.id(),
				module.skill().name(),
				module.taskType().name(),
				module.orderIndex(),
				module.maxScore(),
				module.instructions(),
				module.aiInstruction(),
				module.sourceAudioStorageKey(),
				module.sourceAudioDurationSeconds(),
				module.sourceAudioMimeType(),
				module.sourceAudioUploadStatus() == null ? null : module.sourceAudioUploadStatus().name());
	}
}
