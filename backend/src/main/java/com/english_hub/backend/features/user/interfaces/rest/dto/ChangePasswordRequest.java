package com.english_hub.backend.features.user.interfaces.rest.dto;

public record ChangePasswordRequest(
		String currentPassword,
		String newPassword) {
}
