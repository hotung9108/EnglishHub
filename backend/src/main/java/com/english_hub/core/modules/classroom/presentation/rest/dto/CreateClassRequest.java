package com.english_hub.core.modules.classroom.presentation.rest.dto;

import java.time.LocalDate;

public record CreateClassRequest(
		String name,
		String level,
		String description,
		LocalDate startDate,
		LocalDate endDate,
		Long teacherId) {
}