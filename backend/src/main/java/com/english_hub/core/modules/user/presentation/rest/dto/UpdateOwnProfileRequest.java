package com.english_hub.core.modules.user.presentation.rest.dto;

import org.springframework.lang.Nullable;

public record UpdateOwnProfileRequest(
		@Nullable
		String fullName,
		@Nullable
		String phone,
		@Nullable
		String avatarUrl) {
}
