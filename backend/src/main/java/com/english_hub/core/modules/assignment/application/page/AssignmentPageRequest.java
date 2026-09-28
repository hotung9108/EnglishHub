package com.english_hub.core.modules.assignment.application.page;

import com.english_hub.core.common.application.BasePageRequest;

/** Assignment list pagination following the API v3 page/limit contract. */
public class AssignmentPageRequest extends BasePageRequest {

	private int requestedPage = 1;
	private int requestedLimit = 20;

	public AssignmentPageRequest() {
		setPage(1);
		setLimit(20);
	}

	public AssignmentPageRequest(int page, int limit) {
		requestedPage = page;
		requestedLimit = limit;
		setPage(page);
		setLimit(limit);
	}

	@Override
	public void setPage(int page) {
		requestedPage = page;
		super.setPage(page);
	}

	public int getLimit() {
		return getSize();
	}

	public void setLimit(int limit) {
		requestedLimit = limit;
		super.setSize(limit);
	}

	public int page() {
		return getPage();
	}

	public int limit() {
		return getLimit();
	}

	public boolean isValid() {
		return requestedPage >= 1 && requestedLimit >= 1 && requestedLimit <= 100;
	}
}
