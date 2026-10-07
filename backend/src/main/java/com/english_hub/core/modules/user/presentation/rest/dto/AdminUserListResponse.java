package com.english_hub.core.modules.user.presentation.rest.dto;

import java.util.List;
import lombok.EqualsAndHashCode;
import lombok.Getter;

@Getter
@EqualsAndHashCode
public class AdminUserListResponse {

	private final List<AdminUserSummary> data;
	private final PaginationResponse pagination;

	public AdminUserListResponse(List<AdminUserSummary> data, PaginationResponse pagination) {
		this.data = data;
		this.pagination = pagination;
	}

	public List<AdminUserSummary> data() {
		return data;
	}

	public PaginationResponse pagination() {
		return pagination;
	}
}
