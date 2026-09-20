package com.english_hub.core.modules.auth.presentation.rest.dto;

public record AuthResponse(
		String message,
		String accessToken,
		String refreshToken,
		AuthUserResponse user) {
}