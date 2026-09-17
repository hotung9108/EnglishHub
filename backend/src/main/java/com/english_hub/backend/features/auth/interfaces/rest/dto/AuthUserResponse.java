package com.english_hub.backend.features.auth.interfaces.rest.dto;

import com.english_hub.backend.features.auth.domain.model.AuthUser;

public record AuthUserResponse(long id, String fullName, String email, String role) {

	public static AuthUserResponse from(AuthUser user) {
		return new AuthUserResponse(
				user.getId(),
				user.getFullName(),
				user.getEmail(),
				user.getRole().name());
	}
}