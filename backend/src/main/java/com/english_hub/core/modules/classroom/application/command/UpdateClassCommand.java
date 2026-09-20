package com.english_hub.core.modules.classroom.application.command;

import com.english_hub.core.modules.classroom.domain.model.ClassStatus;
import java.time.LocalDate;

public record UpdateClassCommand(
		String name,
		String level,
		String description,
		LocalDate endDate,
		ClassStatus status,
		Long teacherId) {
}