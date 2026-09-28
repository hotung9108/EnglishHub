package com.english_hub.core.modules.module.domain.model;

import java.math.BigDecimal;

public record Module(
		Long id,
		Long assignmentId,
		ModuleSkill skill,
		ModuleTaskType taskType,
		int orderIndex,
		String instructions,
		BigDecimal maxScore,
		String sourceAudioStorageKey,
		Integer sourceAudioDurationSeconds,
		String sourceAudioMimeType,
		ModuleUploadStatus sourceAudioUploadStatus,
		String aiInstruction) {

	public Module withDetails(
			String newInstructions,
			String newAiInstruction,
			BigDecimal newMaxScore,
			int newOrderIndex) {
		return new Module(
				id,
				assignmentId,
				skill,
				taskType,
				newOrderIndex,
				newInstructions,
				newMaxScore,
				sourceAudioStorageKey,
				sourceAudioDurationSeconds,
				sourceAudioMimeType,
				sourceAudioUploadStatus,
				newAiInstruction);
	}

	public Module withAudio(
			String newStorageKey,
			Integer newDurationSeconds,
			String newMimeType,
			ModuleUploadStatus newUploadStatus) {
		return new Module(
				id,
				assignmentId,
				skill,
				taskType,
				orderIndex,
				instructions,
				maxScore,
				newStorageKey,
				newDurationSeconds,
				newMimeType,
				newUploadStatus,
				aiInstruction);
	}
}
