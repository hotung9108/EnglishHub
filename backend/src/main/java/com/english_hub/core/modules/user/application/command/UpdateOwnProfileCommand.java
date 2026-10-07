package com.english_hub.core.modules.user.application.command;

public record UpdateOwnProfileCommand(
		String fullName,
		String phone,
		String avatarUrl) {
}
