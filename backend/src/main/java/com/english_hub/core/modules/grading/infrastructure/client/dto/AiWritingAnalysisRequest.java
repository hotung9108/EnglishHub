package com.english_hub.core.modules.grading.infrastructure.client.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AiWritingAnalysisRequest(
		long submissionModuleId,
		String content,
		String moduleInstructions,
		String aiInstructionSnapshot,
		double maxScore,
		String model,
		String aiProvider
) {
	public AiWritingAnalysisRequest(
			long submissionModuleId,
			String content,
			String moduleInstructions,
			String aiInstructionSnapshot,
			double maxScore
	) {
		this(submissionModuleId, content, moduleInstructions, aiInstructionSnapshot, maxScore, null, null);
	}
}
