package com.english_hub.core.modules.classroom.presentation.rest.dto;

import com.english_hub.core.modules.classroom.domain.model.EnglishClass;

public record ClassSummaryResponse(
		Long id,
		String name,
		String status,
		Long teacherId) {

	public static ClassSummaryResponse from(EnglishClass englishClass) {
		return new ClassSummaryResponse(
				englishClass.getId(),
				englishClass.getName(),
				englishClass.getStatus().name(),
				englishClass.getTeacherId());
	}
}