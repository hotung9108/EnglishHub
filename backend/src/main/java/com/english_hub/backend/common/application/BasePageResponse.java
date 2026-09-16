package com.english_hub.backend.common.application;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * Paginated response following the shared FE-BE contract.
 *
 * <p>Computed fields ({@code totalPages}, {@code hasPrevious}, {@code hasNext})
 * are derived from the supplied page, size and total element count.</p>
 *
 * @param <T> the content item type
 */
@Getter
@Setter
public class BasePageResponse<T> {

	private List<T> content;

	private int page;

	private int size;

	private long totalElements;

	private int totalPages;

	private boolean hasPrevious;

	private boolean hasNext;

	public BasePageResponse() {
	}

	public BasePageResponse(List<T> content, int page, int size, long totalElements) {
		this.content = content;
		this.page = page;
		this.size = size;
		this.totalElements = totalElements;
		this.totalPages = (int) Math.ceil((double) totalElements / Math.max(size, 1));
		this.hasPrevious = page > 1;
		this.hasNext = page < totalPages;
	}

	public static <T> BasePageResponse<T> of(List<T> content, int page, int size, long totalElements) {
		return new BasePageResponse<>(content, page, size, totalElements);
	}
}