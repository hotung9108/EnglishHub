package com.english_hub.core.modules.grading.infrastructure.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AiWritingAnalysisResponse(
		long submissionModuleId,
		double overallScore,
		String aiFeedback,
		WritingCriteriaScoresDto criteriaScores,
		TextMetricsDto textMetrics,
		List<AiAnnotationDto> annotations,
		String modelUsed,
		String providerUsed
) {
	public AiWritingAnalysisResponse(
			long submissionModuleId,
			double overallScore,
			String aiFeedback,
			WritingCriteriaScoresDto criteriaScores,
			TextMetricsDto textMetrics,
			List<AiAnnotationDto> annotations
	) {
		this(submissionModuleId, overallScore, aiFeedback, criteriaScores, textMetrics, annotations, null, null);
	}
}
