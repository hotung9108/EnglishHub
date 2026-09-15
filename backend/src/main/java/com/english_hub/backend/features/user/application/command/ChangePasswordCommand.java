package com.english_hub.backend.features.user.application.command;

public record ChangePasswordCommand(
		String currentPassword,
		String newPassword) {
}
