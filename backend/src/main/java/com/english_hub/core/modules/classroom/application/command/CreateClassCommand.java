package com.english_hub.core.modules.classroom.application.command;

import java.time.LocalDate;

public record CreateClassCommand(
		String name,
		String level,
		String description,
		LocalDate startDate,
		LocalDate endDate,
		Long teacherId) {
}