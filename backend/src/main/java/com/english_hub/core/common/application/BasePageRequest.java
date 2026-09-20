package com.english_hub.core.common.application;

import lombok.Getter;
import lombok.Setter;

/**
 * Pagination request following the shared FE-BE contract.
 *
 * <p>Pages are 1-indexed, default {@code size} is 10 and capped at 100.</p>
 */
@Getter
@Setter
public class BasePageRequest {

	private int page = 1;

	private int size = 10;

	public void setPage(int page) {
		this.page = Math.max(page, 1);
	}

	public void setSize(int size) {
		this.size = Math.max(1, Math.min(size, 100));
	}
}