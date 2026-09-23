package com.english_hub.core.modules.classroom.application.command;

import java.time.LocalDate;

public record UpdateClassCommand(
		String name,
		String level,
		String description,
		LocalDate endDate,
		String status,
		Long teacherId) {
}