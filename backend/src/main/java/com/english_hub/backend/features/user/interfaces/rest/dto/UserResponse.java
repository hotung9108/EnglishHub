package com.english_hub.backend.features.user.interfaces.rest.dto;

import com.english_hub.backend.features.user.domain.model.User;
import com.english_hub.backend.features.user.domain.model.UserRole;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

public final class UserResponse {

	private UserResponse() {
	}

	public static Map<String, Object> from(User user) {
		Map<String, Object> response = new LinkedHashMap<>();
		response.put("id", user.id());
		response.put("fullName", user.fullName());
		response.put("email", user.email());
		response.put("role", user.role().name());
		response.put("status", user.status().name());

		if (user.phone() != null) {
			response.put("phone", user.phone());
		}
		if (user.avatarUrl() != null) {
			response.put("avatarUrl", user.avatarUrl());
		}
		if (user.role() == UserRole.TEACHER) {
			response.put("specialization", user.specialization());
		}
		if (user.role() == UserRole.STUDENT) {
			response.put("studentCode", user.studentCode());
			LocalDate dateOfBirth = user.dateOfBirth();
			response.put("dateOfBirth", dateOfBirth);
			response.put("parentPhone", user.parentPhone());
		}
		return response;
	}
}
