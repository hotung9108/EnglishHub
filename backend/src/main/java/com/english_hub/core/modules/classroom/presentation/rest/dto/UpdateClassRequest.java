package com.english_hub.core.modules.classroom.presentation.rest.dto;

import java.time.LocalDate;

public record UpdateClassRequest(
		String name,
		String level,
		String description,
		LocalDate endDate,
		String status,
		Long teacherId) {
}