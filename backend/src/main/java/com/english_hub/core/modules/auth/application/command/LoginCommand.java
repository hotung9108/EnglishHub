package com.english_hub.core.modules.auth.application.command;

public record LoginCommand(
		String email,
		String password,
		String userAgent,
		String ipAddress) {
}