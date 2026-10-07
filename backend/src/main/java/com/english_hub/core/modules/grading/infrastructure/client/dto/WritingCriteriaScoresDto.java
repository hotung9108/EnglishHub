package com.english_hub.core.modules.grading.infrastructure.client.dto;

public record WritingCriteriaScoresDto(
		double taskResponse,
		double coherenceAndCohesion,
		double lexicalResource,
		double grammaticalRangeAndAccuracy,
		double overallScore
) {}
