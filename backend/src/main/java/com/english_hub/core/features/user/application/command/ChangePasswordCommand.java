package com.english_hub.core.features.user.application.command;

public record ChangePasswordCommand(
		String currentPassword,
		String newPassword) {
}
