package com.english_hub.core.modules.grading.infrastructure.client;

import com.english_hub.core.modules.grading.infrastructure.client.dto.AiSpeakingAnalysisRequest;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiSpeakingAnalysisResponse;

public interface AiServiceClient {

	AiSpeakingAnalysisResponse analyzeSpeaking(AiSpeakingAnalysisRequest request);
}
