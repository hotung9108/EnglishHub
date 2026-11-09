package com.english_hub.core.modules.user.presentation.rest.dto;

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
		String parentPhone,
		@Nullable
		String role) {

	public UpdateUserRequest(
			String fullName,
			String phone,
			String specialization,
			String studentCode,
			LocalDate dateOfBirth,
			String parentPhone) {
		this(fullName, phone, specialization, studentCode, dateOfBirth, parentPhone, null);
	}
}
