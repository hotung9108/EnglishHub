package com.english_hub.core.modules.grading.infrastructure.client.dto;

public record CriteriaScoresDto(
		double fluencyAndCoherence,
		double lexicalResource,
		double grammaticalRangeAndAccuracy,
		double pronunciation,
		Double overallScore
) {}
