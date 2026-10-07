package com.english_hub.core.modules.grading.presentation.rest.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.util.List;

/**
 * Unified AI Grading & Suggestion Response (UC25).
 * Aggregates evaluations from Speaking (UC26) and Writing (UC27) pipelines
 * with fallback guidance for manual grading (PP R6 / PP 6.5.2).
 */
public record AiGradingSuggestionResponse(
		long submissionModuleId,
		long gradingId,
		String skill,
		String status,
		BigDecimal suggestedScore,
		BigDecimal maxScore,
		String aiFeedback,
		JsonNode criteriaScores,
		JsonNode metrics,
		List<AnswerAnnotationResponse> annotations,
		JsonNode transcript,
		String modelUsed,
		String providerUsed,
		boolean canTriggerAi,
		boolean fallbackManualGradingAvailable,
		String fallbackMessage
) {}
