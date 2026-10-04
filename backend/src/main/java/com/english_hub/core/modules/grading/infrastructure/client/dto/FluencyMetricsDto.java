package com.english_hub.core.modules.grading.infrastructure.client.dto;

public record FluencyMetricsDto(
		double wordsPerMinute,
		int pauseCount,
		double totalDurationSeconds,
		double phonationTimeRatio
) {}
