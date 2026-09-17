package com.english_hub.backend.features.auth.application.command;

public record LoginCommand(
		String email,
		String password,
		String userAgent,
		String ipAddress) {
}