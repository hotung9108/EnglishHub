package com.english_hub.core.modules.auth.presentation.rest.dto;

import com.english_hub.core.modules.auth.domain.model.AuthUser;

public record AuthUserResponse(long id, String fullName, String email, String role) {

	public static AuthUserResponse from(AuthUser user) {
		return new AuthUserResponse(
				user.getId(),
				user.getFullName(),
				user.getEmail(),
				user.getRole().name());
	}
}