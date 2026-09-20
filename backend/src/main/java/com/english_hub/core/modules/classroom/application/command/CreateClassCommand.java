package com.english_hub.core.modules.classroom.application.command;

import com.english_hub.core.modules.classroom.domain.model.ClassStatus;
import java.time.LocalDate;

public record CreateClassCommand(
		String name,
		String level,
		String description,
		LocalDate startDate,
		LocalDate endDate,
		Long teacherId) {
}