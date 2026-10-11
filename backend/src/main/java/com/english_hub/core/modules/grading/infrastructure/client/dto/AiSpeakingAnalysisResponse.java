package com.english_hub.core.modules.grading.infrastructure.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import tools.jackson.databind.JsonNode;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AiSpeakingAnalysisResponse(
		long submissionModuleId,
		Double overallScore,
		String aiFeedback,
		JsonNode aiTranscript,
		FluencyMetricsDto fluencyMetrics,
		CriteriaScoresDto criteriaScores,
		List<AiAnnotationDto> annotations,
		String modelUsed,
		String providerUsed
) {
	public AiSpeakingAnalysisResponse(
			long submissionModuleId,
			Double overallScore,
			String aiFeedback,
			JsonNode aiTranscript,
			FluencyMetricsDto fluencyMetrics,
			CriteriaScoresDto criteriaScores,
			List<AiAnnotationDto> annotations
	) {
		this(submissionModuleId, overallScore, aiFeedback, aiTranscript, fluencyMetrics, criteriaScores, annotations, null, null);
	}
}
