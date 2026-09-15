package com.english_hub.backend.features.user.interfaces.rest.dto;

public record CreatedUserResponse(
		String message,
		CreatedUser user) {

	public record CreatedUser(Long id, String email, String role) {
	}
}
