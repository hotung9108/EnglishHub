package com.english_hub.core.features.user.application.command;

import java.time.LocalDate;

public record UpdateUserCommand(
		String fullName,
		String phone,
		String specialization,
		String studentCode,
		LocalDate dateOfBirth,
		String parentPhone) {
}
