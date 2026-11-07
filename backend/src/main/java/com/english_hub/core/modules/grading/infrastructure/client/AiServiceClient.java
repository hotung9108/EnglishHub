package com.english_hub.core.modules.grading.infrastructure.client;

import com.english_hub.core.modules.grading.infrastructure.client.dto.AiSpeakingAnalysisRequest;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiSpeakingAnalysisResponse;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiWritingAnalysisRequest;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiWritingAnalysisResponse;

public interface AiServiceClient {

	AiSpeakingAnalysisResponse analyzeSpeaking(AiSpeakingAnalysisRequest request);

	AiWritingAnalysisResponse analyzeWriting(AiWritingAnalysisRequest request);
}
