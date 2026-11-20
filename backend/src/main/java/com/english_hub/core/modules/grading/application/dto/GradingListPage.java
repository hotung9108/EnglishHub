package com.english_hub.core.modules.grading.application.dto;

import java.util.List;

public record GradingListPage(
		List<GradingSummaryItem> content,
		int page,
		int limit,
		long totalElements) {
}
