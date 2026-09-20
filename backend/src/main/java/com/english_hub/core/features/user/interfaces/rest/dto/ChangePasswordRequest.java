package com.english_hub.core.features.user.interfaces.rest.dto;

public record ChangePasswordRequest(
		String currentPassword,
		String newPassword) {
}
