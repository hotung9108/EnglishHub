package com.english_hub.core.modules.grading.infrastructure.client.dto;

public record TextMetricsDto(
		int wordCount,
		int sentenceCount,
		double averageSentenceLength,
		double lexicalDiversity,
		double fleschKincaidGrade
) {}
