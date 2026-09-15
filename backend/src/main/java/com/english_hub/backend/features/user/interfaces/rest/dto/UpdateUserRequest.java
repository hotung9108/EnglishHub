package com.english_hub.backend.features.user.interfaces.rest.dto;

import java.time.LocalDate;

public record UpdateUserRequest(
		String fullName,
		String phone,
		String specialization,
		String studentCode,
		LocalDate dateOfBirth,
		String parentPhone) {
}
