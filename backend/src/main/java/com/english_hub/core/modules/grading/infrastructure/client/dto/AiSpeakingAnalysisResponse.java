package com.english_hub.core.modules.grading.infrastructure.client.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;

public record AiSpeakingAnalysisResponse(
		long submissionModuleId,
		double overallScore,
		String aiFeedback,
		JsonNode aiTranscript,
		FluencyMetricsDto fluencyMetrics,
		CriteriaScoresDto criteriaScores,
		List<AiAnnotationDto> annotations
) {}
