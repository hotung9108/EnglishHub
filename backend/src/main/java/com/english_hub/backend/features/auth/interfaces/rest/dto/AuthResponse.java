package com.english_hub.backend.features.auth.interfaces.rest.dto;

public record AuthResponse(
		String message,
		String accessToken,
		String refreshToken,
		AuthUserResponse user) {
}