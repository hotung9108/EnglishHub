package com.english_hub.core.modules.user.presentation.rest.dto;

public record ChangePasswordRequest(
		String currentPassword,
		String newPassword) {
}
