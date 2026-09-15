package com.english_hub.backend.features.user.application.command;

import java.time.LocalDate;

public record CreateUserCommand(
		String fullName,
		String email,
		String password,
		String role,
		String specialization,
		String studentCode,
		LocalDate dateOfBirth,
		String parentPhone) {
}
