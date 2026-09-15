package com.english_hub.backend.features.user.interfaces.rest.dto;

import java.util.List;

public record AdminUserListResponse(
		List<AdminUserSummary> data,
		PaginationResponse pagination) {
}
