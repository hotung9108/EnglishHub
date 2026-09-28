package com.english_hub.core.modules.assignment.application.command;

import java.time.OffsetDateTime;

public record UpdateAssignmentCommand(
		String title,
		String description,
		OffsetDateTime openAt,
		OffsetDateTime closeAt,
		Integer maxSubmissions) {
}
