package com.english_hub.backend.features.user.interfaces.rest.dto;

import org.springframework.lang.Nullable;

public record UpdateOwnProfileRequest(
		@Nullable
		String fullName,
		@Nullable
		String phone,
		@Nullable
		String avatarUrl) {
}
