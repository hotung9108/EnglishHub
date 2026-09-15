package com.english_hub.backend.features.user.application.command;

public record UpdateOwnProfileCommand(
		String fullName,
		String phone,
		String avatarUrl) {
}
