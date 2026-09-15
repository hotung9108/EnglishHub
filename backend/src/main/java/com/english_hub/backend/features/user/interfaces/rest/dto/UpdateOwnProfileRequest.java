package com.english_hub.backend.features.user.interfaces.rest.dto;

public record UpdateOwnProfileRequest(
		String fullName,
		String phone,
		String avatarUrl) {
}
