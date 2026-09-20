package com.english_hub.core.features.user.interfaces.rest.dto;

import java.time.LocalDate;
import org.springframework.lang.Nullable;

public record CreateUserRequest(
		String fullName,
		String email,
		String password,
		String role,
		@Nullable
		String specialization,
		@Nullable
		String studentCode,
		@Nullable
		LocalDate dateOfBirth,
		@Nullable
		String parentPhone) {
}
