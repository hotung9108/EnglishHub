package com.english_hub.core.features.user.application.command;

public record UpdateOwnProfileCommand(
		String fullName,
		String phone,
		String avatarUrl) {
}
