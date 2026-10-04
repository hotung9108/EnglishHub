package com.english_hub.core.modules.grading.infrastructure.client.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AiSpeakingAnalysisRequest(
		long submissionModuleId,
		String audioUrl,
		String audioBase64,
		String audioStorageKey,
		String moduleInstructions,
		String aiInstructionSnapshot,
		double maxScore,
		String model,
		String aiProvider
) {
	public AiSpeakingAnalysisRequest(
			long submissionModuleId,
			String audioUrl,
			String audioBase64,
			String audioStorageKey,
			String moduleInstructions,
			String aiInstructionSnapshot,
			double maxScore
	) {
		this(submissionModuleId, audioUrl, audioBase64, audioStorageKey, moduleInstructions, aiInstructionSnapshot, maxScore, null, null);
	}
}
