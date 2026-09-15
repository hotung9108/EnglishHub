package com.english_hub.backend.features.user.interfaces.rest.dto;

import java.time.LocalDate;

public record CreateUserRequest(
		String fullName,
		String email,
		String password,
		String role,
		String specialization,
		String studentCode,
		LocalDate dateOfBirth,
		String parentPhone) {
}
