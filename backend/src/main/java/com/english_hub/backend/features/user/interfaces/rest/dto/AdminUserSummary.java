package com.english_hub.backend.features.user.interfaces.rest.dto;

import com.english_hub.backend.features.user.domain.model.User;

public record AdminUserSummary(
		Long id,
		String fullName,
		String email,
		String role,
		String status) {

	public static AdminUserSummary from(User user) {
		return new AdminUserSummary(
				user.id(),
				user.fullName(),
				user.email(),
				user.role().name(),
				user.status().name());
	}
}
