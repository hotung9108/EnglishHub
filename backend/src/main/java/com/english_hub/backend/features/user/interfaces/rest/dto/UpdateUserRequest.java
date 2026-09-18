package com.english_hub.backend.features.user.interfaces.rest.dto;

import java.time.LocalDate;
import org.springframework.lang.Nullable;

public record UpdateUserRequest(
		@Nullable
		String fullName,
		@Nullable
		String phone,
		@Nullable
		String specialization,
		@Nullable
		String studentCode,
		@Nullable
		LocalDate dateOfBirth,
		@Nullable
		String parentPhone) {
}
