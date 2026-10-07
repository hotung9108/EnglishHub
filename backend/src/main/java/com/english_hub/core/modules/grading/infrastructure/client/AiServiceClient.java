package com.english_hub.core.modules.grading.infrastructure.client;

import com.english_hub.core.modules.grading.infrastructure.client.dto.AiSpeakingAnalysisRequest;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiSpeakingAnalysisResponse;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiWritingAnalysisRequest;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiWritingAnalysisResponse;
import org.springframework.core.io.Resource;

public interface AiServiceClient {

	AiSpeakingAnalysisResponse analyzeSpeaking(AiSpeakingAnalysisRequest request);

	AiWritingAnalysisResponse analyzeWriting(AiWritingAnalysisRequest request);

	AiWritingAnalysisResponse analyzeWritingUpload(
			long submissionModuleId,
			Resource documentFile,
			String filename,
			String moduleInstructions,
			String aiInstructionSnapshot,
			Double maxScore,
			String model,
			String aiProvider
	);
}
