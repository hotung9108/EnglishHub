package com.english_hub.core.features.auth.interfaces.rest.dto;

public record AuthResponse(
		String message,
		String accessToken,
		String refreshToken,
		AuthUserResponse user) {
}