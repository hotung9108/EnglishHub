package com.english_hub.core.features.user.interfaces.rest.dto;

import lombok.EqualsAndHashCode;
import lombok.Getter;

@Getter
@EqualsAndHashCode
public class PaginationResponse {

	private final int page;
	private final int limit;
	private final long total;

	public PaginationResponse(int page, int limit, long total) {
		this.page = page;
		this.limit = limit;
		this.total = total;
	}

	public int page() {
		return page;
	}

	public int limit() {
		return limit;
	}

	public long total() {
		return total;
	}
}
