package com.english_hub.core.modules.user.application.command;

public record ChangePasswordCommand(
		String currentPassword,
		String newPassword) {
}
